import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { NavLogo } from "../components/NavLogo";

export function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile]       = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback((f: File | null | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/") && !f.name.endsWith(".dcm")) {
      alert("Please upload a PNG, JPG, JPEG, or DICOM file.");
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const startAnalysis = () => {
    if (!file) return;
    sessionStorage.setItem("blnScanFile",    file.name);
    sessionStorage.setItem("blnScanPreview", preview || "");
    navigate("/processing");
  };

  return (
    <div className="bln-page-in" style={{ minHeight: "100vh", background: "var(--dark)" }}>
      <nav className="bln-nav">
        <NavLogo />
        <div className="bln-nav-actions">
          <button className="bln-btn bln-btn-g bln-btn-sm" onClick={() => navigate("/dashboard")}>DASHBOARD</button>
          <button className="bln-btn bln-btn-g bln-btn-sm" onClick={async () => { const { supabase } = await import("../../lib/supabase"); await supabase.auth.signOut(); navigate("/"); }}>LOGOUT</button>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px" }}>
        <div className="bln-stagger">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h1 style={{ fontFamily: "var(--fd)", fontSize: 26, letterSpacing: 3, color: "var(--neon)", textShadow: "var(--glow)", marginBottom: 8 }}>UPLOAD MEDICAL SCAN</h1>
            <p style={{ color: "var(--muted)", fontSize: 15 }}>Drag & drop your CT scan or chest X-ray for neural AI analysis</p>
          </div>

          {/* Drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => !file && document.getElementById("bln-file-input")?.click()}
            style={{
              border: `2px dashed ${dragging ? "var(--neon)" : "rgba(57,255,106,.25)"}`,
              borderRadius: 14, padding: 52,
              textAlign: "center",
              background: dragging ? "rgba(57,255,106,.06)" : "rgba(57,255,106,.02)",
              transition: "all .3s cubic-bezier(.22,1,.36,1)",
              position: "relative", overflow: "hidden",
              cursor: file ? "default" : "none",
              boxShadow: dragging ? "var(--glow)" : "none",
            }}
          >
            {!file ? (
              <div>
                <div style={{ width: 80, height: 80, border: "2px solid rgba(57,255,106,.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "bln-float 4s ease-in-out infinite", boxShadow: "var(--glow)" }}>
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="var(--neon)" strokeWidth="1.5">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p style={{ fontSize: 16, color: "var(--muted)" }}><strong style={{ color: "var(--neon)" }}>Click to upload</strong> or drag and drop</p>
                <p style={{ fontSize: 13, color: "var(--dim)", marginTop: 6 }}>PNG, JPG, JPEG, or DICOM — up to 50MB</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
                  {["PNG", "JPG", "JPEG", "DICOM"].map(f => (
                    <span key={f} style={{ background: "rgba(57,255,106,.06)", color: "var(--neon)", border: "1px solid rgba(57,255,106,.25)", borderRadius: 100, padding: "5px 16px", fontFamily: "var(--fd)", fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>{f}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div onClick={e => e.stopPropagation()} style={{ position: "relative", display: "inline-block" }}>
                {preview
                  ? <img src={preview} alt="Scan preview" style={{ maxHeight: 380, maxWidth: "100%", borderRadius: 10, objectFit: "contain", boxShadow: "0 0 30px rgba(57,255,106,.15)" }} />
                  : <div style={{ padding: "40px 80px", background: "rgba(57,255,106,.05)", borderRadius: 10, color: "var(--muted)" }}>📄 {file.name}</div>
                }
                <button
                  className="bln-btn bln-btn-d"
                  style={{ position: "absolute", top: 10, right: 10, width: 36, height: 36, padding: 0, justifyContent: "center", borderRadius: "50%", boxShadow: "0 0 14px rgba(255,68,102,.4)" }}
                  onClick={() => { setFile(null); setPreview(null); }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            )}
          </div>

          <input id="bln-file-input" type="file" accept="image/png,image/jpeg,image/jpg,.dcm" style={{ display: "none" }} onChange={e => processFile(e.target.files?.[0])} />

          {/* Tips */}
          <div style={{ background: "rgba(57,255,106,.04)", border: "1px solid rgba(57,255,106,.12)", borderRadius: 12, padding: 20, marginTop: 20 }}>
            <p style={{ fontFamily: "var(--fd)", fontSize: 10, letterSpacing: 2, color: "var(--dim)", marginBottom: 12 }}>FOR BEST RESULTS</p>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {["High resolution (≥512×512)", "Proper contrast & brightness", "Remove personal identifiers", "CT scans & X-rays accepted"].map(tip => (
                <div key={tip} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)" }}>
                  <span style={{ color: "var(--neon)", fontSize: 8 }}>◆</span>{tip}
                </div>
              ))}
            </div>
          </div>

          {/* Analyze button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 28 }}>
            <button disabled={!file} className="bln-btn bln-btn-p bln-btn-lg" style={{ minWidth: 220, justifyContent: "center" }} onClick={startAnalysis}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              ANALYZE SCAN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
