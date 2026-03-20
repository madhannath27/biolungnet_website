import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { NavLogo } from "../components/NavLogo";

// ─── India address data: area → { city, state, country } ───────────────────
const INDIA_PLACES: Record<string, { city: string; state: string; country: string }> = {
  // Tamil Nadu
  "dadagapatty":      { city: "Salem",        state: "Tamil Nadu",      country: "India" },
  "suramangalam":     { city: "Salem",        state: "Tamil Nadu",      country: "India" },
  "fairlands":        { city: "Salem",        state: "Tamil Nadu",      country: "India" },
  "hasthampatti":     { city: "Salem",        state: "Tamil Nadu",      country: "India" },
  "ammapet":          { city: "Salem",        state: "Tamil Nadu",      country: "India" },
  "omalur":           { city: "Salem",        state: "Tamil Nadu",      country: "India" },
  "yercaud":          { city: "Salem",        state: "Tamil Nadu",      country: "India" },
  "attur":            { city: "Salem",        state: "Tamil Nadu",      country: "India" },
  "anna nagar":       { city: "Chennai",      state: "Tamil Nadu",      country: "India" },
  "t nagar":          { city: "Chennai",      state: "Tamil Nadu",      country: "India" },
  "adyar":            { city: "Chennai",      state: "Tamil Nadu",      country: "India" },
  "velachery":        { city: "Chennai",      state: "Tamil Nadu",      country: "India" },
  "tambaram":         { city: "Chennai",      state: "Tamil Nadu",      country: "India" },
  "porur":            { city: "Chennai",      state: "Tamil Nadu",      country: "India" },
  "perambur":         { city: "Chennai",      state: "Tamil Nadu",      country: "India" },
  "rs puram":         { city: "Coimbatore",   state: "Tamil Nadu",      country: "India" },
  "gandhipuram":      { city: "Coimbatore",   state: "Tamil Nadu",      country: "India" },
  "peelamedu":        { city: "Coimbatore",   state: "Tamil Nadu",      country: "India" },
  "saibaba colony":   { city: "Coimbatore",   state: "Tamil Nadu",      country: "India" },
  "singanallur":      { city: "Coimbatore",   state: "Tamil Nadu",      country: "India" },
  "ganapathy":        { city: "Coimbatore",   state: "Tamil Nadu",      country: "India" },
  "thillai nagar":    { city: "Tiruchirappalli", state: "Tamil Nadu",   country: "India" },
  "srirangam":        { city: "Tiruchirappalli", state: "Tamil Nadu",   country: "India" },
  "anna nagar trichy":{ city: "Tiruchirappalli", state: "Tamil Nadu",   country: "India" },
  "kappalur":         { city: "Madurai",      state: "Tamil Nadu",      country: "India" },
  "arasaradi":        { city: "Madurai",      state: "Tamil Nadu",      country: "India" },
  "tallakulam":       { city: "Madurai",      state: "Tamil Nadu",      country: "India" },
  "mattuthavani":     { city: "Madurai",      state: "Tamil Nadu",      country: "India" },
  // Karnataka
  "koramangala":      { city: "Bengaluru",    state: "Karnataka",       country: "India" },
  "whitefield":       { city: "Bengaluru",    state: "Karnataka",       country: "India" },
  "indiranagar":      { city: "Bengaluru",    state: "Karnataka",       country: "India" },
  "jayanagar":        { city: "Bengaluru",    state: "Karnataka",       country: "India" },
  "rajajinagar":      { city: "Bengaluru",    state: "Karnataka",       country: "India" },
  "hebbal":           { city: "Bengaluru",    state: "Karnataka",       country: "India" },
  "electronic city":  { city: "Bengaluru",    state: "Karnataka",       country: "India" },
  // Maharashtra
  "bandra":           { city: "Mumbai",       state: "Maharashtra",     country: "India" },
  "andheri":          { city: "Mumbai",       state: "Maharashtra",     country: "India" },
  "dadar":            { city: "Mumbai",       state: "Maharashtra",     country: "India" },
  "thane":            { city: "Thane",        state: "Maharashtra",     country: "India" },
  "kothrud":          { city: "Pune",         state: "Maharashtra",     country: "India" },
  "hadapsar":         { city: "Pune",         state: "Maharashtra",     country: "India" },
  "viman nagar":      { city: "Pune",         state: "Maharashtra",     country: "India" },
  // Telangana
  "banjara hills":    { city: "Hyderabad",    state: "Telangana",       country: "India" },
  "jubilee hills":    { city: "Hyderabad",    state: "Telangana",       country: "India" },
  "gachibowli":       { city: "Hyderabad",    state: "Telangana",       country: "India" },
  "hitech city":      { city: "Hyderabad",    state: "Telangana",       country: "India" },
  // Delhi
  "connaught place":  { city: "New Delhi",    state: "Delhi",           country: "India" },
  "dwarka":           { city: "New Delhi",    state: "Delhi",           country: "India" },
  "rohini":           { city: "New Delhi",    state: "Delhi",           country: "India" },
  "lajpat nagar":     { city: "New Delhi",    state: "Delhi",           country: "India" },
  // West Bengal
  "salt lake":        { city: "Kolkata",      state: "West Bengal",     country: "India" },
  "park street":      { city: "Kolkata",      state: "West Bengal",     country: "India" },
  "howrah":           { city: "Howrah",       state: "West Bengal",     country: "India" },
};

