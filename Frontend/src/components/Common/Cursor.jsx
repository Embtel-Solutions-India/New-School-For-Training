import { useEffect, useRef } from "react";

const COLORS = ["#22c55e", "#4ade80", "#86efac", "#f97316"];
const MAX = 70; // keep it sane

const Cursor = () => {
  const explosions = useRef([]);
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const smoothIdle = useRef(0);
  const idleTime = useRef(0);

  const mouse = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    px: window.innerWidth / 2,
    py: window.innerHeight / 2,
    speed: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // spawn
    const spawn = () => {
      if (particles.current.length >= MAX) particles.current.shift();

      const angle = Math.random() * Math.PI * 2;
      const baseRadius = Math.random() * 90 + 70; // base orbit

      particles.current.push({
        x: mouse.current.x,
        y: mouse.current.y,
        vx: Math.cos(angle) * 0.6,
        vy: Math.sin(angle) * 0.6,
        baseRadius,

        // 🔥 DEPTH
        depth: Math.random(), // 0 → far, 1 → near

        life: 1,
        size: Math.random() * 2 + 1.2,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        phase: Math.random() * 10,
      });
    };

    const onMove = (e) => {
      const m = mouse.current;
      m.px = m.x;
      m.py = m.y;
      m.x = e.clientX;
      m.y = e.clientY;

      const dx = m.x - m.px;
      const dy = m.y - m.py;
      m.speed = Math.min(Math.hypot(dx, dy), 30);

      // spawn fewer when slow, more when fast
      const count = m.speed > 10 ? 2 : 1;
      for (let i = 0; i < count; i++) spawn();
    };

    // shockwave (repel)
    const onClick = () => {
      const cx = mouse.current.x;
      const cy = mouse.current.y;
      const arr = particles.current;

      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];
        const dx = p.x - cx;
        const dy = p.y - cy;
        const d = Math.hypot(dx, dy) || 1;

        if (d < 140) {
          const f = (140 - d) / 140; // falloff
          p.vx += (dx / d) * 2.2 * f;
          p.vy += (dy / d) * 2.2 * f;
        }
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onClick);

    const elements = document.querySelectorAll(".magnetic");

    const animate = () => {
      const m = mouse.current;
      const targetIdle = m.speed < 0.3 ? 1 : 0;
      smoothIdle.current += (targetIdle - smoothIdle.current) * 0.05;

      if (m.speed < 0.3) {
        idleTime.current += 0.006; // ~60fps
      } else {
        idleTime.current = 0;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const arr = particles.current;
      // ALWAYS ALIVE (continuous spawn)
      if (particles.current.length < MAX) {
        spawn();
      }

      // update
      
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];
        

        elements.forEach((el) => {
          const rect = el.getBoundingClientRect();

          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;

          const dx = p.x - cx;
          const dy = p.y - cy;
          const dist = Math.hypot(dx, dy);

          if (dist < 120) {
            const force = (120 - dist) / 120;

            p.vx -= (dx / dist) * force * 0.2;
            p.vy -= (dy / dist) * force * 0.2;
          }
        });
        
        if (p.explosion) {
          p.x += p.vx;
          p.y += p.vy;

          p.vx *= 0.96;
          p.vy *= 0.96;

          p.life -= 0.02;
          continue; // skip normal orbit physics
        }
        if (smoothIdle.current > 0.5) {
          p.vx += Math.sin(p.phase + idleTime.current * 0.3) * 0.01;
          p.vy += Math.cos(p.phase + idleTime.current * 0.3) * 0.01;
        }

        // dynamic orbit radius based on cursor speed
        const t = idleTime.current;

        // cinematic breathing (layered sine)
        const breathe = Math.sin(t * 0.5) * Math.sin(t * 0.25) * 5;
        const stretch = Math.min(m.speed * 2, 40);

        const targetRadius =
          p.baseRadius + stretch + breathe * smoothIdle.current;

        // attraction toward circular orbit around cursor
        const dx = m.x - p.x;
        const dy = m.y - p.y;
        const dist = Math.hypot(dx, dy) || 1;

        // desired point on ring
        const nx = dx / dist;
        const ny = dy / dist;
        const tx = m.x - nx * targetRadius;
        const ty = m.y - ny * targetRadius;

        // spring toward target ring (soft)
        const ax = (tx - p.x) * 0.02;
        const ay = (ty - p.y) * 0.02;

        p.vx += ax;
        p.vy += ay;

        // friction
        p.vx *= 0.96;
        p.vy *= 0.96;

        // integrate
        p.x += p.vx;
        p.y += p.vy;

        // life decay
        p.life -= 0.005;

        if (p.life <= 0) {
          arr.splice(i, 1);
          i--;
        }
      }

      // optimized constellation (only neighbors)
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < i + 6 && j < arr.length; j++) {
          const a = arr[i];
          const b = arr[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;

          if (d2 < 2800) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = "rgba(34,197,94,0.12)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      //   Explosion waves

      for (let i = 0; i < explosions.current.length; i++) {
        const e = explosions.current[i];

        e.radius += 4;
        e.life -= 0.02;

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34,197,94,${e.life})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (e.life <= 0) {
          explosions.current.splice(i, 1);
          i--;
        }
      }
      // draw particles (with subtle blink)
      // draw particles (smooth slow blinking)
      const time = Date.now() * 0.001;
      const glowPulse = 0.85 + 0.15 * Math.sin(idleTime.current * 0.6);

      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];

        // smooth breathing effect
        const blink = 0.65 + 0.35 * Math.sin(time * 0.6 + p.phase);

        ctx.beginPath();
        const depthScale = 0.6 + p.depth * 0.8;

        ctx.arc(p.x, p.y, p.size * blink * depthScale, 0, Math.PI * 2);

        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12 * glowPulse * depthScale;
        ctx.shadowColor = p.color;

        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      requestAnimationFrame(animate);
    };

    animate();
    const handleClick = (e) => {
      const x = e.clientX;
      const y = e.clientY;

      // 🔥 wave
      explosions.current.push({
        x,
        y,
        radius: 0,
        life: 1,
      });

      // 🔥 burst particles
      for (let i = 0; i < 12; i++) {
        particles.current.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 1,
          size: Math.random() * 3 + 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          phase: Math.random() * Math.PI * 2,
          explosion: true, // mark
        });
      }
    };

    window.addEventListener("mousedown", handleClick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[9999]"
    />
  );
};

export default Cursor;
