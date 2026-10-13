import { useNavigate } from "react-router-dom";

export default function DashboardSelect() {
  const navigate = useNavigate();

  return (
    <div className="page-container dashboard-hub">
      {/* Top Hero Banner */}
      <div className="hub-hero-banner">
        <div className="hub-hero-text">
          <h1>Decentralized Supply Chain Hub</h1>
          <p>
            Select your operating persona to authenticate, verify, or register pharmaceuticals
            using AI visual steganography and Ethereum Sepolia smart contracts.
          </p>
        </div>

        <div className="hub-quick-stats">
          <div className="stat-box">
            <span className="stat-value">100%</span>
            <span className="stat-label">Replay Immune</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">Sepolia</span>
            <span className="stat-label">Chain ID 11155111</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">2-Factor</span>
            <span className="stat-label">QR + Physical Strip</span>
          </div>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="hub-cards-grid">
        {/* Manufacturer Card */}
        <div
          className="hub-card theme-manufacturer"
          onClick={() => navigate("/manufacturer")}
          role="button"
          tabIndex={0}
        >
          <div className="hub-card-header">
            <div className="hub-card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="16" height="16" x="4" y="4" rx="2"/>
                <rect width="6" height="6" x="9" y="9" rx="1"/>
                <path d="M15 2v2"/>
                <path d="M15 20v2"/>
                <path d="M2 15h2"/>
                <path d="M2 9h2"/>
                <path d="M20 15h2"/>
                <path d="M20 9h2"/>
                <path d="M9 2v2"/>
                <path d="M9 20v2"/>
              </svg>
            </div>
            <span className="hub-card-step">Stage 01</span>
          </div>

          <div className="hub-card-body">
            <h3>Manufacturer Portal</h3>
            <p>
              Generate cryptographically serialized QR codes, embed 3-channel steganographic watermarks into packaging, and inscribe batches on-chain.
            </p>

            <ul className="hub-card-features">
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Unique Batch UUID & QR Serialization
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                RGB Channel Steganography Watermarking
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Sepolia Smart Contract Inscription
              </li>
            </ul>
          </div>

          <div className="hub-card-footer">
            <span>Enter Manufacturer Suite</span>
            <div className="hub-card-arrow">→</div>
          </div>
        </div>

        {/* Pharmacist Card */}
        <div
          className="hub-card theme-pharmacist"
          onClick={() => navigate("/pharmacist")}
          role="button"
          tabIndex={0}
        >
          <div className="hub-card-header">
            <div className="hub-card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
                <path d="m8.5 8.5 7 7"/>
              </svg>
            </div>
            <span className="hub-card-step">Stage 02</span>
          </div>

          <div className="hub-card-body">
            <h3>Pharmacist Portal</h3>
            <p>
              Execute mandatory primary verification upon dispensary intake, preventing unauthorized diverted stock and activating products on the blockchain.
            </p>

            <ul className="hub-card-features">
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Point-of-Dispensary First Verification
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Cryptographic Packaging QR Reading
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Supply-Chain State Transition Trigger
              </li>
            </ul>
          </div>

          <div className="hub-card-footer">
            <span>Enter Pharmacist Portal</span>
            <div className="hub-card-arrow">→</div>
          </div>
        </div>

        {/* Consumer Card */}
        <div
          className="hub-card theme-consumer"
          onClick={() => navigate("/consumer")}
          role="button"
          tabIndex={0}
        >
          <div className="hub-card-header">
            <div className="hub-card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <span className="hub-card-step">Stage 03</span>
          </div>

          <div className="hub-card-body">
            <h3>Consumer Authenticator</h3>
            <p>
              Instant counterfeit detection for patients. Validates both QR code and physical blister strip code to ensure 100% genuine medicine.
            </p>

            <ul className="hub-card-features">
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Dual-Factor Verification (QR + Strip)
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Replay Attack & Duplicate Alerting
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Live Provenance & Scan Audit Record
              </li>
            </ul>
          </div>

          <div className="hub-card-footer">
            <span>Enter Consumer Portal</span>
            <div className="hub-card-arrow">→</div>
          </div>
        </div>
      </div>
    </div>
  );
}
