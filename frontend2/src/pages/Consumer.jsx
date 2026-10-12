import { useState, useRef } from "react";
import ResultCard from "../components/ResultCard";
import { API_BASE } from "../config";

export default function Consumer() {
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
      alert("Please select a valid image file (PNG, JPG, JPEG).");
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
      alert("Please upload a medicine packaging photo or blister strip image.");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/consumer/verify`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        "Final Verdict": "ERROR",
        "Reason": "Verification backend unavailable. Check server status.",
      });
    }

    setLoading(false);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Consumer Authenticator</h1>
        <p className="page-subtitle">
          Instantly verify if your medication is 100% genuine before consumption.
          Validates the serialized QR signature and decodes embedded strip text against Ethereum Sepolia.
        </p>
      </div>

      <div className="portal-grid">
        {/* Left Column: Consumer Verification */}
        <div className="portal-flow-col">
          {/* Step 1: Upload Medicine Image */}
          <div className="step-card">
            <div className="step-header">
              <div className="step-number" style={{ background: "rgba(14, 165, 233, 0.15)", borderColor: "rgba(14, 165, 233, 0.3)", color: "var(--cyan-400)" }}>
                1
              </div>
              <h2 className="step-title">Upload Medicine Box or Blister Strip</h2>
            </div>
            <p className="step-desc">
              Take a clear snapshot of the outer box QR code, or upload the blister strip showing the embedded security pattern.
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
                <div className="dropzone-icon" style={{ background: "rgba(14, 165, 233, 0.12)", borderColor: "rgba(14, 165, 233, 0.25)", color: "var(--cyan-400)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                <div className="dropzone-prompt">
                  <span>Browse photo</span> or drag packaging snapshot
                </div>
                <div className="dropzone-hint">Supports phone camera photos, box scans, and blister crops</div>
              </div>
            ) : (
              <div className="file-selected-preview" style={{ background: "rgba(14, 165, 233, 0.08)", borderColor: "rgba(14, 165, 233, 0.3)" }}>
                {previewUrl && <img src={previewUrl} alt="Consumer preview" className="preview-thumb" />}
                <div className="preview-meta">
                  <div className="preview-name">{file.name}</div>
                  <div className="preview-size">{(file.size / 1024).toFixed(1)} KB • Snapshot Ready</div>
                </div>
                <button type="button" className="preview-remove" onClick={removeFile}>
                  Change Photo
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Run Verification */}
          <div className="step-card">
            <div className="step-header">
              <div className="step-number" style={{ background: "rgba(14, 165, 233, 0.15)", borderColor: "rgba(14, 165, 233, 0.3)", color: "var(--cyan-400)" }}>
                2
              </div>
              <h2 className="step-title">Run Cryptographic Authenticity Audit</h2>
            </div>
            <p className="step-desc">
              Executes OpenCV optical channel extraction, verifies smart contract lifecycle state, and checks for replay duplicates.
            </p>

            <button
              className="btn-primary btn-cyan"
              onClick={handleVerify}
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Running AI Optical & Blockchain Verification...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <span>Authenticate Medicine Now</span>
                </>
              )}
            </button>
          </div>

          {/* Verdict Output */}
          {result && (
            <div className="result-card-container">
              <ResultCard result={result} />
            </div>
          )}
        </div>

        {/* Right Column: Consumer Guide */}
        <div className="portal-flow-col">
          <div className="portal-info-card">
            <h3 className="info-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              Dual-Factor Security Protection
            </h3>
            <p className="info-card-text">
              AuthentiMed prevents packaging counterfeiting and clone attacks using dual factors:
            </p>

            <div className="info-steps-list">
              <div className="info-step-item">
                <div className="info-step-bullet" style={{ background: "rgba(14, 165, 233, 0.15)", color: "var(--cyan-400)" }}>1</div>
                <div className="info-step-text">
                  <strong>Factor A: Serialized Packaging QR</strong>
                  <span>Outer box QR tied uniquely to the manufacturer's cryptographic key.</span>
                </div>
              </div>

              <div className="info-step-item">
                <div className="info-step-bullet" style={{ background: "rgba(14, 165, 233, 0.15)", color: "var(--cyan-400)" }}>2</div>
                <div className="info-step-text">
                  <strong>Factor B: Embedded Physical Strip Code</strong>
                  <span>Inside blister strip pattern decoded via RGB channel separation.</span>
                </div>
              </div>

              <div className="info-step-item">
                <div className="info-step-bullet" style={{ background: "rgba(14, 165, 233, 0.15)", color: "var(--cyan-400)" }}>3</div>
                <div className="info-step-text">
                  <strong>Replay Detection</strong>
                  <span>If a stolen QR or cloned packaging is scanned multiple times, an immediate warning triggers.</span>
                </div>
              </div>
            </div>

            <div className="blockchain-badge-box">
              <div className="badge-box-label">Audit Engine</div>
              <div className="badge-box-value" style={{ color: "var(--cyan-400)" }}>
                OpenCV Channel Deconvolution + Sepolia Smart Contract
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
