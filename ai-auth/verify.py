import cv2
import numpy as np
from pyzbar.pyzbar import decode

TOLERANCES = {
    "blur": 0.15,
    "color": 85.0,
    "centroid_norm": 0.18,  # Normalized ratio [0.0, 1.0], independent of resolution
    "correlation": 0.40,
}


def _mask_qr_regions(image):
    """
    Detect QR code locations on an image of any dimension and return a binary mask
    where packaging artwork is 255 and variable QR code pixels are 0.
    """
    h, w = image.shape[:2]
    mask = np.ones((h, w), dtype=np.uint8) * 255

    # 1. OpenCV QRCodeDetector
    try:
        detector = cv2.QRCodeDetector()
        ret, _, points, _ = detector.detectAndDecodeMulti(image)
        if points is not None and len(points) > 0:
            for pts in points:
                pts = pts.astype(int)
                x_min = max(0, pts[:, 0].min() - 8)
                y_min = max(0, pts[:, 1].min() - 8)
                x_max = min(w, pts[:, 0].max() + 8)
                y_max = min(h, pts[:, 1].max() + 8)
                mask[y_min:y_max, x_min:x_max] = 0
            return mask
    except Exception:
        pass

    # 2. Pyzbar decode
    try:
        decoded = decode(image)
        if decoded:
            for d in decoded:
                rect = d.rect
                x_min = max(0, rect.left - 8)
                y_min = max(0, rect.top - 8)
                x_max = min(w, rect.left + rect.width + 8)
                y_max = min(h, rect.top + rect.height + 8)
                mask[y_min:y_max, x_min:x_max] = 0
            return mask
    except Exception:
        pass

    return mask


def extract_features(image):
    """
    Extract size-invariant packaging features.
    Centroid is normalized to [0.0, 1.0] relative to image dimensions.
    """
    if image is None:
        return 0.0, np.array([0.0, 0.0, 0.0]), np.array([0.5, 0.5])

    h, w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    blur = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    color = image.mean(axis=(0, 1))

    # Mask QR if present
    mask = _mask_qr_regions(image)

    # Compute edges across entire packaging artwork (not hardcoded sub-box)
    edges = cv2.bitwise_and(cv2.Canny(gray, 50, 150), mask)
    ys, xs = np.where(edges > 0)

    if len(xs) == 0:
        norm_centroid = np.array([0.5, 0.5])
    else:
        # Normalized coordinates [0.0, 1.0] - completely invariant to image size!
        norm_centroid = np.array([float(xs.mean() / w), float(ys.mean() / h)])

    return blur, color, norm_centroid


def verify_packaging(scan_path, template_path):
    """
    Robust packaging verification working for ANY template of ANY size and aspect ratio.
    Removes hardcoded coordinates and normalizes scale, color, and structural features.
    """
    scan_img = cv2.imread(scan_path)
    template_img = cv2.imread(template_path)

    if scan_img is None or template_img is None:
        return False

    th, tw = template_img.shape[:2]

    # Normalize scan image to template resolution for spatial comparison
    scan_aligned = cv2.resize(scan_img, (tw, th), interpolation=cv2.INTER_AREA)

    # Mask out QR code areas on template & scan so unique serialized codes don't cause false mismatch
    template_mask = _mask_qr_regions(template_img)
    scan_mask = _mask_qr_regions(scan_aligned)
    combined_mask = cv2.bitwise_and(template_mask, scan_mask)

    # Ensure mask has enough valid packaging pixels
    if cv2.countNonZero(combined_mask) < (tw * th * 0.25):
        combined_mask = np.ones((th, tw), dtype=np.uint8) * 255

    # 1. Blur / Sharpness check
    scan_gray = cv2.cvtColor(scan_aligned, cv2.COLOR_BGR2GRAY)
    scan_blur = float(cv2.Laplacian(scan_gray, cv2.CV_64F).var())
    template_blur = float(cv2.Laplacian(cv2.cvtColor(template_img, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var())

    if scan_blur < 5.0 and scan_blur < (template_blur * TOLERANCES["blur"]):
        return False

    # 2. Chromatic / Color difference on non-QR artwork
    scan_color = np.array(cv2.mean(scan_aligned, mask=combined_mask)[:3])
    template_color = np.array(cv2.mean(template_img, mask=combined_mask)[:3])
    color_dist = float(np.linalg.norm(scan_color - template_color))

    # 3. Normalized Edge Distribution & Centroid (size-invariant [0.0, 1.0])
    edges_s = cv2.bitwise_and(cv2.Canny(scan_gray, 50, 150), combined_mask)
    edges_t = cv2.bitwise_and(cv2.Canny(cv2.cvtColor(template_img, cv2.COLOR_BGR2GRAY), 50, 150), combined_mask)

    ys_s, xs_s = np.where(edges_s > 0)
    ys_t, xs_t = np.where(edges_t > 0)

    centroid_dist_norm = 1.0
    if len(xs_s) > 0 and len(xs_t) > 0:
        cent_s = np.array([xs_s.mean() / tw, ys_s.mean() / th])
        cent_t = np.array([xs_t.mean() / tw, ys_t.mean() / th])
        centroid_dist_norm = float(np.linalg.norm(cent_s - cent_t))

    # 4. Normalized Cross-Correlation on masked non-QR artwork
    corr_score = -1.0
    try:
        corr_res = cv2.matchTemplate(scan_aligned, template_img, cv2.TM_CCOEFF_NORMED, mask=combined_mask)
        corr_score = float(corr_res[0][0])
    except Exception:
        pass

    # 5. Scale & Rotation-Invariant ORB Keypoint Matching
    good_matches = 0
    try:
        orb = cv2.ORB_create(nfeatures=700)
        kp_t, des_t = orb.detectAndCompute(template_img, combined_mask)
        kp_s, des_s = orb.detectAndCompute(scan_img, None)

        if des_t is not None and des_s is not None and len(des_t) > 0 and len(des_s) > 0:
            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
            matches = bf.match(des_t, des_s)
            good_matches = len([m for m in matches if m.distance < 55])
    except Exception:
        pass

    # Multi-factor authentication decision:
    # High visual correlation OR robust keypoint matches + consistent color profile
    is_genuine = (
        (corr_score >= 0.45 and color_dist < TOLERANCES["color"]) or
        (good_matches >= 18 and color_dist < 90.0 and centroid_dist_norm < 0.22) or
        (centroid_dist_norm < 0.08 and color_dist < 65.0 and corr_score >= 0.20)
    )

    return is_genuine
