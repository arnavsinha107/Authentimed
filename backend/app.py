from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys

_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

import re
import uuid
import qrcode
import psycopg2
from PIL import Image
from dotenv import load_dotenv

from db import (
    init_db,
    insert_product,
    get_product_by_id,
    get_product_by_pan_code,
    get_pharmacist_scan,
    record_pharmacist_scan,
    get_any_consumer_scan,
    record_consumer_scan,
    record_scan,
    get_scan_info,
)
from qr_overlay import replace_qr
from qr_extractor import extract_qr_data
from ai_verifier import verify_packaging
from code_generator import generate_unique_code
from id_generation import generate_hidden_code_image
from revealer import reveal_channels
from extractor import extract_code_safe
from blockchain import (
    register_product,
    verify_product,
    get_manufacturer,
    get_product_state,
)



# =====================================================
# 🔷 Load Environment
# =====================================================

load_dotenv()


# =====================================================
# 🔷 Utility
# =====================================================

def is_valid_product_id(product_id):
    pattern = r"^MEDICINEX-[a-f0-9]{8}$"
    return re.match(pattern, product_id) is not None


def _normalize_pan_code(code):
    """Normalize strip/PAN code for comparison and DB lookup."""
    if not code:
        return ""
    return str(code).strip().upper()


def _is_likely_qr_or_strip_only(scan_path):
    """
    True if image is a focused crop of the QR code or optical strip rather than the complete medicine packaging.
    Determined invariant to resolution using QR area coverage ratio and aspect ratio.
    """
    try:
        from pyzbar.pyzbar import decode
        import cv2

        img = cv2.imread(scan_path)
        if img is None:
            return False

        h, w = img.shape[:2]
        total_area = float(w * h)

        # Check QR code coverage ratio
        decoded = decode(img)
        if decoded:
            rect = decoded[0].rect
            qr_area = float(rect.width * rect.height)
            coverage = qr_area / total_area
            # If QR occupies > 30% of total image area, it is a QR-only crop
            if coverage > 0.30:
                return True

        # Check for strip-like aspect ratio (typically very elongated)
        aspect = max(w / float(h), h / float(w))
        if aspect > 3.0:
            return True

        # Fallback for very small icon-sized images
        if max(w, h) < 250:
            return True

        return False
    except Exception:
        return False


# =====================================================
# 🔷 App Setup
# =====================================================

app = Flask(__name__)
CORS(app)

# Init DB when possible. App still runs if PostgreSQL is down.
try:
    init_db()
    print("DB: connected")
except psycopg2.OperationalError as e:
    print("DB not available:", str(e))

# Folder structure inside backend/
UPLOAD_FOLDER = "uploads"
TEMPLATE_FOLDER = "templates"
TEMP_FOLDER = "temp"
GENERATED_DIR = "generated"
GENERATED_QR = os.path.join(GENERATED_DIR, "qr")
GENERATED_PACKAGED = os.path.join(GENERATED_DIR, "packaged")
GENERATED_HIDDEN = os.path.join(GENERATED_DIR, "hidden")
GENERATED_REVEALS = os.path.join(GENERATED_DIR, "reveals")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TEMPLATE_FOLDER, exist_ok=True)
os.makedirs(TEMP_FOLDER, exist_ok=True)
os.makedirs(GENERATED_QR, exist_ok=True)
os.makedirs(GENERATED_PACKAGED, exist_ok=True)
os.makedirs(GENERATED_HIDDEN, exist_ok=True)
os.makedirs(GENERATED_REVEALS, exist_ok=True)


# =====================================================
# 🔷 Health Check
# =====================================================

@app.route("/", methods=["GET"])
def home():
    return "Authentimed Backend Running (Sepolia Mode)"


# =====================================================
# 🔷 Manufacturer: Generate Product
# =====================================================

@app.route("/manufacturer/generate", methods=["POST"])


