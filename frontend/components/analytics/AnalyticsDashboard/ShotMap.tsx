"use client"

import { useState, useEffect } from "react"
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Line,
    ComposedChart
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, AlertCircle } from "lucide-react"

interface ShotEvent {
    shot_id: number
    track_id: number
    team_id: number
    frame_idx: number
    distance_m: number
    power_ms: number
    xg: number
    is_on_target: boolean
    is_goal: boolean
    is_big_chance: boolean
    x_origin: number
    y_origin: number
    trajectory: string | [number, number][]
}

interface ShotMapProps {
    playerId?: number | "all"
    matchId?: number
}

export function ShotMap({ playerId = "all", matchId = 1 }: ShotMapProps) {
    const [shots, setShots] = useState<ShotEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchShots = async () => {
            setLoading(true)
            try {
                const url = playerId === "all"
                    ? `/api/shooting-stats?match_id=${matchId}`
                    : `/api/shooting-stats?match_id=${matchId}&player_id=${playerId}`
                const response = await fetch(url)
                if (response.ok) {
                    const data = await response.json()
                    setShots(data)
                }
            } catch (error) {
                console.error("Error fetching shots:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchShots()
    }, [playerId, matchId])

    if (loading) return <div className="h-64 flex items-center justify-center text-[#9cb8a9]">Loading shot map...</div>

    return (
        <Card className="glass border-[#14B871]/10 overflow-hidden">
            <CardHeader className="py-4 px-6 flex flex-row items-center justify-between border-b border-white/5">
                <CardTitle className="text-xs font-black text-white tracking-widest">Live Ball Trajectories</CardTitle>
                <div className="flex gap-4 text-[10px] font-bold tracking-widest">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#006747]" /> Goal</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#3b82f6]" /> On Target</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ef4444]" /> Off Target</div>
                    <div className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-yellow-400" /> Big Chance</div>
                </div>
            </CardHeader>
            <CardContent className="p-0 relative bg-[#050F0C]">
                {/* Pitch Visualization */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute inset-0 border-2 border-white/20" />
                    <div className="absolute inset-y-0 left-1/2 border-l-2 border-white/20" />
                    <div className="absolute inset-0 m-auto border-2 border-white/20 rounded-full w-48 h-48" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-t-0 border-white/20" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-b-0 border-white/20" />
                </div>

                <div className="h-[400px] w-full relative">
                    {shots.length === 0 && !loading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl border border-dashed border-white/10 m-4">
                            <Target className="w-12 h-12 text-[#006747] opacity-20 mb-4" />
                            <p className="text-[#e8f5ee] font-bold text-lg">No Shots Detected Yet</p>
                            <p className="text-[#9cb8a9] text-xs max-w-xs text-center mt-2 px-6">
                                The AI is scanning for ball velocity spikes &gt; 8m/s.
                                Movements below this threshold are not classified as shots.
                            </p>
                        </div>
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <XAxis type="number" dataKey="x_origin" domain={[-52.5, 52.5]} hide />
                            <YAxis type="number" dataKey="y_origin" domain={[-34, 34]} hide />
                            <ZAxis type="number" dataKey="xg" range={[100, 1000]} />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload as ShotEvent
                                        return (
                                            <div className="glass p-4 border border-[#14B87140] rounded-xl shadow-2xl backdrop-blur-md">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-sm font-bold text-[#e8f5ee]">Player {data.track_id}</p>
                                                    {data.is_big_chance && (
                                                        <span className="bg-yellow-400/20 text-yellow-400 text-[8px] px-1.5 py-0.5 rounded font-bold tracking-tighter">Big Chance</span>
                                                    )}
                                                </div>
                                                <div className="space-y-1 text-[11px]">
                                                    <p className="text-[#9cb8a9]">xG: <span className="text-[#006747] font-mono font-bold">{data.xg?.toFixed(3)}</span></p>
                                                    <p className="text-[#9cb8a9]">Power: <span className="text-[#e8f5ee]">{data.power_ms.toFixed(1)} m/s</span></p>
                                                    <p className="text-[#9cb8a9]">Distance: <span className="text-[#e8f5ee]">{data.distance_m.toFixed(1)} m</span></p>
                                                </div>
                                                <div className={`mt-3 text-xs font-bold ${data.is_goal ? 'text-[#006747]' : data.is_on_target ? 'text-blue-400' : 'text-red-400'}`}>
                                                    {data.is_goal ? 'GOAL' : data.is_on_target ? 'ON TARGET' : 'OFF TARGET'}
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Scatter name="Shots" data={shots}>
                                {shots.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.is_goal ? '#006747' : entry.is_on_target ? '#3b82f6' : '#ef4444'}
                                        stroke={entry.is_big_chance ? '#fbbf24' : 'none'}
                                        strokeWidth={entry.is_big_chance ? 3 : 0}
                                        className="drop-shadow-[0_0_12px_rgba(0,103,71,0.5)] hover:opacity-80 transition-opacity cursor-pointer"
                                    />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