// Fuzzy match: returns up to 6 suggestions for a given query
function getSuggestions(query: string): { display: string; full: string }[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  const results: { display: string; full: string; score: number }[] = [];

  Object.entries(INDIA_PLACES).forEach(([area, loc]) => {
    const areaL = area.toLowerCase();
    let score = 0;
    if (areaL.startsWith(q))         score = 100;
    else if (areaL.includes(q))      score = 70;
    else if (loc.city.toLowerCase().includes(q))  score = 50;
    else if (loc.state.toLowerCase().includes(q)) score = 30;
    if (score > 0) {
      const display = `${area.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}, ${loc.city}, ${loc.state}`;
      const full    = `${area.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}, ${loc.city}, ${loc.state}, ${loc.country}`;
      results.push({ display, full, score });
    }
  });
  return results.sort((a, b) => b.score - a.score).slice(0, 6).map(({ display, full }) => ({ display, full }));
}

// ─── Medical history preset options ────────────────────────────────────────
const MED_HISTORY_OPTIONS = [
  "None / No significant history",
  "Active smoker",
  "Former smoker (quit > 1 year ago)",
  "Passive / secondhand smoke exposure",
  "Chronic Obstructive Pulmonary Disease (COPD)",
  "Asthma",
  "Previous lung infection (Tuberculosis / Pneumonia)",
  "Previous cancer diagnosis",
  "Family history of lung cancer",
  "Occupational exposure (asbestos, dust, chemicals)",
  "Diabetes",
  "Hypertension",
  "Heart disease",
  "Other",
];

