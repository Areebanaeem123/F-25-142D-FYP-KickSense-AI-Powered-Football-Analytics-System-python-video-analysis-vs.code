"use client"

import { useState, useEffect } from "react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    ZAxis,
    Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Zap, Activity } from "lucide-react"

interface ShotEvent {
    shot_id: number
    track_id: number
    team_id: number
    distance_m: number
    power_ms: number
    is_on_target: boolean
    is_goal: boolean
    x_origin: number
    y_origin: number
}

export function ShootingStats() {
    const [shotEvents, setShotEvents] = useState<ShotEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchShots = async () => {
            try {
                const response = await fetch("/api/shooting-stats")
                if (response.ok) {
                    const data = await response.json()
                    setShotEvents(data)
                }
            } catch (error) {
                console.error("Failed to fetch shooting events:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchShots()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-[#9cb8a9]">Loading shooting analytics...</p>
            </div>
        )
    }

    // Aggregated Metrics
    const totalShots = shotEvents.length
    const onTarget = shotEvents.filter((s) => s.is_on_target).length
    const goals = shotEvents.filter((s) => s.is_goal).length
    const accuracy = totalShots > 0 ? (onTarget / totalShots) * 100 : 0
    const avgPower = shotEvents.length > 0
        ? shotEvents.reduce((acc, s) => acc + s.power_ms, 0) / shotEvents.length
        : 0

    // Power Distribution Data
    const powerBuckets = [
        { range: "0-15m/s", count: 0 },
        { range: "15-20m/s", count: 0 },
        { range: "20-25m/s", count: 0 },
        { range: "25-30m/s", count: 0 },
        { range: "30+ m/s", count: 0 },
    ]

    shotEvents.forEach((s) => {
        if (s.power_ms < 15) powerBuckets[0].count++
        else if (s.power_ms < 20) powerBuckets[1].count++
        else if (s.power_ms < 25) powerBuckets[2].count++
        else if (s.power_ms < 30) powerBuckets[3].count++
        else powerBuckets[4].count++
    })

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="glass border-[#14B871]/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-[#9cb8a9] flex items-center gap-2">
                            <Activity className="w-3 h-3 text-[#14B871]" /> Total Shots
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#e8f5ee]">{totalShots}</div>
                    </CardContent>
                </Card>

                <Card className="glass border-[#14B871]/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-[#9cb8a9] flex items-center gap-2">
                            <Target className="w-3 h-3 text-[#14B871]" /> Accuracy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#e8f5ee]">{accuracy.toFixed(1)}%</div>
                        <p className="text-[10px] text-[#9cb8a9] mt-1">{onTarget} on target</p>
                    </CardContent>
                </Card>

                <Card className="glass border-[#14B871]/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-[#9cb8a9] flex items-center gap-2">
                            <Zap className="w-3 h-3 text-[#14B871]" /> Avg Power
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#e8f5ee]">{avgPower.toFixed(1)} m/s</div>
                    </CardContent>
                </Card>

                <Card className="glass border-[#14B871]/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-[#9cb8a9] flex items-center gap-2">
                            <span className="text-[#14B871]">⚽</span> Goals
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#e8f5ee]">{goals}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Power Distribution */}
                <Card className="glass border-[#14B871]/10">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold text-[#e8f5ee]">Shot Power Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={powerBuckets}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#14B871" vertical={false} opacity={0.1} />
                                    <XAxis dataKey="range" stroke="#9cb8a9" fontSize={10} />
                                    <YAxis stroke="#9cb8a9" fontSize={10} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#050F0C", border: "1px solid #14B87140", borderRadius: "8px" }}
                                        itemStyle={{ color: "#14B871" }}
                                    />
                                    <Bar dataKey="count" fill="#14B871" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Shot Locations (Scatter Plot) */}
                <Card className="glass border-[#14B871]/10">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold text-[#e8f5ee]">Shot Origins Map</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] relative">
                            {/* Field Representation */}
                            <div className="absolute inset-0 border border-[#14B87120] rounded-md opacity-20 pointer-events-none" />
                            <div className="absolute left-[50%] top-0 bottom-0 border-l border-[#14B87120] opacity-20 pointer-events-none" />

                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <XAxis type="number" dataKey="x_origin" domain={[-52.5, 52.5]} hide />
                                    <YAxis type="number" dataKey="y_origin" domain={[-34, 34]} hide />
                                    <ZAxis type="number" range={[50, 400]} />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload as ShotEvent
                                                return (
                                                    <div className="glass p-3 border border-[#14B87140] rounded-lg">
                                                        <p className="text-xs font-bold text-[#e8f5ee]">Player {data.track_id}</p>
                                                        <p className="text-[10px] text-[#9cb8a9]">Power: {data.power_ms.toFixed(1)} m/s</p>
                                                        <p className="text-[10px] text-[#9cb8a9]">Dist: {data.distance_m.toFixed(1)} m</p>
                                                        <p className={`text-[10px] font-bold mt-1 ${data.is_goal ? 'text-[#14B871]' : data.is_on_target ? 'text-blue-400' : 'text-red-400'}`}>
                                                            {data.is_goal ? 'GOAL!' : data.is_on_target ? 'On Target' : 'Off Target'}
                                                        </p>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Scatter name="Shots" data={shotEvents}>
                                        {shotEvents.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.is_goal ? '#14B871' : entry.is_on_target ? '#3b82f6' : '#ef4444'}
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 mt-2 text-[10px]">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#14B871]" /> Goal</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#3b82f6]" /> On Target</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ef4444]" /> Off Target</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
