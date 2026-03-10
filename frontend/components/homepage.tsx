"use client"

import Image from "next/image"

export function Homepage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Stadium Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/stadium-bg.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[#050F0C]/80" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050F0C]/60 via-transparent to-[#050F0C]/90" />
      </div>

      {/* Decorative Field Lines */}
      <div className="absolute inset-0 z-[1] flex items-center justify-center opacity-[0.06] pointer-events-none">
        <svg width="600" height="400" viewBox="0 0 600 400" fill="none" className="w-full max-w-2xl">
          <rect x="10" y="10" width="580" height="380" rx="0" stroke="#14B871" strokeWidth="2" />
          <line x1="300" y1="10" x2="300" y2="390" stroke="#14B871" strokeWidth="2" />
          <circle cx="300" cy="200" r="60" stroke="#14B871" strokeWidth="2" />
          <rect x="10" y="110" width="100" height="180" rx="0" stroke="#14B871" strokeWidth="2" />
          <rect x="490" y="110" width="100" height="180" rx="0" stroke="#14B871" strokeWidth="2" />
          <rect x="10" y="150" width="40" height="100" rx="0" stroke="#14B871" strokeWidth="2" />
          <rect x="550" y="150" width="40" height="100" rx="0" stroke="#14B871" strokeWidth="2" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        {/* Logo */}
        <div className="animate-fade-in flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#14B871]/20 border border-[#14B871]/30">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14B871" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="animate-fade-in-delay-1 flex flex-col gap-3">
          <h1 className="text-balance text-5xl font-bold tracking-tight text-[#e8f5ee] sm:text-6xl lg:text-7xl">
            KickSense
          </h1>
          <p className="text-lg font-medium text-[#14B871] tracking-widest uppercase">
            AI Powered Football Analytics System
          </p>
        </div>

        {/* Description */}
        <p className="animate-fade-in-delay-1 max-w-xl text-[#9cb8a9] leading-relaxed text-base sm:text-lg">
          Advanced player detection, real-time tracking, and deep performance insights.
          Transform your match footage into actionable intelligence.
        </p>

        {/* Get Started Button */}
        <button
          type="button"
          onClick={onGetStarted}
          className="animate-fade-in-delay-2-glow group relative mt-4 inline-flex items-center gap-2 rounded-xl px-10 py-4 text-lg font-semibold text-[#050F0C] transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B871] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050F0C]"
          style={{ background: "linear-gradient(135deg, #14B871, #0ea860)" }}
        >
          Get Started
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>

        {/* Feature badges */}
        <div className="animate-fade-in-delay-2 mt-6 flex flex-wrap justify-center gap-3">
          {["Player Detection", "Real-time Tracking", "Performance Metrics", "Team Analysis"].map((feature) => (
            <span
              key={feature}
              className="glass rounded-full px-4 py-1.5 text-xs font-medium text-[#9cb8a9] tracking-wide"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
