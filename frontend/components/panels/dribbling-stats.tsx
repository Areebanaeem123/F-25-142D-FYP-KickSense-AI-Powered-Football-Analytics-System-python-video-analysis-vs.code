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
    if (rate >= 75) return "text-green-500"
    if (rate >= 70) return "text-emerald-500"
    if (rate >= 65) return "text-yellow-500"
    return "text-red-500"
  }

  const getSuccessBgColor = (rate: number) => {
    if (rate >= 75) return "bg-green-100"
    if (rate >= 70) return "bg-emerald-100"
    if (rate >= 65) return "bg-yellow-100"
    return "bg-red-100"
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-[#e8f5ee]">Dribbling Analytics</h1>
        <p className="mt-2 text-sm text-[#9cb8a9]">
          Comprehensive dribbling effectiveness metrics for both teams
        </p>
      </div>

      {/* Team Comparison Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Stats Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#e8f5ee]">Team Overview</h2>
          {[0, 1].map((teamId) => {
            const stats = teamStats[teamId]
            if (!stats) {
              return (
                <Card key={teamId} className="glass-card p-5 border-[#14B871]/20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-[#e8f5ee]">Team {String.fromCharCode(65 + teamId)}</h3>
                    <Badge className="bg-gray-200 text-gray-600">No Data</Badge>
                  </div>
                  <p className="text-xs text-[#9cb8a9]">No dribbling data available for this team</p>
                </Card>
              )
            }
            return (
              <Card key={teamId} className="glass-card p-5 border-[#14B871]/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-[#e8f5ee]">Team {String.fromCharCode(65 + teamId)}</h3>
                  <Badge className={`${getSuccessBgColor(stats.success_rate)} text-[#14B871]`}>
                    {stats.success_rate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-[#0D3B2B]/40 rounded-lg p-3">
                    <p className="text-[#9cb8a9] text-xs mb-1">Attempts</p>
                    <p className="text-[#e8f5ee] font-bold">{stats.total_dribbles}</p>
                  </div>
                  <div className="bg-[#0D3B2B]/40 rounded-lg p-3">
                    <p className="text-[#9cb8a9] text-xs mb-1">Successful</p>
                    <p className="text-green-400 font-bold">{stats.successful_dribbles}</p>
                  </div>
                  <div className="bg-[#0D3B2B]/40 rounded-lg p-3">
                    <p className="text-[#9cb8a9] text-xs mb-1">Distance</p>
                    <p className="text-[#e8f5ee] font-bold">{(stats.total_distance_m / 1000).toFixed(1)}km</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#14B871]/10">
                  <p className="text-xs text-[#9cb8a9]">
                    Progressive: <span className="text-[#14B871] font-semibold">{stats.progressive_dribbles}</span>
                  </p>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Success Rate Pie Chart */}
        <Card className="glass-card p-5 border-[#14B871]/20">
          <h3 className="text-lg font-semibold text-[#e8f5ee] mb-4">Team A - Success Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={successRateData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {successRateData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Comparison Chart */}
      <Card className="glass-card p-5 border-[#14B871]/20">
        <h3 className="text-lg font-semibold text-[#e8f5ee] mb-4">Team Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#14B871/20" />
            <XAxis dataKey="name" stroke="#9cb8a9" />
            <YAxis stroke="#9cb8a9" />
            <Tooltip
              contentStyle={{ backgroundColor: "#0D3B2B", border: "1px solid #14B871" }}
              labelStyle={{ color: "#e8f5ee" }}
            />
            <Legend />
            <Bar dataKey="attempts" fill="#60A5FA" name="Attempts" radius={[8, 8, 0, 0]} />
            <Bar dataKey="successful" fill="#14B871" name="Successful" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Dribblers */}
      <Card className="glass-card p-5 border-[#14B871]/20">
        <h3 className="text-lg font-semibold text-[#e8f5ee] mb-4">Top Dribblers (Success Rate)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={topDribblers}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#14B871/20" />
            <XAxis type="number" stroke="#9cb8a9" />
            <YAxis dataKey="name" type="category" stroke="#9cb8a9" width={140} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0D3B2B", border: "1px solid #14B871" }}
              labelStyle={{ color: "#e8f5ee" }}
            />
            <Bar dataKey="success_rate" fill="#14B871" name="Success Rate %" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Player Radar Comparison */}
      <Card className="glass-card p-5 border-[#14B871]/20">
        <h3 className="text-lg font-semibold text-[#e8f5ee] mb-4">Player Performance Radar</h3>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={playerPerformanceRadar}>
            <PolarGrid stroke="#14B871/30" />
            <PolarAngleAxis dataKey="name" stroke="#9cb8a9" />
            <PolarRadiusAxis stroke="#9cb8a9" />
            <Radar name="Success %" dataKey="Success %" stroke="#14B871" fill="#14B871" fillOpacity={0.3} />
            <Radar name="Distance" dataKey="Distance" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.2} />
            <Radar name="Progressive" dataKey="Progressive" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />
            <Radar name="Opp. Beaten" dataKey="Opp. Beaten" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} />
            <Legend />
            <Tooltip
              contentStyle={{ backgroundColor: "#0D3B2B", border: "1px solid #14B871" }}
              labelStyle={{ color: "#e8f5ee" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Card>

      {/* Detailed Player Stats Table */}
      <Card className="glass-card rounded-2xl overflow-hidden border-[#14B871]/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#14B871]/10 bg-[#0D3B2B]/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9cb8a9] uppercase">Player</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#9cb8a9] uppercase">Attempts</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#9cb8a9] uppercase">Success Rate</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#9cb8a9] uppercase">Distance</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#9cb8a9] uppercase">Progressive</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#9cb8a9] uppercase">Opp. Beaten</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14B871]/10">
              {playerStats.map((player) => (
                <tr key={player.player_id} className="hover:bg-[#0D3B2B]/30 transition-colors">
                  <td className="px-4 py-4 text-[#e8f5ee] font-semibold">
                    Player {player.player_id}
                  </td>
                  <td className="px-4 py-4 text-center text-[#e8f5ee]">
                    {player.total_dribbles}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Badge className={`${getSuccessBgColor(player.success_rate)} ${getSuccessColor(player.success_rate)}`}>
                      {player.success_rate.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-center text-[#e8f5ee]">
                    {player.distance_covered_m}m
                  </td>
                  <td className="px-4 py-4 text-center text-[#14B871] font-semibold">
                    {player.progressive_dribbles}
                  </td>
                  <td className="px-4 py-4 text-center text-[#e8f5ee]">
                    {player.opponents_beaten}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {teamStats[0] && (
          <Card className="glass-card p-4 border-[#14B871]/20">
            <p className="text-xs text-[#9cb8a9] mb-2">Team A Avg Success</p>
            <p className="text-2xl font-bold text-[#14B871]">{teamStats[0].success_rate.toFixed(1)}%</p>
          </Card>
        )}
        {teamStats[1] && (
          <Card className="glass-card p-4 border-[#14B871]/20">
            <p className="text-xs text-[#9cb8a9] mb-2">Team B Avg Success</p>
            <p className="text-2xl font-bold text-[#14B871]">{teamStats[1].success_rate.toFixed(1)}%</p>
          </Card>
        )}
        {playerStats.length > 0 && (
          <Card className="glass-card p-4 border-[#14B871]/20">
            <p className="text-xs text-[#9cb8a9] mb-2">Most Dribbles (Team A)</p>
            <p className="text-2xl font-bold text-[#60A5FA]">
              {playerStats.filter(p => p.team_id === 0).length > 0 
                ? Math.max(...playerStats.filter(p => p.team_id === 0).map(p => p.total_dribbles))
                : 0
              }
            </p>
          </Card>
        )}
        {(teamStats[0] || teamStats[1]) && (
          <Card className="glass-card p-4 border-[#14B871]/20">
            <p className="text-xs text-[#9cb8a9] mb-2">Combined Dribbles</p>
            <p className="text-2xl font-bold text-[#F59E0B]">
              {(teamStats[0]?.total_dribbles || 0) + (teamStats[1]?.total_dribbles || 0)}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
