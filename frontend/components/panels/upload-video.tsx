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
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Direct Upload</h1>
        <p className="mt-2 text-sm text-white/40 font-bold uppercase tracking-widest leading-none">Ingest match footage for AI-powered intelligence</p>
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
        className={`glass-card cursor-pointer rounded-3xl p-16 text-center transition-all duration-500 border-2 border-dashed ${isDragging
            ? "border-[#006747] bg-[#006747]/10 scale-[1.01]"
            : "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
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
          <div className={`flex h-24 w-24 items-center justify-center rounded-3xl bg-[#006747]/10 border border-[#006747]/20 shadow-2xl ${isDragging ? "animate-pulse" : ""}`}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#006747" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <div className="glass-card rounded-3xl p-8 border-white/5 bg-black/60 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-6 w-6 border-[3px] border-[#006747] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-black text-white uppercase tracking-widest">
                    {progress < 100 ? "Syncing Logic..." : "Data Normalized"}
                  </span>
                </div>
                <span className="text-sm font-black text-[#006747] tabular-nums">{progress}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full rounded-full transition-all duration-500 shadow-[0_0_15px_#006747]"
                  style={{
                    width: `${progress}%`,
                    background: "#006747",
                  }}
                />
              </div>
            </div>
          ) : progress === 100 ? (
            <div className="glass-card rounded-3xl p-8 border-[#006747]/40 bg-[#006747]/5 shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006747] shadow-[0_0_20px_#006747]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-black text-white uppercase tracking-widest leading-none">Intelligence Locked</p>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Ready for spatiotemporal analysis</p>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={simulateUpload}
              className="inline-flex items-center justify-center gap-3 rounded-2xl px-8 py-5 text-sm font-black text-white transition-all duration-500 hover:scale-[1.02] bg-[#006747] shadow-[0_0_30px_rgba(0,103,71,0.3)] hover:shadow-[0_0_40px_rgba(0,103,71,0.5)] active:scale-[0.98] uppercase tracking-[0.2em]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Initiate Neural Analysis
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
          <div key={stat.label} className="glass-card rounded-3xl p-6 border-white/5 bg-white/[0.02] group hover:bg-white/[0.04] transition-all duration-500">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006747]/10 border border-[#006747]/20 group-hover:bg-[#006747]/20 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006747" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={stat.icon} />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-black text-white tabular-nums tracking-tighter">{stat.value}</p>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
