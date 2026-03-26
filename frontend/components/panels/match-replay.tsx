"use client"

import { useState, useRef } from "react"
import { Play, Pause, RotateCcw, Download, Maximize, Volume2, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function MatchReplay() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
                setIsPlaying(false)
            } else {
                videoRef.current.play().catch(() => {
                    // Ignore play() interrupted by pause() errors
                })
                setIsPlaying(true)
            }
        }
    }

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime
            const duration = videoRef.current.duration
            if (duration && !isNaN(duration) && duration > 0) {
                setProgress((current / duration) * 100)
            }
        }
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const newTime = (parseFloat(e.target.value) / 100) * videoRef.current.duration
            videoRef.current.currentTime = newTime
            setProgress(parseFloat(e.target.value))
        }
    }

    const resetVideo = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0
            videoRef.current.play().catch(() => { })
            setIsPlaying(true)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase">AI Tactical Replay</h1>
                    <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Neural-Processed Match Discovery</p>
                </div>
                <button
                    onClick={() => window.open('/api/video', '_blank')}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl border border-white/10 transition-all font-black uppercase text-[10px] tracking-widest"
                >
                    <Download className="w-3.5 h-3.5" /> Export Analysis
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Player */}
                <Card className="lg:col-span-2 glass border-white/5 bg-black/60 overflow-hidden group relative shadow-2xl">
                    <div className="relative aspect-video bg-black">
                        <video
                            ref={videoRef}
                            src="/api/video"
                            className="w-full h-full object-contain"
                            onTimeUpdate={handleTimeUpdate}
                            onClick={togglePlay}
                            playsInline
                            preload="auto"
                        />

                        {/* Custom Overlay Controls */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            {!isPlaying && (
                                <button onClick={togglePlay} className="w-20 h-20 rounded-full bg-[#006747] flex items-center justify-center shadow-[0_0_40px_rgba(0,103,71,0.5)] pointer-events-auto transform hover:scale-110 active:scale-95 transition-all">
                                    <Play fill="white" className="w-8 h-8 text-white ml-2 scale-125" />
                                </button>
                            )}
                        </div>

                        {/* Control Bar */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-auto">
                            <div className="space-y-4">
                                {/* Progress Bar */}
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={isNaN(progress) ? 0 : progress}
                                    onChange={handleSeek}
                                    className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer accent-[#006747] hover:accent-[#008a5f] transition-all"
                                />

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <button onClick={togglePlay} className="text-white hover:text-[#006747] transition-all transform hover:scale-110">
                                            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
                                        </button>
                                        <button onClick={resetVideo} className="text-white hover:text-[#006747] transition-all transform hover:scale-110">
                                            <RotateCcw className="w-5 h-5" />
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <Volume2 className="w-5 h-5 text-white/40" />
                                            <div className="w-20 h-1 bg-white/10 rounded-full">
                                                <div className="w-2/3 h-full bg-white/40 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest tabular-nums">
                                            HD Neural Stream
                                        </span>
                                        <button className="text-white hover:text-[#006747] transition-all">
                                            <Maximize className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="glass border-white/5 bg-black/40 h-full">
                        <CardHeader className="border-b border-white/5 pb-4">
                            <CardTitle className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Shield className="w-4 h-4 text-[#006747]" /> Tactical Analysis
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">AI-detected match context</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="p-5 rounded-2xl bg-[#006747]/5 border border-[#006747]/20 shadow-2xl">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest block mb-2">Active Modalities</span>
                                <div className="space-y-3">
                                    {[
                                        { label: "Player Centric Tracking", status: "Active" },
                                        { label: "Ball Trajectory AI", status: "Active" },
                                        { label: "Team Centroid Mapping", status: "Calibrating" },
                                        { label: "Event Detection (Beta)", status: "Active" }
                                    ].map((mod) => (
                                        <div key={mod.label} className="flex justify-between items-center bg-black/40 p-2.5 rounded-xl border border-white/5">
                                            <span className="text-[9px] font-bold text-white/60 uppercase">{mod.label}</span>
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${mod.status === 'Active' ? 'text-[#006747]' : 'text-yellow-500'}`}>
                                                {mod.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Neural Summary</h4>
                                <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                                    This recording contains the complete spatiotemporal analysis of the match. Neural networks have been applied to detect player identities, velocity vectors, and high-impact event zones.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                        <span className="text-[8px] font-black text-white/20 uppercase block tracking-widest">Resolution</span>
                                        <span className="text-[11px] font-black text-white uppercase tracking-tighter">1080P AI-UP</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                        <span className="text-[8px] font-black text-white/20 uppercase block tracking-widest">Model</span>
                                        <span className="text-[11px] font-black text-white uppercase tracking-tighter">KICKSENSE-V2</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
