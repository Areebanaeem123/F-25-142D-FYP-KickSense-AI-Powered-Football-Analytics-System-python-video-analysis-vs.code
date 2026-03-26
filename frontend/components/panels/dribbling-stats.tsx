"use client"

import { useState, useEffect } from "react"
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PlayerDribblingStats {
  player_id: number
  team_id: number
  total_dribbles: number
  successful_dribbles: number
  success_rate: number
  distance_covered_m: number
  progressive_dribbles: number
  avg_dribble_distance_m: number
  avg_dribble_duration_s: number
  opponents_beaten: number
}

interface TeamDribblingStats {
  total_dribbles: number
  successful_dribbles: number
  success_rate: number
  total_distance_m: number
  progressive_dribbles: number
  avg_dribble_distance_m: number
}

export function DribblingStats() {
  const [teamStats, setTeamStats] = useState<Record<number, TeamDribblingStats>>({})
  const [playerStats, setPlayerStats] = useState<PlayerDribblingStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDribblingStats = async () => {
      try {
        const response = await fetch("/api/dribbling-stats")
        if (response.ok) {
          const data = await response.json()
          // Convert player_dribbling_stats object to array
          const playerStatsArray = Object.values(data.player_dribbling_stats || {})
          setPlayerStats(playerStatsArray as PlayerDribblingStats[])
          setTeamStats(data.team_dribbling_stats || {})
        }
      } catch (error) {
        console.error("Error fetching dribbling stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDribblingStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg text-muted-foreground">Loading dribbling analytics...</p>
      </div>
    )
  }

  const successRateData = teamStats[0] ? [
    { name: "Successful", value: teamStats[0].successful_dribbles, fill: "#14B871" },
    { name: "Unsuccessful", value: teamStats[0].total_dribbles - teamStats[0].successful_dribbles, fill: "#EF4444" },
  ] : []

  const comparisonData = []
  if (teamStats[0]) {
    comparisonData.push({
      name: "Team A",
      attempts: teamStats[0].total_dribbles,
      successful: teamStats[0].successful_dribbles,
      success_rate: teamStats[0].success_rate,
    })
  }
  if (teamStats[1]) {
    comparisonData.push({
      name: "Team B",
      attempts: teamStats[1].total_dribbles,
      successful: teamStats[1].successful_dribbles,
      success_rate: teamStats[1].success_rate,
    })
  }

  const topDribblers = playerStats.slice(0, 5).map(p => ({
    name: `Player ${p.player_id}`,
    success_rate: p.success_rate,
    attempts: p.total_dribbles,
  }))

  const playerPerformanceRadar = playerStats.slice(0, 5).map(p => ({
    name: `P${p.player_id}`,
    "Success %": p.success_rate,
    "Distance": Math.min(p.distance_covered_m / 20 * 100, 100),
    "Progressive": Math.min(p.progressive_dribbles * 8, 100),
    "Opp. Beaten": Math.min(p.opponents_beaten * 10, 100),
  }))

  const getSuccessColor = (rate: number) => {
    if (rate >= 75) return "text-white"
    if (rate >= 70) return "text-white/80"
    if (rate >= 65) return "text-yellow-500"
    return "text-red-500"
  }

  const getSuccessBgColor = (rate: number) => {
    if (rate >= 70) return "bg-[#006747]"
    if (rate >= 65) return "bg-yellow-600/20"
    return "bg-red-600/20"
  }

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Dribbling Intelligence</h1>
          <p className="mt-2 text-sm text-white/40 font-bold uppercase tracking-widest leading-none">
            Comprehensive effectiveness metrics
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Global Success</p>
            <p className="text-xl font-black text-[#006747]">
              {teamStats[0] ? ((teamStats[0].success_rate + (teamStats[1]?.success_rate || 0)) / (teamStats[1] ? 2 : 1)).toFixed(1) : "0.0"}%
            </p>
          </div>
        </div>
      </div>

      {/* Team Comparison Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Stats Cards */}
        <div className="space-y-4">
          <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] ml-1">Squad Overview</h2>
          {[0, 1].map((teamId) => {
            const stats = teamStats[teamId]
            if (!stats) return null;
            return (
              <Card key={teamId} className="glass-card p-6 border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#006747]/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#006747]/20 transition-all duration-500" />
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Team {String.fromCharCode(65 + teamId)}</h3>
                  <Badge className={`${getSuccessBgColor(stats.success_rate)} ${getSuccessColor(stats.success_rate)} border-none px-4 py-1.5 rounded-xl font-black text-sm shadow-xl`}>
                    {stats.success_rate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm relative z-10">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Attempts</p>
                    <p className="text-white text-2xl font-black">{stats.total_dribbles}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Success</p>
                    <p className="text-[#006747] text-2xl font-black">{stats.successful_dribbles}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Distance</p>
                    <p className="text-white text-2xl font-black">{(stats.total_distance_m / 1000).toFixed(1)}<span className="text-sm font-bold text-white/30 ml-0.5">km</span></p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Success Rate Pie Chart */}
        <Card className="glass-card p-6 border-white/5 flex flex-col">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">Success Distribution (Team A)</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={successRateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {successRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill === "#14B871" ? "#006747" : "#ef4444"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#000000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card p-6 border-white/5">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">Team Comparison</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="white" vertical={false} opacity={0.05} />
                <XAxis dataKey="name" stroke="white" opacity={0.4} fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="white" opacity={0.4} fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#000000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="attempts" fill="#3b82f6" name="Attempts" radius={[6, 6, 0, 0]} />
                <Bar dataKey="successful" fill="#006747" name="Successful" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-card p-6 border-white/5">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">Top Dribblers %</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDribblers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="white" horizontal={false} opacity={0.05} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="white" opacity={0.6} fontSize={10} width={80} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#000000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                />
                <Bar dataKey="success_rate" fill="#006747" name="Success %" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Detailed Player Stats Table */}
      <Card className="glass-card rounded-3xl overflow-hidden border-white/5">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xs font-black text-white uppercase tracking-widest">Player Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-6 py-4 text-left text-[10px] font-black text-white/30 uppercase tracking-widest">Player</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">Attempts</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">Success</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">Distance</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-white/30 uppercase tracking-widest">Bypassed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {playerStats.map((player) => (
                <tr key={player.player_id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-xs text-white group-hover:bg-[#006747] transition-colors">
                        {player.player_id}
                      </div>
                      <span className="font-bold text-white tracking-tight">Player {player.player_id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-white/60 font-mono italic">
                    {player.total_dribbles}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge className={`${getSuccessBgColor(player.success_rate)} ${getSuccessColor(player.success_rate)} border-none px-3 py-1 rounded-lg font-black text-[10px]`}>
                      {player.success_rate.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center text-white font-bold">
                    {player.distance_covered_m}m
                  </td>
                  <td className="px-6 py-4 text-center text-[#006747] font-black">
                    {player.opponents_beaten}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