// ─── Required field marker ──────────────────────────────────────────────────
function Req() {
  return <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>;
}

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [touched,   setTouched]   = useState<Record<string, boolean>>({});

  // Form state
  const [form, setForm] = useState({
    age: "", gender: "", phone: "", bloodGroup: "",
    addressInput: "",   // what user types
    addressFull: "",    // resolved full address
    medHistorySelect: "",
    medHistoryOther: "",
  });

  // Address autocomplete
  const [suggestions,  setSuggestions]  = useState<{ display: string; full: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const addressRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addressRef.current && !addressRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const setField = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAddressInput = (val: string) => {
    setForm(f => ({ ...f, addressInput: val, addressFull: val }));
    const s = getSuggestions(val);
    setSuggestions(s);
    setShowDropdown(s.length > 0);
  };

  const pickSuggestion = (item: { display: string; full: string }) => {
    setForm(f => ({ ...f, addressInput: item.display, addressFull: item.full }));
    setSuggestions([]); setShowDropdown(false);
  };

  // Final medical history value
  const medHistoryFinal =
    form.medHistorySelect === "Other"
      ? form.medHistoryOther.trim()
      : form.medHistorySelect;

  // Validation
  const validAge   = form.age.trim() !== "" && Number(form.age) > 0 && Number(form.age) <= 120;
  const validGender = form.gender !== "";
  const validPhone  = /^[+]?[\d\s\-().]{7,15}$/.test(form.phone.trim());
  const validBlood  = form.bloodGroup !== "";
  const validAddr   = form.addressFull.trim().length >= 4;
  const validMed    = form.medHistorySelect !== "" &&
    (form.medHistorySelect !== "Other" || form.medHistoryOther.trim().length >= 3);

  const fieldErrors: Record<string, string> = {};
  if (touched.age   && !validAge)    fieldErrors.age    = "Enter a valid age (1–120)";
  if (touched.gender && !validGender) fieldErrors.gender = "Please select a gender";
  if (touched.phone  && !validPhone)  fieldErrors.phone  = "Enter a valid phone number";
  if (touched.blood  && !validBlood)  fieldErrors.blood  = "Please select a blood group";
  if (touched.addr   && !validAddr)   fieldErrors.addr   = "Please enter your address";
  if (touched.med    && !validMed)
    fieldErrors.med = form.medHistorySelect === "Other"
      ? "Please describe your medical history"
      : "Please select a medical history option";

  const allValid = validAge && validGender && validPhone && validBlood && validAddr && validMed;

  const touchAll = () => {
    setTouched({ age: true, gender: true, phone: true, blood: true, addr: true, med: true });
  };

  const handleSave = async () => {
    touchAll();
    if (!allValid) {
      setError("Please complete all required fields before continuing.");
      return;
    }
    setLoading(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in.");
      await supabase.from("profiles").update({
        age:             parseInt(form.age),
        gender:          form.gender,
        phone:           form.phone.trim(),
        blood_group:     form.bloodGroup,
        address:         form.addressFull.trim(),
        medical_history: medHistoryFinal,
      }).eq("id", user.id);
      navigate("/upload");
    } catch (e: any) {
      setError(e?.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputBorder = (key: string, valid: boolean) => ({
    borderColor: touched[key] ? (valid ? "rgba(57,255,106,.5)" : "var(--danger)") : "rgba(57,255,106,.2)",
  });

  return (
    <div className="bln-page-in" style={{ minHeight: "100vh", background: "var(--dark)" }}>
      <nav className="bln-nav">
        <NavLogo />
        <div />
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div className="bln-stagger">
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "var(--fd)", fontSize: 24, letterSpacing: 2, color: "var(--neon)", marginBottom: 6 }}>
              PATIENT PROFILE
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              All fields are <span style={{ color: "var(--danger)", fontWeight: 600 }}>required</span> before you can continue.
            </p>
          </div>

          {error && (
            <div className="bln-alert bln-alert-e" style={{ marginBottom: 20 }}>⚠ {error}</div>
          )}

          <div className="bln-card" style={{ padding: 36 }}>
            <p className="bln-sep">Personal Information</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginBottom: 24 }} className="bln-two-col">

              {/* Age */}
              <div className="bln-input-group">
                <label>Age <Req /></label>
                <input
                  type="number" placeholder="e.g. 35" min={1} max={120}
                  value={form.age}
                  style={inputBorder("age", validAge)}
                  onChange={e => { setForm(f => ({ ...f, age: e.target.value })); setTouched(t => ({ ...t, age: true })); }}
                  onBlur={() => setTouched(t => ({ ...t, age: true }))}
                />
                {fieldErrors.age && <FieldErr msg={fieldErrors.age} />}
              </div>

              {/* Gender */}
              <div className="bln-input-group">
                <label>Gender <Req /></label>
                <select
                  value={form.gender}
                  style={inputBorder("gender", validGender)}
                  onChange={e => { setForm(f => ({ ...f, gender: e.target.value })); setTouched(t => ({ ...t, gender: true })); }}
                  onBlur={() => setTouched(t => ({ ...t, gender: true }))}
                >
                  <option value="">— Select gender —</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </select>
                {fieldErrors.gender && <FieldErr msg={fieldErrors.gender} />}
              </div>

              {/* Phone */}
              <div className="bln-input-group">
                <label>Phone Number <Req /></label>
                <input
                  type="tel" placeholder="+91 98765 43210"
                  value={form.phone}
                  style={inputBorder("phone", validPhone)}
                  onChange={e => { setForm(f => ({ ...f, phone: e.target.value })); setTouched(t => ({ ...t, phone: true })); }}
                  onBlur={() => setTouched(t => ({ ...t, phone: true }))}
                />
                {fieldErrors.phone && <FieldErr msg={fieldErrors.phone} />}
              </div>

              {/* Blood Group */}
              <div className="bln-input-group">
                <label>Blood Group <Req /></label>
                <select
                  value={form.bloodGroup}
                  style={inputBorder("blood", validBlood)}
                  onChange={e => { setForm(f => ({ ...f, bloodGroup: e.target.value })); setTouched(t => ({ ...t, blood: true })); }}
                  onBlur={() => setTouched(t => ({ ...t, blood: true }))}
                >
                  <option value="">— Select blood group —</option>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => <option key={g}>{g}</option>)}
                </select>
                {fieldErrors.blood && <FieldErr msg={fieldErrors.blood} />}
              </div>

              {/* Address with autocomplete */}
              <div className="bln-input-group" style={{ gridColumn: "span 2" }} ref={addressRef}>
                <label>Address <Req /></label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Type your area/locality (e.g. Dadagapatty)"
                    value={form.addressInput}
                    style={{ ...inputBorder("addr", validAddr), width: "100%" }}
                    onChange={e => { handleAddressInput(e.target.value); setTouched(t => ({ ...t, addr: true })); }}
                    onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                    onBlur={() => { setTimeout(() => setShowDropdown(false), 200); setTouched(t => ({ ...t, addr: true })); }}
                    autoComplete="off"
                  />
                  {/* Autocomplete dropdown */}
                  {showDropdown && suggestions.length > 0 && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 500,
                      background: "var(--dark2)", border: "1px solid rgba(57,255,106,.3)",
                      borderRadius: 10, overflow: "hidden",
                      boxShadow: "0 8px 32px rgba(0,0,0,.6), var(--glow)",
                    }}>
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onMouseDown={() => pickSuggestion(s)}
                          style={{
                            display: "flex", alignItems: "center", gap: 10,
                            width: "100%", padding: "12px 16px",
                            background: "none", border: "none",
                            borderBottom: i < suggestions.length - 1 ? "1px solid rgba(57,255,106,.07)" : "none",
                            textAlign: "left", transition: "background .15s",
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(57,255,106,.07)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}
                        >
                          {/* Location pin icon */}
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--neon)" strokeWidth="2" style={{ flexShrink: 0 }}>
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                          <div>
                            <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{s.display}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Resolved address pill */}
                {form.addressFull && validAddr && (
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--neon)" }}>
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="var(--neon)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {form.addressFull}
                  </div>
                )}
                {fieldErrors.addr && <FieldErr msg={fieldErrors.addr} />}
              </div>

            </div>

            {/* Medical History */}
            <p className="bln-sep" style={{ marginTop: 4 }}>Medical History</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
              <div className="bln-input-group">
                <label>Medical Background <Req /></label>
                <select
                  value={form.medHistorySelect}
                  style={inputBorder("med", form.medHistorySelect !== "")}
                  onChange={e => { setForm(f => ({ ...f, medHistorySelect: e.target.value, medHistoryOther: "" })); setTouched(t => ({ ...t, med: true })); }}
                  onBlur={() => setTouched(t => ({ ...t, med: true }))}
                >
                  <option value="">— Select your medical history —</option>
                  {MED_HISTORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {fieldErrors.med && form.medHistorySelect === "" && <FieldErr msg={fieldErrors.med} />}
              </div>

              {/* Show text area only when "Other" is selected */}
              {form.medHistorySelect === "Other" && (
                <div className="bln-input-group" style={{ animation: "bln-up .3s cubic-bezier(.22,1,.36,1) both" }}>
                  <label>Please describe your medical history <Req /></label>
                  <textarea
                    placeholder="e.g. Chronic bronchitis since 2018, on Montelukast medication..."
                    value={form.medHistoryOther}
                    style={{ ...inputBorder("med", form.medHistoryOther.trim().length >= 3), minHeight: 110 }}
                    onChange={e => { setForm(f => ({ ...f, medHistoryOther: e.target.value })); setTouched(t => ({ ...t, med: true })); }}
                    onBlur={() => setTouched(t => ({ ...t, med: true }))}
                  />
                  {fieldErrors.med && form.medHistorySelect === "Other" && <FieldErr msg={fieldErrors.med} />}
                </div>
              )}
            </div>

            {/* Completion indicator */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--dim)", fontFamily: "var(--fd)", letterSpacing: 1, marginBottom: 8 }}>
                <span>PROFILE COMPLETION</span>
                <span style={{ color: "var(--neon)" }}>
                  {[validAge, validGender, validPhone, validBlood, validAddr, validMed].filter(Boolean).length} / 6
                </span>
              </div>
              <div className="bln-progress-track">
                <div
                  className="bln-progress-fill"
                  style={{ width: `${([validAge, validGender, validPhone, validBlood, validAddr, validMed].filter(Boolean).length / 6) * 100}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button className="bln-btn bln-btn-g" style={{ padding: "14px 24px" }} onClick={() => navigate("/disclaimer")}>
                ← BACK
              </button>
              <button
                className="bln-btn bln-btn-p bln-btn-lg"
                style={{ flex: 1, justifyContent: "center", minWidth: 200 }}
                disabled={loading}
                onClick={handleSave}
              >
                {loading
                  ? <><span className="bln-spinner" style={{ borderTopColor: "var(--dark)" }} /> SAVING...</>
                  : allValid
                    ? "SAVE & CONTINUE →"
                    : "COMPLETE ALL FIELDS →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldErr({ msg }: { msg: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5, fontSize: 12, color: "var(--danger)", animation: "bln-pop .25s cubic-bezier(.34,1.56,.64,1) both" }}>
      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="var(--danger)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {msg}
    </div>
  );
}
