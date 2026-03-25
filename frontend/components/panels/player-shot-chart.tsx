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
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Zap, TrendingUp, Info } from "lucide-react"

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
    x_origin: number
    y_origin: number
}

interface PlayerShotChartProps {
    playerId: number
    matchId?: number
}

export function PlayerShotChart({ playerId, matchId = 1 }: PlayerShotChartProps) {
    const [shots, setShots] = useState<ShotEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPlayerShots = async () => {
            setLoading(true)
            try {
                const response = await fetch(`/api/shooting-stats?match_id=${matchId}&player_id=${playerId}`)
                if (response.ok) {
                    const data = await response.json()
                    setShots(data)
                }
            } catch (error) {
                console.error("Error fetching player shots:", error)
            } finally {
                setLoading(false)
            }
        }

        if (playerId) {
            fetchPlayerShots()
        }
    }, [playerId, matchId])

    if (loading) {
        return <div className="h-48 flex items-center justify-center text-[#9cb8a9]">Loading shots...</div>
    }

    if (shots.length === 0) {
        return (
            <Card className="glass border-[#14B871]/10">
                <CardContent className="flex flex-col items-center justify-center h-48 text-[#9cb8a9]">
                    <Target className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">No shots detected for this player.</p>
                </CardContent>
            </Card>
        )
    }

    const totalXg = shots.reduce((acc, s) => acc + (s.xg || 0), 0)
    const avgDistance = shots.reduce((acc, s) => acc + s.distance_m, 0) / shots.length
    const goals = shots.filter(s => s.is_goal).length

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="glass p-3 rounded-lg border border-[#14B871]/20">
                    <div className="flex items-center gap-2 text-[10px] text-[#9cb8a9] mb-1">
                        <TrendingUp className="w-3 h-3 text-[#14B871]" /> Total xG
                    </div>
                    <div className="text-xl font-bold text-[#e8f5ee]">{totalXg.toFixed(2)}</div>
                </div>
                <div className="glass p-3 rounded-lg border border-[#14B871]/20">
                    <div className="flex items-center gap-2 text-[10px] text-[#9cb8a9] mb-1">
                        <Target className="w-3 h-3 text-[#14B871]" /> Avg Distance
                    </div>
                    <div className="text-xl font-bold text-[#e8f5ee]">{avgDistance.toFixed(1)}m</div>
                </div>
                <div className="glass p-3 rounded-lg border border-[#14B871]/20">
                    <div className="flex items-center gap-2 text-[10px] text-[#9cb8a9] mb-1">
                        <Zap className="w-3 h-3 text-[#14B871]" /> Efficiency
                    </div>
                    <div className="text-xl font-bold text-[#e8f5ee]">
                        {(goals / totalXg).toFixed(2)} <span className="text-[10px] font-normal text-[#9cb8a9]">G/xG</span>
                    </div>
                </div>
            </div>

            <Card className="glass border-[#14B871]/10 overflow-hidden">
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-[#14B871]/10">
                    <CardTitle className="text-xs font-semibold text-[#e8f5ee]">Individual Shot Map</CardTitle>
                    <div className="flex gap-3 text-[9px]">
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#14B871]" /> Goal</div>
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" /> On Target</div>
                        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" /> Off Target</div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-[240px] relative bg-[#050F0C]/40">
                        {/* Field Markings */}
                        <div className="absolute inset-x-0 top-0 h-[10%] border-x border-b border-[#14B87120] rounded-b-xl mx-auto w-[40%]" />
                        <div className="absolute inset-x-0 bottom-0 h-[10%] border-x border-t border-[#14B87120] rounded-t-xl mx-auto w-[40%]" />
                        <div className="absolute inset-y-0 left-0 right-0 m-auto border-t border-[#14B87120] w-full" />
                        <div className="absolute inset-0 m-auto border border-[#14B87110] rounded-full w-24 h-24" />

                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <XAxis type="number" dataKey="x_origin" domain={[-52.5, 52.5]} hide />
                                <YAxis type="number" dataKey="y_origin" domain={[-34, 34]} hide />
                                <ZAxis type="number" dataKey="xg" range={[50, 600]} />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload as ShotEvent
                                            return (
                                                <div className="glass p-3 border border-[#14B87140] rounded-lg shadow-xl shadow-black/50">
                                                    <p className="text-xs font-bold text-[#e8f5ee]">Shot Details</p>
                                                    <div className="mt-1 space-y-0.5 text-[10px]">
                                                        <p className="text-[#9cb8a9]">Power: <span className="text-[#e8f5ee]">{data.power_ms.toFixed(1)} m/s</span></p>
                                                        <p className="text-[#9cb8a9]">Distance: <span className="text-[#e8f5ee]">{data.distance_m.toFixed(1)} m</span></p>
                                                        <p className="text-[#9cb8a9]">xG: <span className="text-[#14B871] font-bold">{data.xg?.toFixed(3)}</span></p>
                                                    </div>
                                                    <p className={`text-[10px] font-bold mt-2 ${data.is_goal ? 'text-[#14B871]' : data.is_on_target ? 'text-blue-400' : 'text-red-400'}`}>
                                                        {data.is_goal ? 'GOAL!' : data.is_on_target ? 'On Target' : 'Off Target'}
                                                    </p>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Scatter name="Player Shots" data={shots}>
                                    {shots.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.is_goal ? '#14B871' : entry.is_on_target ? '#3b82f6' : '#ef4444'}
                                            className="drop-shadow-[0_0_8px_rgba(20,184,113,0.5)]"
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="glass rounded-lg border border-[#14B871]/10 overflow-hidden">
                <table className="w-full text-left text-[10px]">
                    <thead className="bg-[#14B8710a] text-[#9cb8a9] uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-2 font-semibold">Frame</th>
                            <th className="px-4 py-2 font-semibold">Dist (m)</th>
                            <th className="px-4 py-2 font-semibold">Power</th>
                            <th className="px-4 py-2 font-semibold">xG</th>
                            <th className="px-4 py-2 font-semibold text-right">Result</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#14B87110]">
                        {shots.slice().reverse().map((shot) => (
                            <tr key={shot.shot_id} className="hover:bg-[#14B87105] transition-colors">
                                <td className="px-4 py-2 text-[#e8f5ee]">#{shot.frame_idx}</td>
                                <td className="px-4 py-2 text-[#e8f5ee]">{shot.distance_m.toFixed(1)}</td>
                                <td className="px-4 py-2 text-[#e8f5ee]">{shot.power_ms.toFixed(1)}</td>
                                <td className="px-4 py-2 font-mono text-[#14B871]">{shot.xg?.toFixed(3)}</td>
                                <td className="px-4 py-2 text-right">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${shot.is_goal ? "bg-[#14B871]/20 text-[#14B871]" :
                                        shot.is_on_target ? "bg-blue-400/20 text-blue-400" :
                                            "bg-red-400/20 text-red-400"
                                        }`}>
                                        {shot.is_goal ? "GOAL" : shot.is_on_target ? "ON TARGET" : "OFF TARGET"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
