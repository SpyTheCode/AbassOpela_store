"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type Ripple = { id: number; x: number; y: number };

export default function HeroWaterRipple({
  children,
}: {
  children: ReactNode;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const lastMove = useRef({ x: 0, y: 0, time: 0 });
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const addRipple = useCallback((clientX: number, clientY: number) => {
    const surface = surfaceRef.current;
    if (
      !surface ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;
    const bounds = surface.getBoundingClientRect();
    const ripple = {
      id: nextId.current++,
      x: clientX - bounds.left,
      y: clientY - bounds.top,
    };
    setRipples((current) => [...current.slice(-2), ripple]);
    const timer = setTimeout(() => {
      setRipples((current) => current.filter((item) => item.id !== ripple.id));
      timers.current.delete(timer);
    }, 1400);
    timers.current.add(timer);
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => clearTimeout(timer));
    },
    [],
  );

  return (
    <div
      ref={surfaceRef}
      className="hero-water-surface"
      onPointerDown={(event) => addRipple(event.clientX, event.clientY)}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        const now = performance.now();
        const dx = event.clientX - lastMove.current.x;
        const dy = event.clientY - lastMove.current.y;
        if (now - lastMove.current.time < 420 || dx * dx + dy * dy < 12_000) return;
        lastMove.current = { x: event.clientX, y: event.clientY, time: now };
        addRipple(event.clientX, event.clientY);
      }}
    >
      {children}
      <span className="sr-only">Move or tap over the image to create a water ripple.</span>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          aria-hidden="true"
          className="hero-water-ripple"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
    </div>
  );
}
