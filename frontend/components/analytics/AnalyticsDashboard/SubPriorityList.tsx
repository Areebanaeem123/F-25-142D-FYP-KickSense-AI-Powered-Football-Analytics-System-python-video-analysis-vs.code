"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertTriangle, UserMinus, ShieldAlert } from "lucide-react"

interface PlayerStat {
    Track_ID: number
    Team_ID: number
    Foul_Risk: number
    Yellow_Likelihood: number
    Red_Likelihood: number
    Sub_Priority: number
    Card_Prediction: string
}

export function SubPriorityList({ matchId = 1 }: { matchId?: number }) {
    const [recommendations, setRecommendations] = useState<PlayerStat[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true)
            try {
                const response = await fetch(`/api/player-stats?match_id=${matchId}`)
                if (response.ok) {
                    const stats: any[] = await response.json()

                    // Map backend fields correctly
                    const processed = stats.map(s => ({
                        Track_ID: s.Track_ID,
                        Team_ID: s.Team_ID || 0,
                        Foul_Risk: s.Foul_Risk || 0,
                        Yellow_Likelihood: s.Yellow_Likelihood || 0,
                        Red_Likelihood: s.Red_Likelihood || 0,
                        Sub_Priority: s.Sub_Priority || 0,
                        Card_Prediction: s.Card_Prediction || "None"
                    }))
                        .filter(p => p.Sub_Priority > 10) // Only show players with some risk
                        .sort((a, b) => b.Sub_Priority - a.Sub_Priority)

                    setRecommendations(processed)
                }
            } catch (error) {
                console.error("Error fetching sub recommendations:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchRecommendations()
    }, [matchId])

    if (loading) return <div className="h-64 flex items-center justify-center text-[#9cb8a9]">Loading recommendations...</div>

    return (
        <Card className="glass border-white/5">
            <CardHeader className="py-4 px-6 border-b border-white/5">
                <CardTitle className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <UserMinus className="w-4 h-4 text-red-500" /> Strategic Substitutions
                </CardTitle>
                <CardDescription className="text-[10px] text-white/40 uppercase font-bold tracking-tighter mt-1">
                    Prioritizing players with high disciplinary risk
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {recommendations.length === 0 ? (
                    <p className="text-xs text-[#9cb8a9] text-center py-4">All players are currently within safe disciplinary limits.</p>
                ) : (
                    recommendations.map((p) => (
                        <div
                            key={p.Track_ID}
                            className={`p-4 rounded-2xl border flex items-center justify-between group transition-all duration-300 ${p.Sub_Priority > 70
                                ? "bg-red-950/20 border-red-500/20 hover:bg-red-500/20"
                                : "bg-white/5 border-white/5 hover:bg-white/10"
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-xl ${p.Sub_Priority > 70 ? "bg-red-600 text-white" : "bg-white text-black"
                                    }`}>
                                    P{p.Track_ID}
                                </div>
                                <div>
                                    <div className="text-xs font-black text-white uppercase tracking-wider">Player {p.Track_ID}</div>
                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">Team {p.Team_ID === 0 ? 'A' : 'B'} • {p.Card_Prediction}</div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-[9px] text-white/30 uppercase font-black tracking-widest">Sub Priority</div>
                                <div className={`text-xl font-black leading-none ${p.Sub_Priority > 70 ? "text-red-500" : "text-white"
                                    }`}>
                                    {p.Sub_Priority.toFixed(0)}%
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}
