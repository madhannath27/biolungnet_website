import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { LOGO_B64 } from "../../lib/assets";
import { DotCanvas } from "../components/DotCanvas";
import { RobotViewer } from "../components/RobotViewer";

export function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  const errMsg = (m: string) => {
    const l = m.toLowerCase();
    if (l.includes("rate limit") || l.includes("email rate")) return "Too many attempts. Please wait 1 hour.";
    if (l.includes("email not confirmed")) return "Check your inbox and click the confirmation link first.";
    if (l.includes("invalid login") || l.includes("invalid credentials")) return "Wrong email or password.";
    if (l.includes("already registered") || l.includes("already exists")) return "This email is already registered. Sign in instead.";
    if (l.includes("disabled") || l.includes("not enabled")) return "Email sign-ups are disabled in your Supabase project.";
    if (l.includes("network") || l.includes("fetch")) return "Network error. Check your connection.";
    return m;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    try {
      if (isLogin) {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (err) { setError(errMsg(err.message)); return; }
        if (data.user) navigate("/disclaimer");
      } else {
        if (!form.fullName.trim()) { setError("Please enter your full name."); return; }
        if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
        if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
        const { data, error: err } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { full_name: form.fullName } },
        });
        if (err) { setError(errMsg(err.message)); return; }
        if (data.user) {
          try { await supabase.from("profiles").upsert({ id: data.user.id, full_name: form.fullName, email: form.email }); } catch (_) {}
        }
        if (data.session) { navigate("/disclaimer"); }
        else {
          setSuccess(`Account created! Check your inbox at ${form.email} and click the confirmation link, then sign in.`);
          setIsLogin(true);
          setForm(f => ({ ...f, password: "", confirm: "" }));
        }
      }
    } catch (e: any) { setError(errMsg(e?.message || "Something went wrong.")); }
    finally { setLoading(false); }
  };

  const toggle = () => { setIsLogin(l => !l); setError(null); setSuccess(null); };

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", position: "relative", overflow: "hidden", background: "var(--dark)" }} className="bln-auth-grid">
      {/* Dot connect canvas */}
      <DotCanvas active={true} />

      {/* ── LEFT: Robot panel ── */}
      <div className="bln-auth-left" style={{ position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#020C07 0%,#04180B 35%,#071A0F 70%,#0A2416 100%)", zIndex: 1 }}>
        {/* Scanlines overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(57,255,106,.012) 2px,rgba(57,255,106,.012) 4px)", pointerEvents: "none", zIndex: 2 }} />

        {/* 3D Robot */}
        <RobotViewer />

        {/* Floating particles */}
        <Particles />

        {/* Brand + stats (bottom) */}
        <div className="bln-fu1" style={{ position: "absolute", bottom: 80, left: 0, right: 0, padding: "0 40px", zIndex: 10, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 900, letterSpacing: 3, color: "var(--neon)", textShadow: "var(--glow-s)", lineHeight: 1.1, marginBottom: 6 }}>
            BIO<span style={{ color: "var(--neon2)" }}>LUNG</span>NET
          </div>
          <div style={{ fontFamily: "var(--fb)", fontSize: 12, color: "var(--dim)", letterSpacing: 2 }}>
            AI-POWERED LUNG CANCER DETECTION SYSTEM
          </div>
        </div>

        {/* Platform rings */}
        <div style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", width: 400, height: 70, pointerEvents: "none", zIndex: 3 }}>
          {[[300, 55, "rgba(57,255,106,.5)", 0], [370, 63, "rgba(0,229,255,.3)", -0.8], [440, 71, "rgba(123,97,255,.2)", -1.6]].map(([w, h, col, delay], i) => (
            <div key={i} style={{ position: "absolute", bottom: i * 5, left: "50%", transform: "translateX(-50%)", width: w as number, height: h as number, borderRadius: "50%", border: `1.5px solid ${col}`, animation: `bln-glow 3s ease-in-out infinite`, animationDelay: `${delay}s` }} />
          ))}
        </div>
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div style={{ background: "rgba(2,12,7,.97)", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 48px", position: "relative", borderLeft: "1px solid rgba(57,255,106,.1)", zIndex: 1 }}>
        {/* Shimmer top border */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,transparent,var(--neon),var(--neon2),var(--accent2),transparent)", animation: "bln-shimmer 3s linear infinite", backgroundSize: "200% auto" }} />

        <div className="bln-stagger" style={{ width: "100%", maxWidth: 400 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div style={{ width: 44, height: 44, border: "1.5px solid rgba(57,255,106,.35)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <img src={LOGO_B64} alt="BioLungNet" style={{ width: 38, height: 38, objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--fd)", fontSize: 14, fontWeight: 700, color: "var(--neon)", letterSpacing: 2 }}>
                BIO<span style={{ color: "var(--neon2)" }}>LUNG</span>NET
              </div>
              <div style={{ fontSize: 11, color: "var(--dim)", letterSpacing: 1 }}>MEDICAL AI PLATFORM</div>
            </div>
          </div>

          <h1 style={{ fontFamily: "var(--fd)", fontSize: 26, fontWeight: 700, color: "var(--text)", letterSpacing: 1, marginBottom: 6 }}>
            {isLogin ? "WELCOME BACK" : "CREATE ACCOUNT"}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 28 }}>
            {isLogin ? "Sign in to access your neural scan analysis" : "Join BioLungNet to start AI-powered analysis"}
          </p>

          {error   && <div className="bln-alert bln-alert-e" style={{ marginBottom: 16 }}>⚠ {error}</div>}
          {success && <div className="bln-alert bln-alert-s" style={{ marginBottom: 16 }}>✓ {success}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {!isLogin && (
              <div className="bln-input-group">
                <label>Full Name</label>
                <input type="text" placeholder="Dr. Sarah Johnson" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
              </div>
            )}
            <div className="bln-input-group">
              <label>Email</label>
              <input type="email" placeholder="doctor@hospital.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="bln-input-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            {!isLogin && (
              <div className="bln-input-group">
                <label>Confirm Password</label>
                <input type="password" placeholder="••••••••" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
              </div>
            )}
            <button type="submit" disabled={loading} className="bln-btn bln-btn-p bln-btn-lg bln-btn-full" style={{ marginTop: 4 }}>
              {loading ? <><span className="bln-spinner" style={{ borderTopColor: "var(--dark)" }} /> PROCESSING...</> : isLogin ? "SIGN IN →" : "CREATE ACCOUNT →"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--dim)" }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={toggle} style={{ background: "none", border: "none", color: "var(--neon)", fontFamily: "var(--fd)", fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>
              {isLogin ? "SIGN UP" : "SIGN IN"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Particles() {
  const colors = ["rgba(57,255,106,.7)", "rgba(0,229,255,.7)", "rgba(123,97,255,.7)"];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 4 }}>
      {Array.from({ length: 18 }).map((_, i) => {
        const sz = Math.random() * 5 + 2;
        return (
          <div key={i} style={{
            position: "absolute", width: sz, height: sz, borderRadius: "50%",
            background: colors[i % 3],
            left: `${Math.random() * 90}%`,
            bottom: `${Math.random() * 50}%`,
            boxShadow: `0 0 ${sz * 3}px ${colors[i % 3]}`,
            animation: `bln-float ${4 + Math.random() * 5}s ease-in-out infinite`,
            animationDelay: `-${Math.random() * 6}s`,
          }} />
        );
      })}
    </div>
  );
}
