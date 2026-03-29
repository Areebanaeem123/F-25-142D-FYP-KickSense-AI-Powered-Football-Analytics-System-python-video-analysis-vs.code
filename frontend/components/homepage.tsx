"use client"

import Image from "next/image"

export function Homepage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="relative min-h-screen flex items-center overflow-hidden bg-black">
      {/* Pure Black Background Layers */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black" />
        {/* Very subtle ambient glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#14B871]/5 blur-[120px] rounded-full" />
      </div>

      {/* Decorative Field Lines (Subtle) */}
      <div className="absolute inset-0 z-[1] flex items-center justify-start pl-10 opacity-[0.02] pointer-events-none">
        <svg width="800" height="600" viewBox="0 0 600 400" fill="none" className="h-[120%] w-auto">
          <rect x="10" y="10" width="580" height="380" rx="0" stroke="#14B871" strokeWidth="1" />
          <line x1="300" y1="10" x2="300" y2="390" stroke="#14B871" strokeWidth="1" />
          <circle cx="300" cy="200" r="60" stroke="#14B871" strokeWidth="1" />
        </svg>
      </div>

      {/* Content Container (Left-Aligned with Tighter Gap) */}
      <div className="relative z-10 w-full pl-8 sm:pl-16 lg:pl-24">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,700px)_1fr] gap-12 items-center">
          {/* Left Column: Content */}
          <div className="flex flex-col items-start gap-10 text-left max-w-2xl">
            {/* Branding */}
            <div className="animate-in fade-in slide-in-from-left-8 duration-1000 flex flex-col items-start gap-8">
              <div className="relative h-32 w-[280px] sm:h-44 sm:w-[480px]">
                <Image
                  src="/logo.png"
                  alt="KickSense Logo"
                  fill
                  className="object-contain text-left scale-110"
                  priority
                />
              </div>
              <div className="h-0.5 w-full bg-[#14B871] rounded-full" />
              <div className="space-y-4">
                <h2 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[1] uppercase">
                  AI POWERED <br />
                  <span className="text-[#14B871]">FOOTBALL</span> <br />
                  <span className="text-[#14B871]">ANALYTICS</span>
                </h2>
                <div className="flex items-center gap-3">
                  <div className="h-[2px] w-10 bg-[#14B871]" />
                  <p className="text-lg sm:text-xl font-bold text-white tracking-[0.4em] uppercase opacity-80">
                    Intelligence System
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="animate-in fade-in slide-in-from-left-12 duration-1000 delay-200 text-[#9cb8a9] leading-relaxed text-lg sm:text-xl max-w-xl font-medium">
              Advanced player detection, real-time tracking, and deep tactical insights.
              Revolutionizing match analysis with high-fidelity AI intelligence.
            </p>

            {/* Actions */}
            <div className="animate-in fade-in slide-in-from-left-16 duration-1000 delay-500 flex flex-col items-start gap-6 w-full">
              <button
                type="button"
                onClick={onGetStarted}
                className="group relative inline-flex items-center justify-center gap-3 rounded-2xl px-10 py-4 text-xl font-black text-black bg-white transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.15)] hover:shadow-[0_20px_60px_rgba(255,255,255,0.25)] overflow-hidden"
              >
                <span className="relative z-10 font-bold uppercase tracking-wide">Get Started Now</span>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="relative z-10 transition-transform duration-500 group-hover:translate-x-2"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>
            </div>
          </div>

          {/* Right Column: Hero Images Layout */}
          <div className="hidden lg:block relative h-[700px] w-full flex items-center justify-center">
            {/* Main Central Image (Action Shot) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[580px] z-[3] animate-in fade-in zoom-in duration-1000 delay-300">
              <div className="relative w-full h-full rounded-[40px] overflow-hidden border-[3px] border-[#14B871]/40 shadow-[0_40px_80px_rgba(0,0,0,0.9),0_0_100px_rgba(20,184,113,0.1)] group hover:scale-[1.03] transition-all duration-700 ease-out">
                <Image
                  src="/image 2.jpg"
                  alt="Football Action"
                  fill
                  className="object-cover scale-110 group-hover:scale-100 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700" />
                <div className="absolute inset-0 border-[1px] border-white/10 rounded-[40px] pointer-events-none" />
              </div>
            </div>

            {/* Top Right Image (Emotional/Celebration) - Tightly Coupled */}
            <div className="absolute top-[5%] right-[8%] w-[320px] h-[400px] z-[2] animate-in fade-in slide-in-from-top-16 duration-1000 delay-500">
              <div className="relative w-full h-full rounded-[30px] overflow-hidden border-2 border-[#14B871]/20 shadow-[0_25px_50px_rgba(0,0,0,0.7)] rotate-6 hover:rotate-2 hover:scale-105 transition-all duration-700 ease-out group">
                <Image
                  src="/image 1.jpg"
                  alt="Team Celebration"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
              </div>
            </div>

            {/* Bottom Left Image (Historical/Tactical) - Tightly Coupled */}
            <div className="absolute bottom-[5%] left-[8%] w-[340px] h-[440px] z-[1] animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-700">
              <div className="relative w-full h-full rounded-[30px] overflow-hidden border-2 border-[#14B871]/20 shadow-[0_25px_50px_rgba(0,0,0,0.7)] -rotate-6 hover:rotate-2 hover:scale-105 transition-all duration-700 ease-out group">
                <Image
                  src="/image 3.jpg"
                  alt="Football Legend"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
              </div>
            </div>

            {/* Decorative Ambient Accents */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#14B871]/15 blur-[120px] rounded-full z-0 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
