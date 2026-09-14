"use client";

import { useId } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export function Logo() {
  const { locale, t } = useLanguage();
  const uid = useId().replace(/:/g, "");
  const grad = `${uid}-grad`;
  const gloss = `${uid}-gloss`;
  const isUk = locale === "uk";

  return (
    <Link href="/" className="brand-logo" aria-label={t.brand}>
      <svg
        viewBox={isUk ? "0 0 168 40" : "0 0 156 40"}
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={grad} x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fb7185" />
            <stop offset="0.48" stopColor="#e11d48" />
            <stop offset="1" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id={gloss} x1="20" y1="4" x2="20" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="40" height="40" rx="12" fill={`url(#${grad})`} />
        <rect
          x="1.15"
          y="1.15"
          width="37.7"
          height="37.7"
          rx="10.8"
          stroke="white"
          strokeOpacity="0.22"
        />
        <path d="M8 7.5h24a2 2 0 0 1 2 2v1.2H6V9.5a2 2 0 0 1 2-2Z" fill="white" fillOpacity="0.16" />
        <g fill="#1a0610" fillOpacity="0.28">
          <rect x="8.2" y="10.4" width="3.1" height="2.3" rx="0.55" />
          <rect x="8.2" y="15.2" width="3.1" height="2.3" rx="0.55" />
          <rect x="8.2" y="20" width="3.1" height="2.3" rx="0.55" />
          <rect x="8.2" y="24.8" width="3.1" height="2.3" rx="0.55" />
        </g>
        <path
          d="M17.2 13.1c0-.84.92-1.36 1.64-.92l10.1 6.1a1.08 1.08 0 0 1 0 1.84l-10.1 6.1c-.72.44-1.64-.08-1.64-.92V13.1Z"
          fill="white"
        />
        <rect x="4" y="4" width="32" height="12" rx="8" fill={`url(#${gloss})`} />

        {isUk ? <WordmarkUk /> : <WordmarkEn />}
      </svg>
    </Link>
  );
}

function WordmarkEn() {
  return (
    <g
      stroke="white"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M64.5 13.4a8.3 8.3 0 1 0 0 13.2" />
      <path d="M80 12.2v15.6h10.2" />
      <path d="M100.8 12.2v15.6" />
      <path d="M111.2 27.8V12.2h7.6a6.4 6.4 0 0 1 0 12.8H111.2" />
    </g>
  );
}

function WordmarkUk() {
  return (
    <g
      stroke="white"
      strokeWidth="2.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M56 12.2v15.6" />
      <path d="M56 20.1 67.4 12.4" />
      <path d="M56 20.1 67.4 27.6" />
      <path d="M74.2 27.8 80.6 12.2h11.2" />
      <path d="M102.2 12.2v15.6" />
      <path d="M112.6 27.8V12.2h12.4v15.6" />
    </g>
  );
}