def generate_product():
    try:
        owner_address = os.getenv("OWNER_ADDRESS")
        manufacturer = owner_address

        # Save uploaded template if provided
        if "file" in request.files and request.files["file"].filename:
            f = request.files["file"]
            template_path = os.path.join(TEMPLATE_FOLDER, f"{owner_address}.png")
            f.save(template_path)
            print("Template saved at:", template_path)

        # Template must exist (either just saved or already on disk)
        template_path = os.path.join(TEMPLATE_FOLDER, f"{owner_address}.png")
        print("OWNER_ADDRESS:", owner_address)
        print("Looking for template at:", template_path)
        print("Exists:", os.path.exists(template_path))

        if not os.path.exists(template_path):
            return jsonify({"error": "Template not registered. Upload a packaging template image."}), 400

        product_id = f"MEDICINEX-{uuid.uuid4().hex[:8]}"

        qr_path = os.path.join(GENERATED_QR, f"{product_id}.png")
        img = qrcode.make(product_id)
        img.save(qr_path)

        qr_x = request.form.get("qr_x", type=float)
        qr_y = request.form.get("qr_y", type=float)
        qr_size = request.form.get("qr_size", type=float)
        replace_qr(template_path, qr_path, output_path, qr_x=qr_x, qr_y=qr_y, qr_size=qr_size)

        # Embedded (PAN) strip code: unique in DB, encode to hidden image
        pan_code = generate_unique_code()
        hidden_path = os.path.join(GENERATED_HIDDEN, f"{product_id}_hidden.png")
        generate_hidden_code_image(code=pan_code, output_path=hidden_path)

        # Store all reveals for this product in a folder: reveals/{product_id}/
        reveals_dir = os.path.join(GENERATED_REVEALS, product_id)
        os.makedirs(reveals_dir, exist_ok=True)
        reveal_paths = reveal_channels(hidden_path, output_dir=reveals_dir, prefix="")

        # Store product_id <-> pan_code in DB first (so verification can look up even if chain fails)
        insert_product(product_id, pan_code)

        tx_result = register_product(product_id)
        print("TX Result:", tx_result)

        if not tx_result["success"]:
            return jsonify({"error": tx_result["error"]}), 400

        def rel(full_path, subdir):
            return f"/generated/{subdir}/{os.path.basename(full_path)}"

        def rel_reveal(basename):
            return f"/generated/reveals/{product_id}/{basename}"

        images_payload = {
            "packaged": rel(output_path, "packaged"),
            "hidden": rel(hidden_path, "hidden"),
            "red_reveal": rel_reveal("red_reveal.png"),
            "blue_reveal": rel_reveal("blue_reveal.png"),
            "green_reveal": rel_reveal("green_reveal.png"),
        }

        return jsonify({
            "Product ID": product_id,
            "Strip code": pan_code,
            "Manufacturer ID": manufacturer,
            "Status": "Registered On-Chain",
            "Linked": "QR and strip code are mapped for this product (one identity).",
            "Packaged Image": rel(output_path, "packaged"),
            "images": images_payload,
        }), 200

    except psycopg2.OperationalError as e:
        return jsonify({
            "error": "Database unavailable. Start PostgreSQL or set DATABASE_URL.",
            "detail": str(e)
        }), 503
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =====================================================
# 🔷 Pharmacist Verification (QR or strip, like consumer; one scan per product; connected code = flagged)
# =====================================================

