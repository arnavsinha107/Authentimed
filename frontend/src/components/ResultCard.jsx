import { API_BASE } from "../config";

export default function ResultCard({ result }) {
  if (!result) return null;

  const verdict = result["Final Verdict"];
  const status = result["Status"];
  const reason = result["Reason"];
  const isGenuine = verdict === "GENUINE" || verdict === "VERIFIED" || status === "Registered On-Chain";
  const isWarning = verdict === "UNVERIFIED";
  const isFake = verdict === "COUNTERFEIT" || verdict === "ERROR" || (!isGenuine && !isWarning);

  let cardStyleClass = "verdict-neutral";
  let verdictTitle = "SCAN RESULT";
  let iconSymbol = "ℹ";
  let badgeLabel = "AUDIT COMPLETE";

  if (isGenuine) {
    cardStyleClass = "verdict-genuine";
    verdictTitle = status === "Registered On-Chain" ? "PRODUCT REGISTERED ON-CHAIN" : "GENUINE PRODUCT CONFIRMED";
    iconSymbol = "✓";
    badgeLabel = "AUTHENTICATED";
  } else if (isWarning) {
    cardStyleClass = "verdict-warning";
    verdictTitle = "AWAITING PHARMACIST VERIFICATION";
    iconSymbol = "⚠";
    badgeLabel = "UNVERIFIED STOCK";
  } else if (isFake) {
    cardStyleClass = "verdict-fake";
    verdictTitle = "COUNTERFEIT ALERT DETECTED";
    iconSymbol = "✕";
    badgeLabel = "SECURITY VIOLATION";
  }

  // Scan metadata helpers
  const productId = result["Product ID"] || result.product_id;
  const stripCode = result["Strip code"] || result["PAN Code"] || result.strip_code || result.pan_code;
  const scanCount = result["Scan Count"] || result.scan_count;
  const firstScan = result["First Scan"] || result.first_scan_time;
  const lastScan = result["Last Scan"] || result.last_scan_time;

  return (
    <div className={`result-card ${cardStyleClass}`}>
      <div className="verdict-header">
        <div className="verdict-icon-box">{iconSymbol}</div>
        <div>
          <h3 className="verdict-title">{verdictTitle}</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "2px" }}>
            {reason || result["Message"] || (isGenuine ? "Passed dual-factor OpenCV & Sepolia blockchain validation." : "Verification failed or mismatched parameters.")}
          </p>
        </div>
        <span className="verdict-badge">{badgeLabel}</span>
      </div>

      {/* Metadata Grid */}
      <div className="result-meta-grid">
        {productId && (
          <div className="meta-item">
            <div className="meta-label">Product Identifier</div>
            <div className="meta-val" style={{ color: "var(--emerald-400)", fontWeight: "700" }}>
              {productId}
            </div>
          </div>
        )}

        {stripCode && (
          <div className="meta-item">
            <div className="meta-label">Decoded Strip Code</div>
            <div className="meta-val" style={{ letterSpacing: "1px" }}>
              {stripCode}
            </div>
          </div>
        )}

        {result["Verification Type"] && (
          <div className="meta-item">
            <div className="meta-label">Verification Type</div>
            <div className="meta-val">{result["Verification Type"]}</div>
          </div>
        )}

        {scanCount !== undefined && scanCount !== null && (
          <div className="meta-item">
            <div className="meta-label">Scan History Count</div>
            <div className="meta-val">{scanCount} time(s)</div>
          </div>
        )}

        {firstScan && (
          <div className="meta-item">
            <div className="meta-label">First Recorded Scan</div>
            <div className="meta-val" style={{ fontSize: "12px" }}>{String(firstScan)}</div>
          </div>
        )}

        {lastScan && (
          <div className="meta-item">
            <div className="meta-label">Latest Recorded Scan</div>
            <div className="meta-val" style={{ fontSize: "12px" }}>{String(lastScan)}</div>
          </div>
        )}
      </div>

      {/* Optical Channels / Artifacts */}
      {result.images && Object.keys(result.images).length > 0 && (
        <div className="result-artifacts">
          <div className="artifacts-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Computer Vision Decomposition Channels
          </div>

          <div className="artifact-grid">
            {result.images.packaged && (
              <div className="artifact-card">
                <img src={`${API_BASE}${result.images.packaged}`} alt="Packaged" />
                <span className="artifact-label">Packaged Box</span>
              </div>
            )}
            {result.images.hidden && (
              <div className="artifact-card">
                <img src={`${API_BASE}${result.images.hidden}`} alt="Stego Strip" />
                <span className="artifact-label">Optical Stego Strip</span>
              </div>
            )}
            {result.images.red_reveal && (
              <div className="artifact-card">
                <img src={`${API_BASE}${result.images.red_reveal}`} alt="Red Channel" />
                <span className="artifact-label">Red Channel Extract</span>
              </div>
            )}
            {result.images.blue_reveal && (
              <div className="artifact-card">
                <img src={`${API_BASE}${result.images.blue_reveal}`} alt="Blue Channel" />
                <span className="artifact-label">Blue Channel Extract</span>
              </div>
            )}
            {result.images.green_reveal && (
              <div className="artifact-card">
                <img src={`${API_BASE}${result.images.green_reveal}`} alt="Green Channel" />
                <span className="artifact-label">Green Channel Extract</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
