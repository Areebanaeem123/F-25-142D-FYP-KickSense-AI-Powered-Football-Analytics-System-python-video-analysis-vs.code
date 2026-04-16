"use client"

import { useState, useEffect } from "react"
import {
  BarChart, Bar, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PassEvent {
  pass_id: number
  passer_id: number
  receiver_id: number | null
  passer_team: number
  receiver_team: number | null
  frame_idx: number
  distance_m: number
  is_completed: boolean
  is_progressive: boolean
  x_origin: number
  y_origin: number
  x_target: number | null
  y_target: number | null
}

interface PlayerPassingStats {
  track_id: number
  team_id: number
  passes_attempted: number
  passes_completed: number
  pass_accuracy: number
  avg_pass_distance_m: number
  progressive_passes: number
}

interface TeamPassingStats {
  team_id: number
  total_passes: number
  completed_passes: number
  pass_accuracy: number
  total_pass_distance_m: number
  progressive_passes: number
  avg_pass_distance_m: number
}

interface PossessionStats {
  team_id: number
  possession_percentage: number
  possession_frames: number
}

export function PassingStats() {
  const [passEvents, setPassEvents] = useState<PassEvent[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerPassingStats[]>([])
  const [teamStats, setTeamStats] = useState<TeamPassingStats[]>([])
  const [possessionStats, setPossessionStats] = useState<PossessionStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPassingStats = async () => {
      try {
        const res = await fetch("/api/passing-stats")
        if (res.ok) {
          const data = await res.json()
          setPassEvents(data.pass_events || [])
          setPlayerStats(data.player_passing_stats || [])
          setTeamStats(data.team_passing_stats || [])
          setPossessionStats(data.possession_stats || [])
        }
      } catch (err) {
        console.error("Error fetching passing stats:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPassingStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg text-muted-foreground">Loading passing analytics...</p>
      </div>
    )
  }

  // ---- Derived values ----
  const totalPasses = teamStats.reduce((s, t) => s + t.total_passes, 0)
  const totalCompleted = teamStats.reduce((s, t) => s + t.completed_passes, 0)
  const globalAccuracy = totalPasses > 0 ? (totalCompleted / totalPasses) * 100 : 0
  const totalProgressive = teamStats.reduce((s, t) => s + t.progressive_passes, 0)
  const avgDistance = totalPasses > 0
    ? teamStats.reduce((s, t) => s + t.total_pass_distance_m, 0) / totalPasses
    : 0

  // Team comparison bar chart data
  const comparisonData = teamStats.map((t) => ({
    name: `Team ${String.fromCharCode(65 + t.team_id)}`,
    Attempted: t.total_passes,
    Completed: t.completed_passes,
  }))

  // Pie chart: completed vs incomplete (Team A = team_id 0)
  const teamA = teamStats.find((t) => t.team_id === 0)
  const pieData = teamA
    ? [
      { name: "Completed", value: teamA.completed_passes, fill: "#006747" },
      { name: "Incomplete", value: teamA.total_passes - teamA.completed_passes, fill: "#ef4444" },
    ]
    : []

  // Pass origins scatter data
  const scatterCompleted = passEvents
    .filter((e) => e.is_completed && e.x_origin != null)
    .map((e) => ({ x: e.x_origin, y: e.y_origin }))

  const scatterIncomplete = passEvents
    .filter((e) => !e.is_completed && e.x_origin != null)
    .map((e) => ({ x: e.x_origin, y: e.y_origin }))

  const getAccuracyColor = (acc: number) =>
    acc >= 80 ? "text-white" : acc >= 65 ? "text-yellow-400" : "text-red-400"

  const getAccuracyBg = (acc: number) =>
    acc >= 80 ? "bg-[#006747]" : acc >= 65 ? "bg-yellow-600/20" : "bg-red-600/20"

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter">Passing Intelligence</h1>
          <p className="mt-2 text-base text-white/40 font-bold tracking-widest leading-none">
            Accuracy, distance and progression metrics
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2">
          <p className="text-sm font-black text-white/30 tracking-widest">Global Accuracy</p>
          <p className="text-2xl font-black text-[#006747]">{globalAccuracy.toFixed(1)}%</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Passes", value: totalPasses, unit: "" },
          { label: "Completion %", value: globalAccuracy.toFixed(1), unit: "%" },
          { label: "Progressive Passes", value: totalProgressive, unit: "" },
          { label: "Avg Distance", value: avgDistance.toFixed(1), unit: "m" },
        ].map(({ label, value, unit }) => (
          <Card key={label} className="glass-card p-5 border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#006747]/10 rounded-full -mr-12 -mt-12 blur-3xl group-hover:bg-[#006747]/20 transition-all duration-500" />
            <p className="text-sm font-black text-white/30 tracking-widest mb-2">{label}</p>
            <p className="text-3xl font-black text-white">
              {value}<span className="text-base font-bold text-white/30 ml-0.5">{unit}</span>
            </p>
          </Card>
        ))}
      </div>

      {/* Team Overview + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team stats cards */}
        <div className="space-y-4">
          <h2 className="text-base font-black text-white/40 tracking-[0.2em] ml-1">Team Overview</h2>
          {teamStats.map((t) => {
            const possession = possessionStats.find((p) => p.team_id === t.team_id)
            return (
              <Card key={t.team_id} className="glass-card p-6 border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#006747]/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#006747]/20 transition-all duration-500" />
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <h3 className="text-2xl font-black text-white tracking-tighter">
                    Team {String.fromCharCode(65 + t.team_id)}
                  </h3>
                  <div className="flex gap-2">
                    <Badge className={`${getAccuracyBg(t.pass_accuracy)} ${getAccuracyColor(t.pass_accuracy)} border-none px-4 py-1.5 rounded-xl font-black text-base shadow-xl`}>
                      {t.pass_accuracy.toFixed(1)}% Acc
                    </Badge>
                    {possession && (
                      <Badge className="bg-blue-600/20 text-blue-400 border-none px-4 py-1.5 rounded-xl font-black text-base shadow-xl">
                        {possession.possession_percentage.toFixed(1)}% Pos
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-white/30 text-sm font-black tracking-widest mb-1">Passes</p>
                    <p className="text-white text-3xl font-black">{t.total_passes}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-white/30 text-sm font-black tracking-widest mb-1">Accurate</p>
                    <p className="text-[#006747] text-3xl font-black">{t.completed_passes}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-white/30 text-sm font-black tracking-widest mb-1">Progressive</p>
                    <p className="text-white text-3xl font-black">{t.progressive_passes}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-white/30 text-sm font-black tracking-widest mb-1">Control</p>
                    <p className="text-blue-400 text-3xl font-black">{possession ? `${possession.possession_percentage.toFixed(0)}%` : "N/A"}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Completion pie (Team A) */}
        <Card className="glass-card p-6 border-white/5 flex flex-col">
          <h3 className="text-base font-black text-white tracking-widest mb-6">
            Pass Outcomes (Team A)
          </h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#000000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Team Comparison Bar + Pass Origins Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card p-6 border-white/5">
          <h3 className="text-base font-black text-white tracking-widest mb-6">Team Comparison</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="white" vertical={false} opacity={0.05} />
                <XAxis dataKey="name" stroke="white" opacity={0.4} fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="white" opacity={0.4} fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#000000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Attempted" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Completed" fill="#006747" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pass origins scatter map */}
        <Card className="glass-card p-6 border-white/5">
          <h3 className="text-base font-black text-white tracking-widest mb-2">Pass Origins</h3>
          <p className="text-xs text-white/30 font-bold tracking-widest mb-4">
            <span className="text-[#006747]">■</span> Completed &nbsp;
            <span className="text-[#ef4444]">■</span> Incomplete
          </p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="white" opacity={0.05} />
                <XAxis dataKey="x" name="X (m)" type="number" domain={[-55, 55]}
                  stroke="white" opacity={0.4} fontSize={11} axisLine={false} tickLine={false} />
                <YAxis dataKey="y" name="Y (m)" type="number" domain={[-35, 35]}
                  stroke="white" opacity={0.4} fontSize={11} axisLine={false} tickLine={false} />
                <ZAxis range={[30, 30]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#000000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  cursor={{ strokeDasharray: "3 3" }}
                />
                <Scatter name="Completed" data={scatterCompleted} fill="#006747" opacity={0.8} />
                <Scatter name="Incomplete" data={scatterIncomplete} fill="#ef4444" opacity={0.8} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Player breakdown table */}
      <Card className="glass-card rounded-3xl overflow-hidden border-white/5">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-base font-black text-white tracking-widest">Player Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-6 py-4 text-left   text-sm font-black text-white/30 tracking-widest">Player</th>
                <th className="px-6 py-4 text-center text-sm font-black text-white/30 tracking-widest">Attempts</th>
                <th className="px-6 py-4 text-center text-sm font-black text-white/30 tracking-widest">Completed</th>
                <th className="px-6 py-4 text-center text-sm font-black text-white/30 tracking-widest">Accuracy</th>
                <th className="px-6 py-4 text-center text-sm font-black text-white/30 tracking-widest">Avg Dist</th>
                <th className="px-6 py-4 text-center text-sm font-black text-white/30 tracking-widest">Progressive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {playerStats.map((p) => (
                <tr key={p.track_id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-sm text-white group-hover:bg-[#006747] transition-colors">
                        {p.track_id}
                      </div>
                      <span className="font-bold text-white tracking-tight">Player {p.track_id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-white/60 font-mono italic">{p.passes_attempted}</td>
                  <td className="px-6 py-4 text-center text-[#006747] font-black">{p.passes_completed}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge className={`${getAccuracyBg(p.pass_accuracy)} ${getAccuracyColor(p.pass_accuracy)} border-none px-3 py-1 rounded-lg font-black text-sm`}>
                      {p.pass_accuracy.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center text-white font-bold">{p.avg_pass_distance_m.toFixed(1)}m</td>
                  <td className="px-6 py-4 text-center text-white/60 font-mono">{p.progressive_passes}</td>
                </tr>
              ))}
              {playerStats.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/30 font-bold tracking-widest">
                    No passing data available — run the pipeline first
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