@app.route("/pharmacist/verify", methods=["POST"])
def pharmacist_verify():
    try:
        if "file" not in request.files or not request.files["file"].filename:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        scan_path = os.path.join(TEMP_FOLDER, file.filename)
        file.save(scan_path)

        # Accept either QR or strip (like consumer); one verification per product — if already scanned via one, the other is flagged
        product_id = (extract_qr_data(scan_path) or "").strip()
        if product_id and is_valid_product_id(product_id):
            factor = "qr"
        else:
            product_id = None
            extracted = extract_code_safe(scan_path)
            if extracted and len(extracted) == 10:
                norm_code = _normalize_pan_code(extracted)
                product_row = get_product_by_pan_code(norm_code)
                if product_row:
                    product_id = product_row.get("product_id")
                    factor = "strip"
        if not product_id:
            os.remove(scan_path)
            return jsonify({
                "Final Verdict": "COUNTERFEIT",
                "Reason": "No valid QR or strip code found in image",
            }), 200

        # Mandatory: cross-verify with products table — only manufacturer-issued codes are valid
        # Product ID and strip code are linked; same product whether QR or strip was scanned
        product_id_clean = str(product_id).strip()
        product = get_product_by_id(product_id_clean)
        if not product or (product.get("product_id") or "").strip() != product_id_clean:
            os.remove(scan_path)
            return jsonify({
                "Final Verdict": "COUNTERFEIT",
                "Reason": "Product not issued by manufacturer (not in products table)",
                "Product ID": product_id_clean,
                "Flag": "Unknown product - QR/strip not from our system",
            }), 200
        product_id = (product.get("product_id") or product_id_clean).strip()
        strip_code = product.get("pan_code") or product.get("PAN_CODE")

        # Cross-verify: must be registered on blockchain
        manufacturer = get_manufacturer(product_id)
        if manufacturer == "0x0000000000000000000000000000000000000000":
            if os.path.exists(scan_path):
                os.remove(scan_path)
            return jsonify({
                "Final Verdict": "COUNTERFEIT",
                "Reason": "Product not registered on blockchain (zero manufacturer address)",
                "Product ID": product_id,
                "Strip code": strip_code,
                "Flag": "Product not on chain",
            }), 200

        # Query smart contract lifecycle state: 0 = NONE, 1 = VALID, 2 = REPLAYED
        state = get_product_state(product_id)
        if state == 0:
            if os.path.exists(scan_path):
                os.remove(scan_path)
            return jsonify({
                "Final Verdict": "COUNTERFEIT",
                "Reason": "Product not registered on blockchain (State: NONE)",
                "Product ID": product_id,
                "Strip code": strip_code,
                "Flag": "Product not registered on chain",
            }), 200

        # -----------------------------------------------------------------
        # 🛡️ REPLAY DETECTION GUARD
        # Check both PostgreSQL pharmacist_scans and Ethereum State.REPLAYED
        # -----------------------------------------------------------------
        existing = get_pharmacist_scan(product_id)
        if existing or state == 2:
            if os.path.exists(scan_path):
                os.remove(scan_path)

            initial_time = existing.get("scanned_at") if existing else None
            record_scan(product_id, initial_time=initial_time)
            scan_info = get_scan_info(product_id)
            count = scan_info.get("scan_count", 2) if scan_info else 2

            first_time_str = (
                scan_info["first_scan_time"].strftime("%Y-%m-%d %H:%M:%S UTC")
                if scan_info and scan_info.get("first_scan_time")
                else (
                    existing.get("scanned_at").strftime("%Y-%m-%d %H:%M:%S UTC")
                    if existing and existing.get("scanned_at")
                    else "Previously recorded"
                )
            )
            last_time_str = (
                scan_info["last_scan_time"].strftime("%Y-%m-%d %H:%M:%S UTC")
                if scan_info and scan_info.get("last_scan_time")
                else "Just now"
            )

            return jsonify({
                "Final Verdict": "COUNTERFEIT",
                "Status": "REPLAY_DETECTED",
                "Flag": "Replay attack detected: duplicate pharmacist scan",
                "Reason": "REPLAY ATTACK DETECTED: This serialized medicine was already verified by a pharmacist and claimed on the Ethereum Sepolia ledger. Duplicate or clone scan rejected.",
                "Product ID": product_id,
                "Strip code": strip_code,
                "Scan Count": count,
                "First Scan": first_time_str,
                "Last Scan": last_time_str,
                "Factor": factor,
                "Blockchain State": "REPLAYED (State 2)",
            }), 200

        # If state is neither 0, 1, nor 2
        if state != 1:
            if os.path.exists(scan_path):
                os.remove(scan_path)
            return jsonify({
                "Final Verdict": "COUNTERFEIT",
                "Reason": f"Unrecognized product state on-chain (State: {state})",
                "Product ID": product_id,
                "Strip code": strip_code,
            }), 200

        # Run AI packaging check only for fresh unverified packages
        if factor == "strip":
            run_ai = False  # strip image is never the full pack; skip AI
        else:
            run_ai = not _is_likely_qr_or_strip_only(scan_path)
        if run_ai:
            template_path = os.path.join(TEMPLATE_FOLDER, f"{manufacturer}.png")
            if not os.path.exists(template_path):
                template_files = os.listdir(TEMPLATE_FOLDER)
                template_path = os.path.join(TEMPLATE_FOLDER, template_files[-1]) if template_files else None
            if template_path and os.path.exists(template_path):
                ai_pass = verify_packaging(scan_path, template_path)
                if not ai_pass:
                    if os.path.exists(scan_path):
                        os.remove(scan_path)
                    return jsonify({
                        "Final Verdict": "COUNTERFEIT",
                        "Reason": "Packaging check failed (AI): image does not match manufacturer template",
                        "Product ID": product_id,
                        "Strip code": strip_code,
                        "Flag": "Packaging verification failed",
                    }), 200

        if os.path.exists(scan_path):
            os.remove(scan_path)

        # Transition smart contract state from VALID (1) to REPLAYED (2)
        tx_result = verify_product(product_id)
        if not tx_result["success"]:
            return jsonify({
                "Final Verdict": "COUNTERFEIT",
                "Reason": tx_result.get("error", "Blockchain transaction failed"),
                "Product ID": product_id,
                "Strip code": strip_code,
            }), 200

        # Record scan in DB tables
        record_pharmacist_scan(product_id)
        record_scan(product_id)
        scan_info = get_scan_info(product_id)

        first_time_str = (
            scan_info["first_scan_time"].strftime("%Y-%m-%d %H:%M:%S UTC")
            if scan_info and scan_info.get("first_scan_time")
            else "Just now"
        )

        tx_hash = None
        if tx_result.get("receipt"):
            rcpt = tx_result["receipt"]
            th = rcpt.get("transactionHash") if isinstance(rcpt, dict) else getattr(rcpt, "transactionHash", None)
            if th:
                tx_hash = th.hex() if hasattr(th, "hex") else str(th)

        return jsonify({
            "Final Verdict": "GENUINE",
            "Status": "Verified By Pharmacist",
            "Scan Status": "First pharmacist scan",
            "Reason": "Packaging verified and claimed on Ethereum Sepolia ledger.",
            "Product ID": product_id,
            "Strip code": strip_code,
            "Factor": factor,
            "Scan Count": 1,
            "First Scan": first_time_str,
            "Last Scan": first_time_str,
            "Tx Hash": tx_hash,
            "Blockchain State": "Transitioned to REPLAYED (State 2)",
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =====================================================
# 🔷 Consumer Verification (full pack, QR only, or strip – one verification per product; second scan flagged)
# =====================================================

@app.route("/consumer/verify", methods=["POST"])
def consumer_verify():
    try:
        product_id = None
        factor = None

        if "file" not in request.files or not request.files["file"].filename:
            return jsonify({"error": "Upload an image (full pack with QR, QR only, or strip) to verify"}), 400

        file = request.files["file"]
        scan_path = os.path.join(TEMP_FOLDER, file.filename)
        file.save(scan_path)

        # Accept full package (QR visible), QR-only image, or strip-only image
        product_id = (extract_qr_data(scan_path) or "").strip()
        if product_id and is_valid_product_id(product_id):
            factor = "qr"
        else:
            product_id = None
            extracted = extract_code_safe(scan_path)
            if extracted and len(extracted) == 10:
                norm_code = _normalize_pan_code(extracted)
                product_row = get_product_by_pan_code(norm_code)
                if product_row:
                    product_id = product_row.get("product_id")
                    factor = "strip"
                else:
                    os.remove(scan_path)
                    return jsonify({
                        "Final Verdict": "COUNTERFEIT",
                        "Reason": "Strip code not issued by manufacturer (not in database)",
                        "Flag": "Unknown strip code - not from our system",
                    }), 200
        if not product_id:
            os.remove(scan_path)
            return jsonify({
                "Final Verdict": "COUNTERFEIT",
                "Reason": "No valid QR or strip code found in image",
            }), 200

        try:
            if os.path.exists(scan_path):
                os.remove(scan_path)
        except Exception:
            pass

        # Mandatory: cross-verify with products table — only manufacturer-issued codes are valid
        # Product ID and strip code are linked; same product whether QR or strip was scanned
        product_id_clean = str(product_id).strip()
        product = get_product_by_id(product_id_clean)
        if not product or (product.get("product_id") or "").strip() != product_id_clean:
            return jsonify({
                "Final Verdict": "COUNTERFEIT",
                "Reason": "Product not issued by manufacturer (not in products table)",
                "Product ID": product_id_clean,
                "Flag": "Unknown product - QR/strip not from our system",
            }), 200
        product_id = (product.get("product_id") or product_id_clean).strip()
        strip_code = product.get("pan_code") or product.get("PAN_CODE")

        # Cross-verify: must be registered on blockchain
        if get_manufacturer(product_id) == "0x0000000000000000000000000000000000000000":
            return jsonify({
                "Final Verdict": "COUNTERFEIT",
                "Reason": "Not registered on blockchain",
                "Product ID": product_id,
                "Strip code": strip_code,
                "Flag": "Product not on chain",
            }), 200

        pharmacist_scan = get_pharmacist_scan(product_id)
        if not pharmacist_scan:
            return jsonify({
                "Final Verdict": "UNVERIFIED",
                "Message": "Never scanned by pharmacist",
                "Product ID": product_id,
                "Strip code": strip_code,
            }), 200

        state = get_product_state(product_id)
        if state == 1:
            return jsonify({
                "Final Verdict": "UNVERIFIED",
                "Message": "Never scanned by pharmacist",
                "Product ID": product_id,
                "Strip code": strip_code,
            }), 200

        # One verification per product: if already scanned (QR or strip), flag
        existing = get_any_consumer_scan(product_id)
        if existing:
            record_scan(product_id)
            scan_info = get_scan_info(product_id)
            count = scan_info.get("scan_count", 2) if scan_info else 2
            first_time_str = (
                scan_info["first_scan_time"].strftime("%Y-%m-%d %H:%M:%S UTC")
                if scan_info and scan_info.get("first_scan_time")
                else (
                    existing.get("scanned_at").strftime("%Y-%m-%d %H:%M:%S UTC")
                    if existing and existing.get("scanned_at")
                    else "Previously recorded"
                )
            )
            last_time_str = (
                scan_info["last_scan_time"].strftime("%Y-%m-%d %H:%M:%S UTC")
                if scan_info and scan_info.get("last_scan_time")
                else "Just now"
            )
            return jsonify({
                "Final Verdict": "COUNTERFEIT",
                "Status": "REPLAY_DETECTED",
                "Reason": "REPLAY ATTACK DETECTED: This medicine unit was already verified and dispensed. Secondary consumer verification is prohibited.",
                "Product ID": product_id,
                "Strip code": strip_code,
                "Flag": "Duplicate consumer verification / Replay attack",
                "Scan Count": count,
                "First Scan": first_time_str,
                "Last Scan": last_time_str,
                "Factor": factor,
            }), 200

        record_consumer_scan(product_id, factor)
        record_scan(product_id)
        scan_info = get_scan_info(product_id)

        first_time_str = (
            scan_info["first_scan_time"].strftime("%Y-%m-%d %H:%M:%S UTC")
            if scan_info and scan_info.get("first_scan_time")
            else (
                pharmacist_scan.get("scanned_at").strftime("%Y-%m-%d %H:%M:%S UTC")
                if pharmacist_scan and hasattr(pharmacist_scan.get("scanned_at"), "strftime")
                else str(pharmacist_scan.get("scanned_at", ""))
            )
        )

        return jsonify({
            "Final Verdict": "VERIFIED",
            "Status": "Consumer Verified",
            "Product ID": product_id,
            "Strip code": strip_code,
            "Factor": factor,
            "First Scan Time": pharmacist_scan.get("scanned_at"),
            "Scan Count": scan_info.get("scan_count", 1) if scan_info else 1,
            "First Scan": first_time_str,
            "Last Scan": first_time_str,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =====================================================
# 🔷 Serve QR Images
# =====================================================

@app.route("/generated/<path:filename>")
def serve_generated(filename):
    """Serve generated images from backend/generated/ (qr, packaged, hidden, reveals)."""
    return send_from_directory(GENERATED_DIR, filename)


# =====================================================
# 🔷 Run
# =====================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
