"use client";

import { useLayoutEffect, useRef } from "react";

import { gsap } from "gsap";

export function ScoreboardReveal({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        {
          autoAlpha: 0,
          y: 48,
          scale: 0.985,
          filter: "blur(12px)",
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power3.out",
          clearProps: "opacity,visibility,transform,filter",
        }
      );
    });

    return () => {
      context.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative z-10 mx-auto w-full max-w-472 px-4 py-7 sm:px-6 lg:px-9">
      {children}
    </div>
  );
}