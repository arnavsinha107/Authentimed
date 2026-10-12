import { useState, useRef } from "react";
import { API_BASE } from "../config";

export default function Manufacturer() {
  const [templateFile, setTemplateFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (file && file.type.startsWith("image/")) {
      setTemplateFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    } else {
      alert("Please upload a valid image file (PNG, JPG, JPEG).");
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
    setTemplateFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!templateFile) {
      alert("Please select a packaging template image first.");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", templateFile);

    try {
      const res = await fetch(`${API_BASE}/manufacturer/generate`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: "Backend connection failed. Verify server status on port 5001." });
    }

    setLoading(false);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Manufacturer Portal</h1>
        <p className="page-subtitle">
          Embed tamper-evident QR serialization and hidden 3-channel optical steganography
          into product packaging, then inscribe cryptographic ownership on Ethereum Sepolia.
        </p>
      </div>

      <div className="portal-grid">
        {/* Left Column: Actions */}
        <div className="portal-flow-col">
          {/* Step 1: Upload Packaging Template */}
          <div className="step-card">
            <div className="step-header">
              <div className="step-number">1</div>
              <h2 className="step-title">Upload Packaging Template</h2>
            </div>
            <p className="step-desc">
              Select or drop the base artwork or blank box template. The system will composite the serialized QR code and encode the hidden security strip.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFileChange(e.target.files[0])}
            />

            {!templateFile ? (
              <div
                className={`upload-dropzone ${isDragging ? "drag-active" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="dropzone-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div className="dropzone-prompt">
                  <span>Click to browse</span> or drop template image here
                </div>
                <div className="dropzone-hint">PNG, JPG, or WEBP (recommended minimum 800×600px)</div>
              </div>
            ) : (
              <div className="file-selected-preview">
                {previewUrl && <img src={previewUrl} alt="Template thumbnail" className="preview-thumb" />}
                <div className="preview-meta">
                  <div className="preview-name">{templateFile.name}</div>
                  <div className="preview-size">{(templateFile.size / 1024).toFixed(1)} KB • Image Template Ready</div>
                </div>
                <button type="button" className="preview-remove" onClick={removeFile}>
                  Change File
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Generate & Inscribe */}
          <div className="step-card">
            <div className="step-header">
              <div className="step-number">2</div>
              <h2 className="step-title">Generate & Inscribe on Ethereum</h2>
            </div>
            <p className="step-desc">
              Executes Python OpenCV steganography and broadcasts a <code>registerProduct(productId)</code> transaction to the Sepolia smart contract.
            </p>

            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={!templateFile || loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  <span>Generating Assets & Transacting on Sepolia...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  <span>Generate Packaging & Register Batch</span>
                </>
              )}
            </button>
          </div>

          {/* Result Presentation */}
          {result && (
            <div className="result-card-container">
              {result.error ? (
                <div className="result-card verdict-fake">
                  <div className="verdict-header">
                    <div className="verdict-icon-box">✕</div>
                    <div>
                      <h3 className="verdict-title">Registration Encountered An Error</h3>
                      <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>{result.error}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="result-card verdict-genuine">
                  <div className="verdict-header">
                    <div className="verdict-icon-box">✓</div>
                    <div>
                      <h3 className="verdict-title">Batch Successfully Inscribed</h3>
                      <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                        Smart contract record verified on Ethereum Sepolia.
                      </p>
                    </div>
                    <span className="verdict-badge">On-Chain Confirmed</span>
                  </div>

                  <div className="result-meta-grid">
                    <div className="meta-item">
                      <div className="meta-label">Assigned Product ID</div>
                      <div className="meta-val" style={{ color: "var(--emerald-400)", fontWeight: "700" }}>
                        {result["Product ID"]}
                      </div>
                    </div>

                    <div className="meta-item">
                      <div className="meta-label">PAN Security Code</div>
                      <div className="meta-val">
                        {result["PAN Code"] || result.pan_code || "Extracted from hidden channel"}
                      </div>
                    </div>

                    <div className="meta-item">
                      <div className="meta-label">Blockchain State</div>
                      <div className="meta-val">
                        {result["Status"] || "Registered (State 0)"}
                      </div>
                    </div>

                    <div className="meta-item">
                      <div className="meta-label">Manufacturer Address</div>
                      <div className="meta-val" style={{ fontSize: "12px" }}>
                        {result["Manufacturer"] || "0x90F7...b906"}
                      </div>
                    </div>
                  </div>

                  {/* Artifacts Grid */}
                  <div className="result-artifacts">
                    <div className="artifacts-title">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                        <circle cx="9" cy="9" r="2"/>
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                      </svg>
                      Generated Packaging & Optical Security Channels
                    </div>

                    <div className="artifact-grid">
                      {result["Packaged Image"] && (
                        <div className="artifact-card">
                          <img
                            src={`${API_BASE}/${result["Packaged Image"]}`}
                            alt="Composited Packaging with QR"
                          />
                          <span className="artifact-label">Packaged Box (with QR)</span>
                          <a
                            href={`${API_BASE}/${result["Packaged Image"]}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ textAlign: "center", fontSize: "12px", color: "var(--emerald-400)", textDecoration: "none" }}
                          >
                            Open Full Res ↗
                          </a>
                        </div>
                      )}

                      {result.images?.hidden && (
                        <div className="artifact-card">
                          <img
                            src={`${API_BASE}${result.images.hidden}`}
                            alt="Hidden Steganography Image"
                          />
                          <span className="artifact-label">Stego Carrier Strip</span>
                        </div>
                      )}

                      {result.images?.red_reveal && (
                        <div className="artifact-card">
                          <img
                            src={`${API_BASE}${result.images.red_reveal}`}
                            alt="Red Channel Reveal"
                          />
                          <span className="artifact-label">Red Channel Reveal</span>
                        </div>
                      )}

                      {result.images?.blue_reveal && (
                        <div className="artifact-card">
                          <img
                            src={`${API_BASE}${result.images.blue_reveal}`}
                            alt="Blue Channel Reveal"
                          />
                          <span className="artifact-label">Blue Channel Reveal</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Specification & Smart Contract Details */}
        <div className="portal-flow-col">
          <div className="portal-info-card">
            <h3 className="info-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Manufacturing Protocol
            </h3>
            <p className="info-card-text">
              Every pharmaceutical unit undergoes serialization before leaving the authorized facility.
            </p>

            <div className="info-steps-list">
              <div className="info-step-item">
                <div className="info-step-bullet">1</div>
                <div className="info-step-text">
                  <strong>Unique UUID Assignment</strong>
                  <span>Generates a standardized <code>MEDICINEX-[hash]</code> product identifier.</span>
                </div>
              </div>

              <div className="info-step-item">
                <div className="info-step-bullet">2</div>
                <div className="info-step-text">
                  <strong>Multi-Channel Embedding</strong>
                  <span>Synthesizes a 10-character PAN security string split across RGB pixel frequencies.</span>
                </div>
              </div>

              <div className="info-step-item">
                <div className="info-step-bullet">3</div>
                <div className="info-step-text">
                  <strong>On-Chain Registration</strong>
                  <span>Calls <code>registerProduct()</code> on Ethereum Sepolia contract <code>0xc9d8...77c6</code>.</span>
                </div>
              </div>
            </div>

            <div className="blockchain-badge-box">
              <div className="badge-box-label">Target Smart Contract (Sepolia)</div>
              <div className="badge-box-value">0xc9d80E54970558025ACE45c0751E039A533777c6</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
