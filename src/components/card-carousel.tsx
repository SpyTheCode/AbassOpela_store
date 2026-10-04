"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

export default function CardCarousel({
  children,
  label,
  slideClassName = "",
}: {
  children: ReactNode;
  label: string;
  slideClassName?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);

  const updatePosition = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.children) as HTMLElement[];
    setSlideCount(slides.length);
    if (!slides.length) {
      setActiveIndex(0);
      return;
    }
    const index = slides.reduce(
      (nearest, slide, current) =>
        Math.abs(slide.offsetLeft - track.scrollLeft) <
        Math.abs(slides[nearest].offsetLeft - track.scrollLeft)
          ? current
          : nearest,
      0,
    );
    setActiveIndex(index);
  }, []);

  const goToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    if (!track || !slide) return;
    track.scrollTo({ left: slide.offsetLeft, behavior });
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updatePosition();
    track.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);
    return () => {
      track.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [updatePosition]);

  useEffect(() => {
    const carousel = trackRef.current?.parentElement;
    if (!carousel || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(carousel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (
      slideCount < 2 ||
      pausedByUser ||
      hovered ||
      focused ||
      !inView ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const nextIndex = activeIndex >= slideCount - 1 ? 0 : activeIndex + 1;
      goToIndex(nextIndex);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [activeIndex, focused, goToIndex, hovered, inView, pausedByUser, slideCount]);

  function move(direction: -1 | 1) {
    if (!slideCount) return;
    const nextIndex = Math.max(0, Math.min(slideCount - 1, activeIndex + direction));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    goToIndex(nextIndex, reducedMotion ? "instant" : "smooth");
    setPausedByUser(false);
  }

  return (
    <div
      className="card-carousel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
    >
      <div className="card-carousel-controls">
        <p className="text-xs uppercase tracking-[0.14em] text-ink-3">
          {slideCount > 1 ? "Swipe to explore · Auto-advances every 7 seconds" : "Swipe to explore"}
        </p>
        <div className="flex gap-2">
          {slideCount > 1 ? (
            <button
              type="button"
              className="carousel-play-toggle"
              aria-pressed={pausedByUser}
              onClick={() => setPausedByUser((paused) => !paused)}
            >
              {pausedByUser ? "Play" : "Pause"}
            </button>
          ) : null}
          <button
            type="button"
            className="carousel-arrow"
            aria-label={`Previous ${label.toLowerCase()}`}
            aria-controls={id}
            onClick={() => move(-1)}
            disabled={activeIndex === 0}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            className="carousel-arrow"
            aria-label={`Next ${label.toLowerCase()}`}
            aria-controls={id}
            onClick={() => move(1)}
            disabled={slideCount === 0 || activeIndex >= slideCount - 1}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
      <div
        id={id}
        ref={trackRef}
        className="card-carousel-track"
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
      >
        {Array.isArray(children)
          ? children.map((child, index) => (
              <div className={`card-carousel-slide ${slideClassName}`} key={index}>
                {child}
              </div>
            ))
          : <div className={`card-carousel-slide ${slideClassName}`}>{children}</div>}
      </div>
    </div>
  );
}
