import { LOGO_B64 } from "../../lib/assets";

export function NavLogo() {
  return (
    <span className="bln-nav-logo">
      <span className="bln-nav-icon">
        <img src={LOGO_B64} alt="BioLungNet" style={{ width: 34, height: 34, objectFit: "contain" }} />
      </span>
      BIO<span style={{ color: "var(--neon2)" }}>LUNG</span>NET
    </span>
  );
}
