"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Shield, Activity } from "lucide-react"

interface TeamStat {
    label: string
    value: number
}

export function TeamPossessionOverview() {
    const [stats, setStats] = useState<TeamStat[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/match-insights")
                if (res.ok) {
                    const data = await res.json()
                    // Filter for possession labels
                    const possessionStats = data.teamStats.filter((s: any) => s.label.toLowerCase().includes("possession"))
                    setStats(possessionStats)
                }
            } catch (err) {
                console.error("Error fetching match insights:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading || stats.length === 0) return null

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {stats.map((stat, i) => (
                <Card key={i} className="glass-card p-6 border-white/5 bg-gradient-to-br from-[#006747]/10 to-transparent relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#006747]/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-[#006747]/10 transition-all duration-500" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-xs font-black text-white/30 tracking-widest uppercase mb-1">{stat.label}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-white tracking-tighter">{stat.value}%</span>
                                <div className="h-2 w-32 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#006747] shadow-[0_0_15px_#14B871]"
                                        style={{ width: `${stat.value}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-[#006747]" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}
