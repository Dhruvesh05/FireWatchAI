"use client";

import React from "react";

export interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number; // duration in seconds
  variant?: "steel" | "steel-fire";
  className?: string;
}

export default function ShinyText({
  text,
  disabled = false,
  speed = 10,
  variant = "steel",
  className = "",
}: ShinyTextProps) {
  const variantClass =
    variant === "steel-fire"
      ? "animate-steel-fire-shiny"
      : "animate-steel-shiny";

  return (
    <span
      className={`inline-block relative transition-all duration-300 ${disabled ? "" : variantClass
        } ${className}`}
      style={{
        animationDuration: `${speed}s`,
      }}
    >
      {text}
    </span>
  );
}
