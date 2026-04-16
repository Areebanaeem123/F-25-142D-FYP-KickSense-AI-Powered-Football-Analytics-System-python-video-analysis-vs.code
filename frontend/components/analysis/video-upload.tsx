"use client"

import { useState, useRef } from "react"
import { Upload, FileVideo, ArrowRight, X } from "lucide-react"

interface VideoUploadProps {
  onAnalyze: (file: File) => void
  onBack: () => void
}

export function VideoUpload({ onAnalyze, onBack }: VideoUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("video/")) {
        setSelectedFile(file)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden p-6">
      {/* Background Accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#14B871]/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-[#14B871]/5 blur-[100px] rounded-full" />

      <div className="relative z-10 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-[#9cb8a9] hover:text-white transition-colors mb-8 font-bold tracking-widest uppercase text-xs"
        >
          <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          Cancel Upload
        </button>

        <div className="mb-12">
          <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase leading-none font-outfit">
            {/* Neural <br /> */}
            <span className="text-[#14B871]">Data Input</span>
          </h2>
          <p className="text-[#9cb8a9] mt-4 font-medium text-lg max-w-md">
            Upload match footage for multi-modal tactical extraction.
          </p>
        </div>

        <div
          className={`relative group cursor-pointer transition-all duration-500 rounded-[32px] border-2 border-dashed ${dragActive ? "border-[#14B871] bg-[#14B871]/5 scale-[1.02]" : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            onChange={handleChange}
            className="hidden"
          />

          <div className="p-12 flex flex-col items-center text-center gap-6">
            {!selectedFile ? (
              <>
                <div className="w-20 h-20 rounded-full bg-[#14B871]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Upload className="w-8 h-8 text-[#14B871]" />
                </div>
                <div>
                  <p className="text-xl font-black text-white tracking-tight">Drop match footage here</p>
                  <p className="text-[#9cb8a9] mt-2 font-bold tracking-widest text-xs uppercase italic">Supported: MP4, MOV, AVI</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                  <FileVideo className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-xl font-black text-[#14B871] tracking-tight truncate max-w-sm">{selectedFile.name}</p>
                  <p className="text-[#9cb8a9] mt-2 font-bold tracking-widest text-xs uppercase">File Ready for Extraction</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                  }}
                  className="text-white/20 hover:text-red-500 transition-colors text-sm font-bold tracking-widest uppercase"
                >
                  Remove
                </button>
              </>
            )}
          </div>

          {/* Decorative Corner Accents */}
          <div className="absolute top-6 left-6 w-4 h-4 border-t-2 border-l-2 border-white/10" />
          <div className="absolute top-6 right-6 w-4 h-4 border-t-2 border-r-2 border-white/10" />
          <div className="absolute bottom-6 left-6 w-4 h-4 border-b-2 border-l-2 border-white/10" />
          <div className="absolute bottom-6 right-6 w-4 h-4 border-b-2 border-r-2 border-white/10" />
        </div>

        <div className="mt-12 flex justify-end">
          <button
            disabled={!selectedFile}
            onClick={() => selectedFile && onAnalyze(selectedFile)}
            className={`group relative inline-flex items-center justify-center gap-4 rounded-2xl px-12 py-5 text-xl font-black transition-all duration-500 ${selectedFile
              ? "text-black bg-[#14B871] hover:scale-105 shadow-[0_20px_50px_rgba(20,184,113,0.3)]"
              : "text-white/20 bg-white/5 cursor-not-allowed"
              }`}
          >
            <span className="uppercase tracking-widest font-outfit">Kick Off Analysis</span>
            <ArrowRight className={`w-6 h-6 transition-transform duration-500 ${selectedFile ? "group-hover:translate-x-2" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  )
}
