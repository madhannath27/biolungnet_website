import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";

export default function App() {
  // ── Global custom cursor ──
  useEffect(() => {
    const dot  = document.getElementById("bln-dot")!;
    const ring = document.getElementById("bln-ring")!;
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    let rx = cx, ry = cy, raf = 0;

    function animRing() {
      rx += (cx - rx) * 0.13;
      ry += (cy - ry) * 0.13;
      ring.style.left = Math.round(rx) + "px";
      ring.style.top  = Math.round(ry) + "px";
      raf = requestAnimationFrame(animRing);
    }
    raf = requestAnimationFrame(animRing);

    const onMove = (e: MouseEvent) => {
      cx = e.clientX; cy = e.clientY;
      dot.style.left = cx + "px"; dot.style.top = cy + "px";
    };
    const onOver = (e: MouseEvent) => {
      if ((e.target as Element).closest("button,a,input,select,textarea"))
        document.body.classList.add("cur-hov");
    };
    const onOut = (e: MouseEvent) => {
      if ((e.target as Element).closest("button,a,input,select,textarea"))
        document.body.classList.remove("cur-hov");
    };
    const onDown = () => document.body.classList.add("cur-clk");
    const onUp   = () => document.body.classList.remove("cur-clk");

    // Ripple on primary buttons
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as Element).closest(".bln-btn-p") as HTMLButtonElement;
      if (!btn) return;
      const r = document.createElement("span");
      r.className = "bln-ripple";
      const rect = btn.getBoundingClientRect();
      const sz = Math.max(rect.width, rect.height);
      r.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX - rect.left - sz/2}px;top:${e.clientY - rect.top - sz/2}px`;
      btn.appendChild(r);
      r.addEventListener("animationend", () => r.remove());
    };

    document.addEventListener("mousemove",  onMove);
    document.addEventListener("mouseover",  onOver);
    document.addEventListener("mouseout",   onOut);
    document.addEventListener("mousedown",  onDown);
    document.addEventListener("mouseup",    onUp);
    document.addEventListener("click",      onClick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove",  onMove);
      document.removeEventListener("mouseover",  onOver);
      document.removeEventListener("mouseout",   onOut);
      document.removeEventListener("mousedown",  onDown);
      document.removeEventListener("mouseup",    onUp);
      document.removeEventListener("click",      onClick);
    };
  }, []);

  return (
    <>
      {/* Global cursor elements */}
      <div id="bln-dot"  />
      <div id="bln-ring" />
      <RouterProvider router={router} />
    </>
  );
}
