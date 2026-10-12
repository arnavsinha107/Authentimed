import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      {/* Hero Section */}
      <div style={{ padding: "40px 0 60px", textAlign: "center", maxWidth: "900px", margin: "0 auto" }}>
        <h1 className="page-title" style={{ fontSize: "56px", lineHeight: "1.1", marginBottom: "20px" }}>
          Next-Gen Verification for Global Pharmaceuticals
        </h1>

        <p className="page-subtitle" style={{ fontSize: "19px", margin: "0 auto 36px", maxWidth: "720px" }}>
          Protect patients and eliminate counterfeit drugs by fusing OpenCV optical steganography,
          tamper-evident QR serialization, and Ethereum Sepolia blockchain state validation.
        </p>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <button
            className="btn-primary"
            style={{ width: "auto", padding: "16px 36px" }}
            onClick={() => navigate("/dashboard")}
          >
            Launch System Hub →
          </button>
          <button
            className="btn-primary btn-cyan"
            style={{ width: "auto", padding: "16px 32px", background: "rgba(15, 23, 42, 0.8)", border: "1px solid var(--border-light)" }}
            onClick={() => navigate("/consumer")}
          >
            Verify a Medicine
          </button>
        </div>
      </div>

      {/* 3 Step Workflow Preview */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px",
        margin: "30px 0 60px"
      }}>
        <div className="step-card">
          <div className="step-header">
            <div className="step-number">1</div>
            <h3 className="step-title">Manufacturer Encodes</h3>
          </div>
          <p className="step-desc">
            Product UUID is inscribed onto Ethereum Sepolia. A 3-channel RGB steganographic code is generated and merged with packaging.
          </p>
        </div>

        <div className="step-card">
          <div className="step-header">
            <div className="step-number" style={{ background: "rgba(129, 140, 248, 0.15)", borderColor: "rgba(129, 140, 248, 0.3)", color: "var(--indigo-400)" }}>2</div>
            <h3 className="step-title">Pharmacist Activates</h3>
          </div>
          <p className="step-desc">
            Dispensaries perform the mandatory initial scan upon inventory intake, triggering on-chain product activation and preventing diversion.
          </p>
        </div>

        <div className="step-card">
          <div className="step-header">
            <div className="step-number" style={{ background: "rgba(56, 189, 248, 0.15)", borderColor: "rgba(56, 189, 248, 0.3)", color: "var(--cyan-400)" }}>3</div>
            <h3 className="step-title">Consumer Validates</h3>
          </div>
          <p className="step-desc">
            Patients scan the blister strip or box. The system verifies the QR signature, decodes embedded strip text, and checks replay history.
          </p>
        </div>
      </div>

      {/* Role Navigation Cards */}
      <div style={{ marginTop: "40px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: "700", marginBottom: "24px", textAlign: "center" }}>
          Select Operating Persona
        </h2>

        <div className="hub-cards-grid">
          <div className="hub-card theme-manufacturer" onClick={() => navigate("/manufacturer")}>
            <div className="hub-card-header">
              <div className="hub-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="16" height="16" x="4" y="4" rx="2"/>
                  <rect width="6" height="6" x="9" y="9" rx="1"/>
                  <path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/>
                  <path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>
                </svg>
              </div>
              <span className="hub-card-step">Manufacturing</span>
            </div>
            <div className="hub-card-body">
              <h3>Manufacturer Portal</h3>
              <p>Upload packaging artwork, generate batch QR codes, and publish records to the Sepolia smart contract.</p>
            </div>
            <div className="hub-card-footer">
              <span>Open Portal</span>
              <div className="hub-card-arrow">→</div>
            </div>
          </div>

          <div className="hub-card theme-pharmacist" onClick={() => navigate("/pharmacist")}>
            <div className="hub-card-header">
              <div className="hub-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
                  <path d="m8.5 8.5 7 7"/>
                </svg>
              </div>
              <span className="hub-card-step">Distribution</span>
            </div>
            <div className="hub-card-body">
              <h3>Pharmacist Portal</h3>
              <p>Scan received batches to activate genuine products before dispensing to consumers.</p>
            </div>
            <div className="hub-card-footer">
              <span>Open Portal</span>
              <div className="hub-card-arrow">→</div>
            </div>
          </div>

          <div className="hub-card theme-consumer" onClick={() => navigate("/consumer")}>
            <div className="hub-card-header">
              <div className="hub-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <span className="hub-card-step">End User</span>
            </div>
            <div className="hub-card-body">
              <h3>Consumer Scanner</h3>
              <p>Verify dual-factor authentic packaging and check instant on-chain authenticity.</p>
            </div>
            <div className="hub-card-footer">
              <span>Open Portal</span>
              <div className="hub-card-arrow">→</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
