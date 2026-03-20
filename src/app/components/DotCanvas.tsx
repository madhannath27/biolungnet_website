import { useEffect, useRef } from "react";

export function DotCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef   = useRef<{ x:number;y:number;vx:number;vy:number;r:number;op:number }[]>([]);
  const mouseRef  = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const rafRef    = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) { cancelAnimationFrame(rafRef.current); return; }
    const ctx = canvas.getContext("2d")!;
    const DOT_COUNT = 80, CONN = 140, MOUSE_CONN = 190;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    dotsRef.current = Array.from({ length: DOT_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 2.2 + 0.8,
      op: Math.random() * 0.5 + 0.3,
    }));

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const { x: mx, y: my } = mouseRef.current;
      ctx.clearRect(0, 0, W, H);
      const dots = dotsRef.current;

      // Move dots
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > W) d.vx *= -1;
        if (d.y < 0 || d.y > H) d.vy *= -1;
      });

      // Dot-to-dot lines
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONN) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(57,255,106,${(1 - dist / CONN) * 0.22})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
        // Cursor-to-dot lines
        const dx = dots[i].x - mx, dy = dots[i].y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_CONN) {
          const a = (1 - dist / MOUSE_CONN) * 0.75;
          const g = ctx.createLinearGradient(dots[i].x, dots[i].y, mx, my);
          g.addColorStop(0, `rgba(57,255,106,${a})`);
          g.addColorStop(1, `rgba(0,229,255,${a * 0.5})`);
          ctx.beginPath();
          ctx.strokeStyle = g;
          ctx.lineWidth = 1;
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(mx, my);
          ctx.stroke();
          // Magnetic pull
          dots[i].x -= dx * 0.008;
          dots[i].y -= dy * 0.008;
        }
        // Draw dot
        ctx.beginPath();
        ctx.arc(dots[i].x, dots[i].y, dots[i].r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(57,255,106,${dots[i].op})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(57,255,106,0.6)";
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      id="bln-dot-canvas"
      style={{
        position: "fixed", inset: 0, zIndex: 0,
        pointerEvents: "none",
        display: active ? "block" : "none",
      }}
    />
  );
}
