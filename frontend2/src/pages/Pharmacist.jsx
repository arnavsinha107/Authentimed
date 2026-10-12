import { useState, useRef } from "react";
import ResultCard from "../components/ResultCard";
import { API_BASE } from "../config";

export default function Pharmacist() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (incomingFile) => {
    if (incomingFile && incomingFile.type.startsWith("image/")) {
      setFile(incomingFile);
      setPreviewUrl(URL.createObjectURL(incomingFile));
      setResult(null);
    } else {
      alert("Please upload a valid image (PNG, JPG, JPEG).");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleVerify = async () => {
    if (!file) {
      alert("Please select or drop a medicine package image first.");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/pharmacist/verify`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        "Final Verdict": "ERROR",
        "Reason": "Unable to contact verification backend on port 5001.",
      });
    }

    setLoading(false);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Pharmacist Portal</h1>
        <p className="page-subtitle">
          Perform point-of-dispensary intake scans. Decodes serial QR signatures, validates batch provenance,
          and marks the medicine as officially verified on the Ethereum blockchain.
        </p>
      </div>

      <div className="portal-grid">
        {/* Left Column: Intake Actions */}
        <div className="portal-flow-col">
          {/* Step 1: Upload Image */}
          <div className="step-card">
            <div className="step-header">
              <div className="step-number" style={{ background: "rgba(129, 140, 248, 0.15)", borderColor: "rgba(129, 140, 248, 0.3)", color: "var(--indigo-400)" }}>
                1
              </div>
              <h2 className="step-title">Scan Medicine Box / Blister</h2>
            </div>
            <p className="step-desc">
              Upload a photograph of the pharmaceutical packaging showing the serialized QR code or batch label.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFileChange(e.target.files[0])}
            />

            {!file ? (
              <div
                className={`upload-dropzone ${isDragging ? "drag-active" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="dropzone-icon" style={{ background: "rgba(129, 140, 248, 0.12)", borderColor: "rgba(129, 140, 248, 0.25)", color: "var(--indigo-400)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="18" x="3" y="3" rx="2"/>
                    <path d="M7 7h.01"/>
                    <path d="M17 7h.01"/>
                    <path d="M7 17h.01"/>
                    <path d="M17 17h.01"/>
                  </svg>
                </div>
                <div className="dropzone-prompt">
                  <span>Browse intake scan</span> or drop packaging image
                </div>
                <div className="dropzone-hint">Supports high-res camera captures (JPG, PNG, WEBP)</div>
              </div>
            ) : (
              <div className="file-selected-preview" style={{ background: "rgba(129, 140, 248, 0.08)", borderColor: "rgba(129, 140, 248, 0.3)" }}>
                {previewUrl && <img src={previewUrl} alt="Intake preview" className="preview-thumb" />}
                <div className="preview-meta">
                  <div className="preview-name">{file.name}</div>
                  <div className="preview-size">{(file.size / 1024).toFixed(1)} KB • Image Loaded</div>
                </div>
                <button type="button" className="preview-remove" onClick={removeFile}>
                  Replace
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Verify & Activate */}
          <div className="step-card">
            <div className="step-header">
              <div className="step-number" style={{ background: "rgba(129, 140, 248, 0.15)", borderColor: "rgba(129, 140, 248, 0.3)", color: "var(--indigo-400)" }}>
                2
              </div>
              <h2 className="step-title">Execute Verification & State Change</h2>
            </div>
            <p className="step-desc">
              Checks against counterfeit replicas, prevents duplicate distribution, and logs the mandatory pharmacist scan in PostgreSQL and Ethereum.
            </p>

            <button
              className="btn-primary btn-indigo"
              onClick={handleVerify}
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Verifying Package & Updating Ledger...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                  <span>Verify Batch & Activate Distribution</span>
                </>
              )}
            </button>
          </div>

          {/* Verdict Result */}
          {result && (
            <div className="result-card-container">
              <ResultCard result={result} />
            </div>
          )}
        </div>

        {/* Right Column: Protocol Rules */}
        <div className="portal-flow-col">
          <div className="portal-info-card">
            <h3 className="info-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <polyline points="16 11 18 13 22 9"/>
              </svg>
              Pharmacist Intake Rules
            </h3>
            <p className="info-card-text">
              Ensures authentic chain-of-custody before medicine reaches retail consumers.
            </p>

            <div className="info-steps-list">
              <div className="info-step-item">
                <div className="info-step-bullet" style={{ background: "rgba(129, 140, 248, 0.15)", color: "var(--indigo-400)" }}>✓</div>
                <div className="info-step-text">
                  <strong>One-Time Activation</strong>
                  <span>Each serialized product can only be activated by an authorized pharmacist once.</span>
                </div>
              </div>

              <div className="info-step-item">
                <div className="info-step-bullet" style={{ background: "rgba(129, 140, 248, 0.15)", color: "var(--indigo-400)" }}>✓</div>
                <div className="info-step-text">
                  <strong>State 0 ➔ State 1 Transition</strong>
                  <span>Transitions smart contract status from "Registered" to "Verified By Pharmacist".</span>
                </div>
              </div>

              <div className="info-step-item">
                <div className="info-step-bullet" style={{ background: "rgba(129, 140, 248, 0.15)", color: "var(--indigo-400)" }}>✓</div>
                <div className="info-step-text">
                  <strong>Consumer Prerequisite</strong>
                  <span>Consumer scans will flag UNVERIFIED warning if this intake scan was never completed.</span>
                </div>
              </div>
            </div>

            <div className="blockchain-badge-box">
              <div className="badge-box-label">Enforced Rule</div>
              <div className="badge-box-value" style={{ color: "var(--indigo-400)" }}>
                <code>pharmacist_scans.product_id PRIMARY KEY</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
