import React from "react";
import Image from "next/image";

export function MyWealthIcon({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo.png"
      alt="MyWealth Logo"
      width={size}
      height={size}
      priority
      className={`apple-brand-logo-img ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

export function MyWealthLogo({
  size = 32,
  textSize = 17,
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
