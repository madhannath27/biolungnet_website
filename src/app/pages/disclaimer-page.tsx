import { useState } from "react";
import { useNavigate } from "react-router";
import { NavLogo } from "../components/NavLogo";

export function DisclaimerPage() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="bln-page-in" style={{ minHeight: "100vh", background: "var(--dark)" }}>
      <nav className="bln-nav">
        <NavLogo />
        <div />
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
        <div className="bln-stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,184,75,.06)", border: "2px solid rgba(255,184,75,.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "bln-glow 3s ease-in-out infinite", boxShadow: "0 0 30px rgba(255,184,75,.12)" }}>
              <svg width="34" height="34" fill="none" viewBox="0 0 24 24" stroke="var(--warning)" strokeWidth="2">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h1 style={{ fontFamily: "var(--fd)", fontSize: 28, letterSpacing: 3, color: "var(--text)" }}>MEDICAL DISCLAIMER</h1>
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 8 }}>Please read carefully before proceeding</p>
          </div>

          {/* Warning card */}
          <div style={{ background: "rgba(255,184,75,.05)", border: "1px solid rgba(255,184,75,.2)", borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontFamily: "var(--fd)", fontSize: 12, color: "var(--warning)", letterSpacing: 1, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--warning)" strokeWidth="2"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
              IMPORTANT NOTICE
            </h3>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 14 }}>
              This AI-powered tool assists healthcare professionals and is <strong style={{ color: "var(--warning)" }}>NOT</strong> a substitute for professional medical advice, diagnosis, or treatment.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Results are for informational and educational purposes only",
                "All scan results must be reviewed by qualified medical professionals",
                "Do not rely solely on AI analysis for any medical decisions",
                "Always seek your physician's advice for any medical questions",
                "The creators bear no liability for decisions made based on these results",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "var(--muted)" }}>
                  <span style={{ color: "var(--warning)", flexShrink: 0, marginTop: 2 }}>▸</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Privacy card */}
          <div style={{ background: "rgba(57,255,106,.04)", border: "1px solid rgba(57,255,106,.14)", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontFamily: "var(--fd)", fontSize: 11, color: "var(--neon)", letterSpacing: 1, marginBottom: 8 }}>◈ DATA PRIVACY & SECURITY</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
              Your medical images and data are stored securely with strict access controls. All data transmissions use end-to-end encryption. You retain full ownership of your uploaded scans and can delete them at any time.
            </p>
          </div>

          {/* Agree checkbox */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 20, background: "rgba(57,255,106,.03)", border: `1.5px solid ${agreed ? "rgba(57,255,106,.4)" : "rgba(57,255,106,.14)"}`, borderRadius: 12, transition: "border-color .25s", cursor: "none" }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--neon)", flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
              I have read and understood the medical disclaimer. I agree this tool is for assistance purposes only and will consult qualified healthcare professionals for all medical decisions.
            </span>
          </label>

          {/* Actions */}
          <div style={{ display: "flex", gap: 14 }}>
            <button className="bln-btn bln-btn-g" style={{ padding: "14px 28px" }} onClick={() => navigate("/")}>← BACK</button>
            <button disabled={!agreed} className="bln-btn bln-btn-p bln-btn-lg" style={{ flex: 1, justifyContent: "center" }} onClick={() => navigate("/profile-setup")}>
              I AGREE — CONTINUE →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
