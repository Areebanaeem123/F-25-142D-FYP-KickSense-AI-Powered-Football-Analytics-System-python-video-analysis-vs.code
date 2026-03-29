"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  RadarChart,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlayerShotChart } from "./panels/player-shot-chart"

interface PlayerStat {
  Track_ID: number
  Class: string
  Max_Speed_kmh: number
  Avg_Speed_kmh: number
  Total_Distance_m: number
  Foul_Risk?: number
  Yellow_Likelihood?: number
  Red_Likelihood?: number
  Card_Prediction?: string
  Contact_Events?: number
  Shots_Total?: number
  Shots_On_Target?: number
  Goals?: number
  Shot_Accuracy?: number
  Avg_Shot_Distance_m?: number
  Max_Shot_Power_ms?: number
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#14b8a6",
  "#f97316",
  "#6366f1",
]

export function IndividualPlayerStats() {
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  const normalizeStats = (data: PlayerStat[]) => {
    const cleaned = (data || [])
      .map((p) => ({
        Track_ID: Number((p as PlayerStat).Track_ID),
        Class: String((p as PlayerStat).Class),
        Max_Speed_kmh: Number((p as PlayerStat).Max_Speed_kmh),
        Avg_Speed_kmh: Number((p as PlayerStat).Avg_Speed_kmh),
        Total_Distance_m: Number((p as PlayerStat).Total_Distance_m),
        Foul_Risk: Number.isFinite((p as PlayerStat).Foul_Risk)
          ? Number((p as PlayerStat).Foul_Risk)
          : undefined,
        Yellow_Likelihood: Number.isFinite((p as PlayerStat).Yellow_Likelihood)
          ? Number((p as PlayerStat).Yellow_Likelihood)
          : undefined,
        Red_Likelihood: Number.isFinite((p as PlayerStat).Red_Likelihood)
          ? Number((p as PlayerStat).Red_Likelihood)
          : undefined,
        Card_Prediction:
          typeof (p as PlayerStat).Card_Prediction === "string"
            ? String((p as PlayerStat).Card_Prediction)
            : undefined,
        Contact_Events: Number.isFinite((p as PlayerStat).Contact_Events)
          ? Number((p as PlayerStat).Contact_Events)
          : undefined,
        Shots_Total: Number((p as PlayerStat).Shots_Total) || 0,
        Shots_On_Target: Number((p as PlayerStat).Shots_On_Target) || 0,
        Goals: Number((p as PlayerStat).Goals) || 0,
        Shot_Accuracy: Number((p as PlayerStat).Shot_Accuracy) || 0,
        Avg_Shot_Distance_m: Number((p as PlayerStat).Avg_Shot_Distance_m) || 0,
        Max_Shot_Power_ms: Number((p as PlayerStat).Max_Shot_Power_ms) || 0,
      }))
      .filter(
        (p) =>
          Number.isFinite(p.Track_ID) &&
          Number.isFinite(p.Max_Speed_kmh) &&
          Number.isFinite(p.Avg_Speed_kmh) &&
          Number.isFinite(p.Total_Distance_m) &&
          (p.Class === "Player" || p.Class === "Goalkeeper"),
      )

    const top22 = cleaned
      .sort((a, b) => b.Total_Distance_m - a.Total_Distance_m)
      .slice(0, 22)
      .sort((a, b) => a.Track_ID - b.Track_ID)

    return top22
  }

  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        const response = await fetch("/api/player-stats")
        if (response.ok) {
          const data = await response.json()
          setPlayerStats(normalizeStats(data))
        }
      } catch (error) {
        console.error("Error loading player stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-lg text-muted-foreground">Loading player analytics...</p>
      </div>
    )
  }

  const speedComparisonData = playerStats.map((p) => ({
    name: `Player ${p.Track_ID}`,
    maxSpeed: parseFloat(p.Max_Speed_kmh.toFixed(1)),
    avgSpeed: parseFloat(p.Avg_Speed_kmh.toFixed(1)),
  }))

  const performanceRadarData = playerStats.map((p) => ({
    player: `P${p.Track_ID}`,
    maxSpeed: p.Max_Speed_kmh,
    avgSpeed: p.Avg_Speed_kmh,
    distance: (p.Total_Distance_m / 100) * 35,
  }))

  const distanceData = playerStats.map((p) => ({
    name: `Player ${p.Track_ID}`,
    distance: parseFloat(p.Total_Distance_m.toFixed(1)),
  }))

  const selectedPlayerStats = playerStats.find((p) => `player-${p.Track_ID}` === selectedPlayer)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter">Player Performance</h1>
          <p className="text-white/40 text-base font-bold tracking-widest mt-2 leading-none">Speed, distance, and precision intelligence</p>
        </div>
        <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
          <SelectTrigger className="w-[200px] glass">
            <SelectValue placeholder="Select player" />
          </SelectTrigger>
          <SelectContent className="glass">
            <SelectItem value="all">All Players</SelectItem>
            {playerStats.map((p) => (
              <SelectItem key={p.Track_ID} value={`player-${p.Track_ID}`}>
                Player {p.Track_ID}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPlayer !== "all" && selectedPlayerStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <Card className="glass border-white/5 bg-black/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-white/30 tracking-widest">Max Speed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-white">{selectedPlayerStats.Max_Speed_kmh.toFixed(1)} <span className="text-base font-bold text-white/20">km/h</span></div>
            </CardContent>
          </Card>

          <Card className="glass border-white/5 bg-black/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black text-white/30 tracking-widest">Avg Speed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">{selectedPlayerStats.Avg_Speed_kmh.toFixed(1)} <span className="text-sm font-bold text-white/20">km/h</span></div>
            </CardContent>
          </Card>

          <Card className="glass border-white/5 bg-black/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black text-white/30 tracking-widest">Total Distance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">{selectedPlayerStats.Total_Distance_m.toFixed(1)} <span className="text-sm font-bold text-white/20">m</span></div>
            </CardContent>
          </Card>

          <Card className="glass border-white/5 bg-black/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-white/30 tracking-widest">Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-[#006747]">{selectedPlayerStats.Goals} <span className="text-base font-bold text-white/20">Goals</span></div>
              <p className="text-sm text-white/30 font-bold mt-1 tracking-tighter">
                {selectedPlayerStats.Shots_On_Target} / {selectedPlayerStats.Shots_Total} SOT • {selectedPlayerStats.Shot_Accuracy?.toFixed(0)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass border-white/5">
          <CardHeader className="border-b border-white/5 py-4">
            <CardTitle className="text-base font-black text-white tracking-widest">Velocity Comparison</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={speedComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="white" vertical={false} opacity={0.05} />
                  <XAxis dataKey="name" stroke="white" opacity={0.4} fontSize={12} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                  <YAxis stroke="white" opacity={0.4} fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#000000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="maxSpeed" fill="#006747" name="Max Speed" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="avgSpeed" fill="#3b82f6" name="Avg Speed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader className="border-b border-white/5 py-4">
            <CardTitle className="text-base font-black text-white tracking-widest">Performance Radar</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={performanceRadarData}>
                  <PolarGrid stroke="white" opacity={0.05} />
                  <PolarAngleAxis dataKey="player" tick={{ fill: 'white', opacity: 0.4, fontSize: 12, fontWeight: "bold" }} />
                  <Radar name="Max Speed" dataKey="maxSpeed" stroke="#006747" fill="#006747" fillOpacity={0.4} />
                  <Radar name="Avg Speed" dataKey="avgSpeed" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  <Tooltip contentStyle={{ backgroundColor: "#000000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedPlayer !== "all" && selectedPlayerStats && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="glass border-white/5 border-l-4 border-l-[#006747]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-6">
              <div>
                <CardTitle className="text-2xl font-black text-white tracking-tighter">Advanced Precision Analysis</CardTitle>
                <CardDescription className="text-white/30 text-sm font-bold tracking-widest mt-1">Detailed event breakdown and trajectory intelligence</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <PlayerShotChart playerId={selectedPlayerStats.Track_ID} />
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="glass border-[#14B871]/10">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#e8f5ee]">All Players Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {playerStats.map((p, idx) => (
              <div key={p.Track_ID} className="glass p-4 rounded-xl border border-[#14B871]/10 hover:border-[#14B871]/40 transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold text-[#e8f5ee]">Player {p.Track_ID}</span>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                </div>
                <div className="space-y-1 text-base text-[#9cb8a9]">
                  <div className="flex justify-between"><span>Speed (Max/Avg):</span> <span className="text-[#e8f5ee]">{p.Max_Speed_kmh.toFixed(1)} / {p.Avg_Speed_kmh.toFixed(1)}</span></div>
                  <div className="flex justify-between"><span>Distance:</span> <span className="text-[#e8f5ee]">{p.Total_Distance_m.toFixed(1)} m</span></div>
                  <div className="flex justify-between font-bold text-[#e8f5ee]">
                    <span>Card Risk:</span>
                    <span className={p.Foul_Risk && p.Foul_Risk > 0.5 ? "text-red-400" : "text-[#14B871]"}>
                      {p.Foul_Risk !== undefined ? `${(p.Foul_Risk * 100).toFixed(0)}%` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs italic mb-1">
                    <span>Prediction:</span> <span>{p.Card_Prediction || "None"}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#14B87120] pt-1 font-bold text-[#14B871]">
                    <span>Shooting:</span> <span>{p.Goals}G / {p.Shots_Total}S</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
