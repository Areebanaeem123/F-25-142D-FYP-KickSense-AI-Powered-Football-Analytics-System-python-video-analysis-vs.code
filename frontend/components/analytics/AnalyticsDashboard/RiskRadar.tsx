"use client"

import { useState, useEffect } from "react"
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    Tooltip
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PlayerStat {
    Track_ID: number
    Foul_Risk: number
    Yellow_Likelihood: number
    Red_Likelihood: number
}

interface RiskRadarProps {
    matchId?: number
}

export function RiskRadar({ matchId = 1 }: RiskRadarProps) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true)
            try {
                const response = await fetch(`/api/player-stats?match_id=${matchId}`)
                if (response.ok) {
                    const stats: PlayerStat[] = await response.json()

                    // Show top 10 most "at risk" players
                    const atRisk = (stats || [])
                        .filter(p => (p.Foul_Risk || 0) > 0.1)
                        .sort((a, b) => (b.Foul_Risk || 0) - (a.Foul_Risk || 0))
                        .slice(0, 10)
                        .map(p => ({
                            player: `P${p.Track_ID}`,
                            risk: (p.Foul_Risk || 0) * 100,
                            yellow: (p.Yellow_Likelihood || 0) * 100,
                            red: (p.Red_Likelihood || 0) * 100
                        }))

                    setData(atRisk)
                }
            } catch (error) {
                console.error("Error fetching risk stats:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [matchId])

    if (loading) return <div className="h-64 flex items-center justify-center text-[#9cb8a9]">Loading risk profile...</div>

    if (data.length === 0) {
        return (
            <Card className="glass border-white/5 h-64 flex items-center justify-center">
                <p className="text-sm text-white/40 italic font-medium">No significant disciplinary risks detected.</p>
            </Card>
        )
    }

    return (
        <Card className="glass border-white/5">
            <CardHeader className="py-4 px-6 border-b border-white/5">
                <CardTitle className="text-xs font-black text-white uppercase tracking-widest">Squad Disciplinary Profile</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={data}>
                            <PolarGrid stroke="white" strokeOpacity={0.05} />
                            <PolarAngleAxis dataKey="player" tick={{ fill: 'white', opacity: 0.6, fontSize: 10, fontWeight: 700 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#000000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                            />
                            <Radar
                                name="Foul Risk"
                                dataKey="risk"
                                stroke="#f59e0b"
                                fill="#f59e0b"
                                fillOpacity={0.4}
                            />
                            <Radar
                                name="Yellow Likelihood"
                                dataKey="yellow"
                                stroke="#fbbf24"
                                fill="#fbbf24"
                                fillOpacity={0.2}
                            />
                            <Radar
                                name="Red Likelihood"
                                dataKey="red"
                                stroke="#ef4444"
                                fill="#ef4444"
                                fillOpacity={0.2}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
