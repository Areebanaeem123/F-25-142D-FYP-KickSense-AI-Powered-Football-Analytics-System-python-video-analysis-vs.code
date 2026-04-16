"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Crosshair, Maximize2, Move, Shield } from "lucide-react"

interface PlayerPosition {
    x: string
    y: string
    number: number
}

interface FormationData {
    detectedFormation: string
    tacticalStatus?: string
    convexHullArea: number
    avgPlayerSpacing: number
    teamWidth: number
    teamDepth: number
    possessionPercentage?: number
    playerPositions: PlayerPosition[]
}

export function FormationAnalysis() {
    const [teamId, setTeamId] = useState(0)
    const [data, setData] = useState<FormationData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchFormation = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/formation?team_id=${teamId}`)
                if (res.ok) {
                    const d = await res.json()
                    setData(d)
                }
            } catch (err) {
                console.error("Error fetching formation:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchFormation()
    }, [teamId])

    return (
        <div className="animate-fade-in flex flex-col gap-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tighter">Formation Intelligence</h1>
                    <p className="mt-2 text-base text-white/40 font-bold tracking-widest leading-none">
                        Tactical structure and spatial distribution
                    </p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 shadow-2xl">
                    {[0, 1].map((id) => (
                        <button
                            key={id}
                            onClick={() => setTeamId(id)}
                            className={`px-6 py-2.5 rounded-xl font-black text-xs tracking-[0.2em] transition-all duration-300 ${teamId === id
                                ? "bg-[#006747] text-white shadow-lg shadow-[#006747]/20"
                                : "text-white/40 hover:text-white"
                                }`}
                        >
                            TEAM {String.fromCharCode(65 + id)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tactical Pitch */}
                <Card className="lg:col-span-2 glass-card p-4 border-white/5 relative aspect-[1.4/1] flex flex-col overflow-hidden">
                    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none p-4">
                        {/* Pitch Markings */}
                        <div className="w-full h-full border-2 border-white/40 rounded-sm relative">
                            {/* Center Circle */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] aspect-square border-2 border-white/40 rounded-full" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white/40 rounded-full" />
                            {/* Halfway Line */}
                            <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white/40 -translate-x-1/2" />
                            {/* Boxes */}
                            <div className="absolute top-[20%] bottom-[20%] left-0 w-[16%] border-2 border-l-0 border-white/40" />
                            <div className="absolute top-[20%] bottom-[20%] right-0 w-[16%] border-2 border-r-0 border-white/40" />
                        </div>
                    </div>

                    <div className="relative z-10 flex-1 w-full h-full">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-[#006747] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : data && data.playerPositions.length > 0 ? (
                            data.playerPositions.map((p, i) => (
                                <div
                                    key={i}
                                    className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
                                    style={{ left: p.x, top: p.y }}
                                >
                                    <div className="relative group">
                                        <div className="w-10 h-10 rounded-full bg-[#006747] border-2 border-white/20 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform cursor-pointer">
                                            <span className="text-[10px] font-black text-white">{p.number}</span>
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                                            <p className="text-[8px] font-black text-white tracking-widest uppercase">Player ID: {p.number}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-white/20 font-black tracking-widest italic text-center">
                                    NO TRACKING DATA DETECTED<br />
                                    <span className="text-[10px] not-italic opacity-50">Please run the analytics pipeline</span>
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex justify-between items-center text-[10px] font-black tracking-widest text-white/30 uppercase border-t border-white/5 pt-4">
                        <span>Tactical Heatmap (Real-time Position Mapping)</span>
                        <span className="text-[#006747]">Active Intelligence v4.0</span>
                    </div>
                </Card>

                {/* Stats Column */}
                <div className="space-y-6">
                    <Card className="glass-card p-6 border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#006747]/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-[#006747]/20 transition-all duration-500" />
                        <h3 className="text-xs font-black text-white/30 tracking-widest uppercase mb-6 flex items-center gap-2">
                            <Users className="w-3 h-3" /> Core Structure
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-white/40 tracking-widest uppercase mb-1">Detected Formation</p>
                                <p className="text-5xl font-black text-white tracking-tighter">
                                    {loading ? "..." : data?.detectedFormation || "N/A"}
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-[#006747]/5 border border-[#006747]/20">
                                <p className="text-[10px] font-black text-white/40 tracking-widest uppercase mb-2">Tactical Status</p>
                                <Badge className="bg-[#006747] text-white border-none py-1.5 px-4 rounded-xl font-black text-xs shadow-lg">
                                    {loading ? "Analyzing..." : data?.tacticalStatus || "Standard"}
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 gap-4">
                        {[
                            {
                                label: "Ball Possession",
                                value: data?.possessionPercentage,
                                unit: "%",
                                icon: <Shield className="w-4 h-4 text-[#006747]" />,
                                desc: "Match time with ball control"
                            },
                            {
                                label: "Occupied Area",
                                value: data?.convexHullArea,
                                unit: "m²",
                                icon: <Maximize2 className="w-4 h-4 text-blue-400" />,
                                desc: "Total pitch control area"
                            },
                            {
                                label: "Spread Index",
                                value: data?.avgPlayerSpacing,
                                unit: "m²/p",
                                icon: <Move className="w-4 h-4 text-[#006747]" />,
                                desc: "Spatial density per person"
                            }
                        ].map((stat, i) => (
                            <Card key={i} className="glass-card p-5 border-white/5 group hover:border-[#006747]/30 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-white/30 tracking-widest uppercase mb-1">{stat.label}</p>
                                        <div className="flex items-baseline gap-1">
                                            <p className="text-2xl font-black text-white">
                                                {loading ? "..." : (stat.value !== undefined ? stat.value.toFixed(1) : "0.0")}
                                            </p>
                                            <span className="text-xs font-bold text-white/30 uppercase">{stat.unit}</span>
                                        </div>
                                        <p className="text-[8px] font-bold text-white/20 mt-1 uppercase tracking-tighter italic">{stat.desc}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        {stat.icon}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <Card className="glass-card p-6 border-white/5 bg-gradient-to-br from-[#006747]/10 to-transparent">
                        <h3 className="text-[10px] font-black text-white tracking-widest uppercase mb-4 flex items-center gap-2">
                            <Crosshair className="w-3 h-3 text-[#006747]" /> Contextual Insight
                        </h3>
                        <p className="text-[10px] leading-relaxed text-white/50 font-medium">
                            Formation mapping is based on high-frequency AI tracking data.
                            The **Detected Formation** reflects the average structural positioning
                            of the squad during the latest analyzed segment.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    )
}
