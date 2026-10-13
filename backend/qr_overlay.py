import cv2
import numpy as np
from pyzbar.pyzbar import decode


def detect_template_qr_box(package):
    """
    Detect existing QR code or square placeholder box on a packaging template of any size.
    Returns (x, y, size) or None.
    """
    h, w = package.shape[:2]

    # 1. OpenCV QRCodeDetector
    try:
        detector = cv2.QRCodeDetector()
        retval, decoded_info, points, _ = detector.detectAndDecodeMulti(package)
        if points is not None and len(points) > 0:
            pts = points[0].astype(int)
            x_min, y_min = pts[:, 0].min(), pts[:, 1].min()
            x_max, y_max = pts[:, 0].max(), pts[:, 1].max()
            detected_size = max(x_max - x_min, y_max - y_min)
            if detected_size >= 16:
                x = max(0, min(int(x_min), w - detected_size))
                y = max(0, min(int(y_min), h - detected_size))
                return x, y, detected_size
    except Exception:
        pass

    # 2. Pyzbar decode fallback
    try:
        decoded = decode(package)
        if decoded:
            rect = decoded[0].rect
            detected_size = max(rect.width, rect.height)
            if detected_size >= 16:
                x = max(0, min(int(rect.left), w - detected_size))
                y = max(0, min(int(rect.top), h - detected_size))
                return x, y, detected_size
    except Exception:
        pass

    # 3. Contour detection for candidate square placeholder frame
    try:
        gray = cv2.cvtColor(package, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 40, 140)
        contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        min_dim = min(w, h)
        min_area = (min_dim * 0.07) ** 2
        max_area = (max(w, h) * 0.45) ** 2

        best_cand = None
        for cnt in contours:
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
            if len(approx) == 4 and cv2.isContourConvex(approx):
                bx, by, bw, bh = cv2.boundingRect(approx)
                area = bw * bh
                if min_area <= area <= max_area and 0.82 <= (bw / float(bh)) <= 1.22:
                    cand_size = max(bw, bh)
                    if best_cand is None or area < best_cand[2] * best_cand[2]:
                        best_cand = (bx, by, cand_size)

        if best_cand:
            bx, by, bsize = best_cand
            x = max(0, min(int(bx), w - bsize))
            y = max(0, min(int(by), h - bsize))
            return x, y, bsize
    except Exception:
        pass

    return None


def calculate_adaptive_qr_box(package_shape, qr_x=None, qr_y=None, qr_size=None):
    """
    Calculate dynamic QR placement bounding box for any template dimension without hardcoded coordinates.
    """
    h, w = package_shape[:2]
    min_dim = min(w, h)

    # If explicit coordinates or ratios provided
    if qr_x is not None and qr_y is not None:
        target_size = qr_size if qr_size is not None else int(round(min_dim * 0.22))
        if 0 < target_size < 1.0:
            target_size = int(target_size * min_dim)
        target_size = max(32, min(int(target_size), min_dim))

        tx = int(qr_x * w) if 0 < qr_x < 1.0 else int(qr_x)
        ty = int(qr_y * h) if 0 < qr_y < 1.0 else int(qr_y)
        x = max(0, min(tx, w - target_size))
        y = max(0, min(ty, h - target_size))
        return x, y, target_size

    # Dynamic adaptive placement based on template size & aspect ratio
    # Scaled proportionally to min dimension (standard 20-22% QR footprint)
    target_size = int(round(min_dim * 0.22))
    target_size = max(48, min(target_size, min_dim - 16))

    margin_x = max(8, int(round(w * 0.04)))
    margin_y = max(8, int(round(h * 0.04)))

    # Position in bottom-right corner with proportional padding
    x = max(0, min(w - target_size - margin_x, w - target_size))
    y = max(0, min(h - target_size - margin_y, h - target_size))

    return x, y, target_size


def replace_qr(package_image_path, new_qr_path, output_path, qr_x=None, qr_y=None, qr_size=None):
    """
    Overlay new QR code onto any template image of any size.
    Dynamically identifies existing QR placeholder or computes optimal non-clipping placement.
    """
    package = cv2.imread(package_image_path)
    new_qr = cv2.imread(new_qr_path)

    if package is None or new_qr is None:
        return False

    h, w = package.shape[:2]

    # Check for explicit position first
    if qr_x is not None and qr_y is not None:
        x_start, y_start, target_size = calculate_adaptive_qr_box(package.shape, qr_x, qr_y, qr_size)
    else:
        # Detect existing QR location on template if present
        detected = detect_template_qr_box(package)
        if detected:
            x_start, y_start, target_size = detected
        else:
            x_start, y_start, target_size = calculate_adaptive_qr_box(package.shape)

    # Resize QR to match computed size
    new_qr_resized = cv2.resize(new_qr, (target_size, target_size), interpolation=cv2.INTER_AREA)

    # Ensure clean overlay within boundary limits
    x_end = min(w, x_start + target_size)
    y_end = min(h, y_start + target_size)
    patch_w = x_end - x_start
    patch_h = y_end - y_start

    package[y_start:y_end, x_start:x_end] = new_qr_resized[:patch_h, :patch_w, :3]

    cv2.imwrite(output_path, package)
    return True
