"use client"

import React from "react"

import { useState, useRef, useCallback } from "react"

export function UploadVideoPanel() {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type.startsWith("video/")) {
      setFile(dropped)
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }, [])

  const simulateUpload = useCallback(() => {
    setUploading(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)
          return 100
        }
        return prev + 2
      })
    }, 60)
  }, [])

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e8f5ee]">Upload Video</h1>
        <p className="mt-1 text-sm text-[#9cb8a9]">Upload match footage for AI-powered analysis</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
        }}
        role="button"
        tabIndex={0}
        aria-label="Drop zone for video upload"
        className={`glass-card cursor-pointer rounded-2xl p-12 text-center transition-all duration-300 ${
          isDragging
            ? "border-[#14B871]/50 bg-[#14B871]/10 scale-[1.01]"
            : ""
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Select video file"
        />

        <div className="flex flex-col items-center gap-4">
          <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-[#14B871]/10 border border-[#14B871]/20 ${isDragging ? "animate-pulse-icon" : ""}`}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#14B871" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          {file ? (
            <div>
              <p className="text-base font-semibold text-[#e8f5ee]">{file.name}</p>
              <p className="mt-1 text-xs text-[#9cb8a9]">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-base font-semibold text-[#e8f5ee]">
                {isDragging ? "Drop your video here" : "Drag & drop your match video"}
              </p>
              <p className="mt-1 text-sm text-[#9cb8a9]">
                or click to browse - MP4, MOV, AVI supported
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload button + progress */}
      {file && (
        <div className="animate-slide-up flex flex-col gap-4">
          {uploading ? (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 border-2 border-[#14B871] border-t-transparent rounded-full" style={{ animation: "spin 1s linear infinite" }} />
                  <span className="text-sm font-medium text-[#e8f5ee]">
                    {progress < 100 ? "Uploading..." : "Processing complete"}
                  </span>
                </div>
                <span className="text-sm font-bold text-[#14B871]">{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#0A3D2C]/80 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #14B871, #0ea860)",
                  }}
                />
              </div>
            </div>
          ) : progress === 100 ? (
            <div className="glass-card rounded-2xl p-6 border-[#14B871]/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14B871]/15">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14B871" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#14B871]">Upload complete</p>
                  <p className="text-xs text-[#9cb8a9]">Your video is ready for analysis</p>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={simulateUpload}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-[#050F0C] transition-all duration-300 hover:scale-[1.02] animate-glow-pulse"
              style={{ background: "linear-gradient(135deg, #14B871, #0ea860)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Start Upload & Analysis
            </button>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Videos Analyzed", value: "127", icon: "M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" },
          { label: "Players Tracked", value: "2,841", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
          { label: "Hours Processed", value: "342h", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14B871]/10 border border-[#14B871]/15">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14B871" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={stat.icon} />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-[#e8f5ee]">{stat.value}</p>
                <p className="text-xs text-[#9cb8a9]">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
