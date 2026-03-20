import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { NavLogo } from "../components/NavLogo";
import type { ScanResult } from "../../lib/supabase";

export function DashboardPage() {
  const navigate = useNavigate();
  const [scans,    setScans]    = useState<ScanResult[]>([]);
  const [userName, setUserName] = useState("");
  const [loading,  setLoading]  = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }

      // Profile name
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      setUserName(profile?.full_name || user.email?.split("@")[0] || "");

      // Fetch scans from Supabase
      const { data: rows } = await supabase.from("scans").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (rows) {
        const mapped: ScanResult[] = rows.map(r => ({
          id: r.id, fileName: r.file_name, image: r.image_url,
          result: { classification: r.classification, confidence: r.confidence,
            probabilities: { normal: r.prob_normal, benign: r.prob_benign, malignant: r.prob_malignant },
            riskLevel: r.risk_level },
          date: r.created_at, notes: r.notes || "",
        }));
        setScans(mapped);
        // Merge into local cache
        const cached = JSON.parse(localStorage.getItem("blnScans") || "[]") as ScanResult[];
        const merged = [...mapped];
        cached.forEach(c => { if (!merged.find(m => m.id === c.id)) merged.push(c); });
        localStorage.setItem("blnScans", JSON.stringify(merged));
      } else {
        // Use local cache
        const cached = JSON.parse(localStorage.getItem("blnScans") || "[]") as ScanResult[];
        setScans(cached);
      }
    } catch (_) {
      const cached = JSON.parse(localStorage.getItem("blnScans") || "[]") as ScanResult[];
      setScans(cached);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deleteScan = async (id: string) => {
    if (!confirm("Delete this scan? This cannot be undone.")) return;
    setScans(prev => prev.filter(s => s.id !== id));
    const cached = JSON.parse(localStorage.getItem("blnScans") || "[]") as ScanResult[];
    localStorage.setItem("blnScans", JSON.stringify(cached.filter(s => s.id !== id)));
    try { await supabase.from("scans").delete().eq("id", id); } catch (_) {}
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("blnScans");
    navigate("/");
  };

  const total = scans.length;
  const normal    = scans.filter(s => s.result.classification === "Normal").length;
  const benign    = scans.filter(s => s.result.classification === "Benign").length;
  const malignant = scans.filter(s => s.result.classification === "Malignant").length;

  const statCards = [
    { label: "Total Scans",  value: total,     color: "var(--neon)",    bg: "rgba(57,255,106,.08)",  icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--neon)" strokeWidth="2"><path d="M9 17H5a2 2 0 00-2 2v0a2 2 0 002 2h14a2 2 0 002-2v0a2 2 0 00-2-2h-4M9 17V5a2 2 0 012-2h2a2 2 0 012 2v12M9 17h6"/></svg> },
    { label: "Normal",       value: normal,    color: "var(--neon)",    bg: "rgba(57,255,106,.06)",  icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--neon)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> },
    { label: "Benign",       value: benign,    color: "var(--warning)", bg: "rgba(255,184,75,.06)",  icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--warning)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg> },
    { label: "Malignant",    value: malignant, color: "var(--danger)",  bg: "rgba(255,68,102,.06)",  icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--danger)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  ];

  const clsBadge: Record<string, string> = { Normal: "bln-badge-s", Benign: "bln-badge-w", Malignant: "bln-badge-d" };
  const rkBadge:  Record<string, string> = { Low: "bln-badge-s",    Moderate: "bln-badge-w", High: "bln-badge-d" };

  return (
    <div className="bln-page-in" style={{ minHeight: "100vh", background: "var(--dark)" }}>
      <nav className="bln-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <NavLogo />
          {userName && <span style={{ fontFamily: "var(--fb)", fontSize: 12, color: "var(--dim)", marginLeft: 4 }}>/ {userName}</span>}
        </div>
        <div className="bln-nav-actions">
          <button className="bln-btn bln-btn-p bln-btn-sm" onClick={() => navigate("/upload")}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
            NEW SCAN
          </button>
          <button className="bln-btn bln-btn-g bln-btn-sm" onClick={logout}>LOGOUT</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px" }}>
        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }} className="bln-four-col">
          {statCards.map((s, i) => (
            <div key={s.label} className="bln-card" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, animation: `bln-up .5s ${i * 0.07}s cubic-bezier(.22,1,.36,1) both` }}>
              <div style={{ width: 46, height: 46, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontFamily: "var(--fd)", fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Scan history */}
        <div className="bln-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "18px 26px", borderBottom: "1px solid rgba(57,255,106,.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontFamily: "var(--fd)", fontSize: 14, letterSpacing: 2, color: "var(--muted)" }}>SCAN HISTORY</h2>
            <button className="bln-btn bln-btn-g bln-btn-sm" onClick={load} disabled={loading}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              {loading ? "LOADING…" : "REFRESH"}
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <span className="bln-spinner" style={{ width: 32, height: 32, borderWidth: 2.5 }} />
            </div>
          ) : scans.length === 0 ? (
            <div style={{ padding: 80, textAlign: "center" }}>
              <div style={{ width: 80, height: 80, border: "2px solid rgba(57,255,106,.2)", borderRadius: "50%", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", animation: "bln-float 4s ease-in-out infinite", boxShadow: "var(--glow)" }}>
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="var(--neon)" strokeWidth="1.5"><path d="M9 17H5a2 2 0 00-2 2v0a2 2 0 002 2h14a2 2 0 002-2v0a2 2 0 00-2-2h-4M9 17V5a2 2 0 012-2h2a2 2 0 012 2v12M9 17h6"/></svg>
              </div>
              <h3 style={{ fontFamily: "var(--fd)", fontSize: 20, letterSpacing: 2, color: "var(--text)", marginBottom: 8 }}>NO SCANS YET</h3>
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>Upload your first medical scan to begin AI analysis</p>
              <button className="bln-btn bln-btn-p" onClick={() => navigate("/upload")}>UPLOAD FIRST SCAN</button>
            </div>
          ) : (
            scans.map((s, idx) => (
              <div
                key={s.id}
                style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 26px", borderBottom: "1px solid rgba(57,255,106,.06)", transition: "background .25s", animation: `bln-up .5s ${idx * 0.04}s cubic-bezier(.22,1,.36,1) both` }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(57,255,106,.03)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}
              >
                {/* Thumbnail */}
                <div style={{ width: 68, height: 68, borderRadius: 10, background: "#000", overflow: "hidden", flexShrink: 0, border: "1px solid rgba(57,255,106,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {s.image
                    ? <img src={s.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="var(--dim)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 4 }}>{s.fileName}</div>
                  <div style={{ fontSize: 11, color: "var(--dim)", marginBottom: 8 }}>{new Date(s.date).toLocaleString()}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span className={`bln-badge ${clsBadge[s.result.classification] || "bln-badge-s"}`}>{s.result.classification.toUpperCase()}</span>
                    <span style={{ fontFamily: "var(--fd)", fontSize: 11, color: "var(--dim)" }}>{s.result.confidence.toFixed(1)}% CONF</span>
                    <span className={`bln-badge ${rkBadge[s.result.riskLevel] || "bln-badge-s"}`}>{s.result.riskLevel.toUpperCase()} RISK</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <button className="bln-btn bln-btn-o bln-btn-sm" onClick={() => navigate(`/result/${s.id}`)}>VIEW</button>
                  <button className="bln-btn bln-btn-d bln-btn-sm" onClick={() => deleteScan(s.id)}>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
