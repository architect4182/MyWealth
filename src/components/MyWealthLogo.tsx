import React from "react";
import Image from "next/image";

export function MyWealthIcon({
  size = 42,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt="MyWealth Logo"
      width={Math.max(128, size * 2)}
      height={Math.max(128, size * 2)}
      unoptimized
      priority
      className={`apple-brand-logo-img ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
        borderRadius: size >= 48 ? "12px" : size >= 36 ? "10px" : "8px",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

export function MyWealthLogo({
  size = 42,
  textSize = 18,
  className = "",
}: {
  size?: number;
  textSize?: number;
  className?: string;
}) {
  return (
    <div className={`apple-brand-wrap ${className}`}>
      <MyWealthIcon size={size} />
      <span className="apple-brand-title" style={{ fontSize: `${textSize}px` }}>
        My<span>Wealth</span>
      </span>
    </div>
  );
}
