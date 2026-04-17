"use client"

import { useState, useEffect } from "react"
import { Shield, Brain, Activity, Database, Cpu } from "lucide-react"

export function AnalysisLoading({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("Initializing Neural Engine")

  const statuses = [
    { threshold: 0, text: "Initializing Neural Engine", icon: Cpu },
    { threshold: 20, text: "Extracting Spatiotemporal Vectors", icon: Activity },
    { threshold: 45, text: "Calibrating Player Identities", icon: Shield },
    { threshold: 70, text: "Fetching Tactical Database Records", icon: Database },
    { threshold: 90, text: "Finalizing Intelligence Report", icon: Brain },
  ]

  useEffect(() => {
    const duration = 4000 // 4 seconds total
    const interval = 50
    const increment = (interval / duration) * 100

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment
        if (next >= 100) {
          clearInterval(timer)
          setTimeout(onComplete, 500)
          return 100
        }

        // Update status text based on progress
        const currentStatus = [...statuses].reverse().find(s => next >= s.threshold)
        if (currentStatus) setStatus(currentStatus.text)

        return next
      })
    }, interval)

    return () => clearInterval(timer)
  }, [onComplete])

  const CurrentIcon = statuses.find(s => s.text === status)?.icon || Cpu

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#14B871]/20 blur-[150px] rounded-full transition-all duration-1000"
          style={{ opacity: 0.1 + (progress / 100) * 0.4, scale: String(0.8 + (progress / 100) * 0.4) }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-12">
        {/* Animated Icon Container */}
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
          <div 
            className="absolute inset-0 border-4 border-[#14B871] rounded-full border-t-transparent animate-spin transition-all duration-500"
            style={{ animationDuration: '1s' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <CurrentIcon className="w-12 h-12 text-[#14B871] animate-pulse" />
          </div>
        </div>

        {/* Status Text */}
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic font-outfit">
            {progress < 100 ? "Analyzing" : "Complete"}
          </h2>
          <div className="flex flex-col items-center gap-2">
            <p className="text-[#14B871] font-black tracking-[0.3em] uppercase text-sm animate-pulse">
              {status}
            </p>
            <p className="text-[#9cb8a9]/40 font-bold tabular-nums">
              {Math.floor(progress)}%
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-[#14B871] shadow-[0_0_20px_rgba(20,184,113,0.5)] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Subtitle */}
        <p className="text-[#9cb8a9] text-xs font-bold tracking-widest uppercase opacity-40">
          Kicksense Neural Engine v2.4a
        </p>
      </div>

      {/* Background Grid (Subtle) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#14B871 1px, transparent 1px), linear-gradient(90deg, #14B871 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />
    </div>
  )
}
