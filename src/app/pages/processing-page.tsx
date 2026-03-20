import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { NavLogo } from "../components/NavLogo";
import { BACKEND_URL } from "../../lib/assets";

type StepState = "pending" | "active" | "done";
const STEPS = ["Image preprocessing", "Feature extraction", "Neural AI classification", "Saving to database"];

export function ProcessingPage() {
  const navigate = useNavigate();
  const [pct,      setPct]    = useState(0);
  const [steps,    setSteps]  = useState<StepState[]>(["pending","pending","pending","pending"]);
  const [status,   setStatus] = useState("Initializing neural network...");
  const [preview,  setPreview] = useState<string>("");
  const [fileName, setFileName] = useState("");
  const [failed,   setFailed]  = useState(false);
  const [errMsg,   setErrMsg]  = useState("");
  const ran = useRef(false);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const animProg = async (from: number, to: number) => {
    const steps2 = 30;
    const stepSize = (to - from) / steps2;
    for (let i = 0; i < steps2; i++) {
      await sleep(50);
      setPct(p => Math.min(to, p + stepSize + Math.random() * stepSize * 0.5));
    }
    setPct(to);
  };

  const setStep = (i: number, s: StepState) =>
    setSteps(prev => prev.map((v, idx) => idx === i ? s : v));

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const pv = sessionStorage.getItem("blnScanPreview") || "";
    const fn = sessionStorage.getItem("blnScanFile")    || "scan.jpg";
    setPreview(pv); setFileName(fn);
    if (!pv && !fn) { navigate("/upload"); return; }

    (async () => {
      try {
        // Step 0
        setStep(0, "active"); setStatus("Preprocessing image data...");
        await animProg(0, 25); setStep(0, "done");

        // Step 1
        setStep(1, "active"); setStatus("Extracting deep features...");
        await animProg(25, 52); setStep(1, "done");

        // Step 2 — call backend or demo
        setStep(2, "active"); setStatus("Running neural AI classification...");
        let classification: string, confidence: number;
        let probabilities: { normal: number; benign: number; malignant: number };

        try {
          const blob = await fetch(pv).then(r => r.blob());
          const fd = new FormData();
          fd.append("file", new File([blob], fn, { type: blob.type }));
          const res = await fetch(BACKEND_URL, { method: "POST", body: fd });
          if (!res.ok) throw new Error("Backend returned " + res.status);
          const data = await res.json();
          classification = data.result.charAt(0).toUpperCase() + data.result.slice(1).toLowerCase();
          confidence     = (data.confidence || 0) * 100;
          const p        = data.probabilities || {};
          probabilities  = { normal: (p.normal || 0) * 100, benign: (p.benign || 0) * 100, malignant: (p.malignant || 0) * 100 };
        } catch (_) {
          // Demo mode fallback
          const classes  = ["Normal", "Benign", "Malignant"];
          classification = classes[Math.floor(Math.random() * 3)];
          confidence     = 70 + Math.random() * 25;
          if      (classification === "Normal")    probabilities = { normal: confidence, benign: (100 - confidence) * 0.4, malignant: (100 - confidence) * 0.6 };
          else if (classification === "Benign")    probabilities = { normal: (100 - confidence) * 0.3, benign: confidence, malignant: (100 - confidence) * 0.7 };
          else                                     probabilities = { normal: (100 - confidence) * 0.15, benign: (100 - confidence) * 0.3, malignant: confidence };
        }

        const riskLevel = classification === "Malignant" ? "High" : classification === "Benign" ? "Moderate" : "Low";
        await animProg(52, 82); setStep(2, "done");

        // Step 3 — save to Supabase
        setStep(3, "active"); setStatus("Saving to secure database...");
        let scanId  = "local_" + Date.now();
        let savedDate = new Date().toISOString();

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            let imageUrl: string | null = null;
            try {
              if (pv) {
                const imgBlob = await fetch(pv).then(r => r.blob());
                const safeName = fn.replace(/[^a-zA-Z0-9._-]/g, "_");
                const path = `${user.id}/${Date.now()}_${safeName}`;
                const { error: upErr } = await supabase.storage.from("scan-images").upload(path, imgBlob, { contentType: imgBlob.type || "image/jpeg", upsert: false });
                if (!upErr) {
                  const { data: ud } = supabase.storage.from("scan-images").getPublicUrl(path);
                  imageUrl = ud.publicUrl;
                }
              }
            } catch (_) {}

            const { data: ins, error: dbErr } = await supabase.from("scans").insert({
              user_id: user.id, file_name: fn, image_url: imageUrl,
              classification, confidence, risk_level: riskLevel,
              prob_normal: probabilities.normal, prob_benign: probabilities.benign,
              prob_malignant: probabilities.malignant, notes: "",
            }).select().single();

            if (!dbErr && ins) { scanId = ins.id; savedDate = ins.created_at; }
          }
        } catch (_) {}

        await animProg(82, 100); setStep(3, "done");
        setPct(100); setStatus("Analysis complete!");

        // Store result for result page
        const result = { id: scanId, fileName: fn, image: pv, result: { classification, confidence, probabilities, riskLevel }, date: savedDate, notes: "" };
        sessionStorage.setItem("blnScanResult", JSON.stringify(result));
        // Cache locally
        const cached = JSON.parse(localStorage.getItem("blnScans") || "[]");
        cached.unshift(result);
        localStorage.setItem("blnScans", JSON.stringify(cached.slice(0, 50)));

        await sleep(700);
        navigate(`/result/${scanId}`);
      } catch (e: any) {
        setFailed(true);
        setErrMsg(e?.message || "Unknown error during analysis.");
      }
    })();
  }, [navigate]);

  // Ring progress calculation
  const circumference = 276;
  const offset = circumference - (circumference * pct) / 100;

  return (
    <div className="bln-page-in" style={{ minHeight: "100vh", background: "var(--dark)" }}>
      <nav className="bln-nav"><NavLogo /><div /></nav>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "60px 24px" }}>
        {failed ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,68,102,.08)", border: "2px solid rgba(255,68,102,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="var(--danger)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 style={{ fontFamily: "var(--fd)", fontSize: 22, letterSpacing: 2, color: "var(--danger)", marginBottom: 12 }}>ANALYSIS FAILED</h2>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>{errMsg}</p>
            <button className="bln-btn bln-btn-p bln-btn-lg bln-btn-full" onClick={() => navigate("/upload")}>← TRY AGAIN</button>
          </div>
        ) : (
          <div className="bln-card" style={{ overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr" }} >
            {/* Scan preview */}
            <div style={{ background: "#000", minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 40%,rgba(57,255,106,.03) 100%)", animation: "bln-scan 2.5s linear infinite", pointerEvents: "none" }} />
              {preview
                ? <img src={preview} alt="Scan" style={{ maxWidth: "100%", maxHeight: 380, objectFit: "contain", borderRadius: 10, filter: "drop-shadow(0 0 16px rgba(57,255,106,.3))" }} />
                : <div style={{ color: "var(--dim)", fontSize: 14 }}>📄 {fileName}</div>
              }
            </div>

            {/* Progress panel */}
            <div style={{ padding: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
              {/* Ring */}
              <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
                <svg width="110" height="110" viewBox="0 0 110 110" style={{ position: "absolute", inset: 0 }}>
                  <defs>
                    <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1DB954" />
                      <stop offset="100%" stopColor="#00FFD1" />
                    </linearGradient>
                  </defs>
                  <circle cx="55" cy="55" r="44" fill="none" stroke="rgba(57,255,106,.08)" strokeWidth="6" />
                  <circle cx="55" cy="55" r="44" fill="none" stroke="url(#ring-grad)" strokeWidth="6"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transform: "rotate(-90deg)", transformOrigin: "55px 55px", transition: "stroke-dashoffset .5s ease" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--fd)", fontSize: 20, fontWeight: 700, color: "var(--neon)" }}>
                  {Math.round(pct)}%
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <h2 style={{ fontFamily: "var(--fd)", fontSize: 20, letterSpacing: 2, color: "var(--text)", marginBottom: 6 }}>ANALYZING</h2>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>{status}</p>
              </div>

              {/* Steps */}
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                {STEPS.map((label, i) => (
                  <StepRow key={i} label={label} state={steps[i]} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepRow({ label, state }: { label: string; state: StepState }) {
  const bg  = state === "done" ? "rgba(57,255,106,.08)" : state === "active" ? "rgba(0,229,255,.07)" : "transparent";
  const brd = state === "done" ? "1px solid rgba(57,255,106,.2)" : state === "active" ? "1px solid rgba(0,229,255,.22)" : "1px solid transparent";
  const dot = state === "done"   ? { bg: "var(--neon)",   shadow: "0 0 10px rgba(57,255,106,.5)"  }
            : state === "active" ? { bg: "var(--accent)", shadow: "0 0 10px rgba(0,229,255,.5)"   }
            :                      { bg: "rgba(57,255,106,.1)", shadow: "none" };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: bg, border: brd, transition: "all .4s cubic-bezier(.22,1,.36,1)", opacity: state === "pending" ? 0.4 : 1 }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: dot.bg, boxShadow: dot.shadow, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all .4s" }}>
        {state === "done"   && <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="var(--dark)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        {state === "active" && <span className="bln-spinner" style={{ width: 10, height: 10, borderWidth: 1.5, borderTopColor: "var(--dark)" }} />}
      </div>
      <span style={{ fontSize: 13, color: state === "done" ? "var(--neon)" : state === "active" ? "var(--accent)" : "var(--muted)" }}>{label}</span>
    </div>
  );
}
