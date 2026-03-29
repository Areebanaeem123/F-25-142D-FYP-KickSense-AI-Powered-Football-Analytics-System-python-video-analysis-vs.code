"use client"

import { useState, useEffect } from "react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ShotEvent {
    xg: number
    frame_idx: number
    team_id: number
}

interface XGTimelineProps {
    matchId?: number
}

export function XGTimeline({ matchId = 1 }: XGTimelineProps) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchXG = async () => {
            setLoading(true)
            try {
                const response = await fetch(`/api/shooting-stats?match_id=${matchId}`)
                if (response.ok) {
                    const shots: ShotEvent[] = await response.json()

                    // Process shots into cumulative xG
                    const sortedShots = shots.sort((a, b) => a.frame_idx - b.frame_idx)
                    let team0XG = 0
                    let team1XG = 0

                    const timeline = sortedShots.map(shot => {
                        if (shot.team_id === 0) team0XG += shot.xg || 0
                        else team1XG += shot.xg || 0

                        return {
                            frame: shot.frame_idx,
                            time: Math.floor(shot.frame_idx / 30), // Approx seconds
                            team0: parseFloat(team0XG.toFixed(3)),
                            team1: parseFloat(team1XG.toFixed(3))
                        }
                    })

                    // Ensure we have at least a baseline for the chart even if no shots
                    const finalTimeline = timeline.length > 0 ? timeline : []
                    finalTimeline.unshift({ frame: 0, time: 0, team0: 0, team1: 0 })

                    // If no shots, add a second point to create a flat line
                    if (finalTimeline.length === 1) {
                        finalTimeline.push({ frame: 2250, time: 75, team0: 0, team1: 0 })
                    }

                    setData(finalTimeline)
                }
            } catch (error) {
                console.error("Error fetching xG timeline:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchXG()
    }, [matchId])

    if (loading) return <div className="h-64 flex items-center justify-center text-[#9cb8a9]">Loading xG timeline...</div>

    return (
        <Card className="glass border-[#14B871]/10">
            <CardHeader className="py-4 px-6 border-b border-white/5">
                <CardTitle className="text-xs font-black text-white tracking-widest">Match Threat (Cumulative xG)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full relative">
                    {data.length <= 2 && data[0]?.team0 === 0 && data[0]?.team1 === 0 && !loading && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
                            <p className="text-[#9cb8a9] text-xs italic">Awaiting first shot event to calculate match threat...</p>
                        </div>
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorTeam0" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#006747" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#006747" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorTeam1" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="white" vertical={false} opacity={0.05} />
                            <XAxis
                                dataKey="time"
                                stroke="#9cb8a9"
                                fontSize={10}
                                tickFormatter={(val) => `${Math.floor(val / 60)}:${(val % 60).toString().padStart(2, '0')}`}
                            />
                            <YAxis stroke="#9cb8a9" fontSize={10} />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#000000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                                labelFormatter={(val) => `Time: ${Math.floor(val / 60)}:${(val % 60).toString().padStart(2, '0')}`}
                            />
                            <Legend iconType="circle" />
                            <Area
                                type="stepAfter"
                                dataKey="team0"
                                name="Team A xG"
                                stroke="#006747"
                                fillOpacity={1}
                                fill="url(#colorTeam0)"
                                strokeWidth={2}
                            />
                            <Area
                                type="stepAfter"
                                dataKey="team1"
                                name="Team B xG"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorTeam1)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
