"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from "recharts"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useState, useEffect } from "react"

interface TeamDribblingStats {
  total_dribbles: number
  successful_dribbles: number
  success_rate: number
}

interface PlayerDribblingStats {
  player_id: number
  success_rate: number
  total_dribbles: number
}

export function DribblingStatsWidget() {
  const [teamData, setTeamData] = useState<Array<{name: string; success_rate: number; attempts: number; successful: number}>>([])
  const [topDribblers, setTopDribblers] = useState<Array<{name: string; rate: number; attempts: number}>>([])
  const [totalDribbles, setTotalDribbles] = useState(0)
  const [successfulDribbles, setSuccessfulDribbles] = useState(0)
  const [avgSuccess, setAvgSuccess] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDribblingStats = async () => {
      try {
        const response = await fetch("/api/dribbling-stats")
        if (response.ok) {
          const data = await response.json()
          
          // Transform team stats
          const teams = []
          if (data.team_dribbling_stats) {
            for (const [teamId, stats] of Object.entries(data.team_dribbling_stats)) {
              const teamStats = stats as TeamDribblingStats
              teams.push({
                name: `Team ${String.fromCharCode(65 + parseInt(teamId))}`,
                success_rate: teamStats.success_rate || 0,
                attempts: teamStats.total_dribbles || 0,
                successful: teamStats.successful_dribbles || 0,
              })
            }
          }
          setTeamData(teams)
          
          // Transform player stats
          const players: PlayerDribblingStats[] = []
          if (data.player_dribbling_stats) {
            for (const stats of Object.values(data.player_dribbling_stats)) {
              const playerStats = stats as PlayerDribblingStats
              players.push(playerStats)
            }
          }
          
          const topPlayers = players
            .sort((a, b) => b.success_rate - a.success_rate)
            .slice(0, 3)
            .map(p => ({
              name: `Player ${p.player_id}`,
              rate: p.success_rate,
              attempts: p.total_dribbles,
            }))
          setTopDribblers(topPlayers)
          
          // Set summary stats
          const summary = data.summary || {}
          setTotalDribbles(summary.total_dribbles_match || 0)
          setSuccessfulDribbles(summary.total_successful_dribbles || 0)
          setAvgSuccess(summary.match_success_rate || 0)
        }
      } catch (error) {
        console.error("Error fetching dribbling stats:", error)
        // Fall back to empty state
        setTeamData([])
        setTopDribblers([])
      } finally {
        setLoading(false)
      }
    }

    fetchDribblingStats()
  }, [])

  const getColor = (rate: number) => {
    if (rate >= 75) return "#14B871"
    if (rate >= 70) return "#10B981"
    if (rate >= 65) return "#F59E0B"
    return "#EF4444"
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#e8f5ee]">Dribbling Effectiveness</h3>
        </div>
        <Card className="glass-card p-4 border-[#14B871]/20">
          <p className="text-sm text-[#9cb8a9]">Loading...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#e8f5ee]">Dribbling Effectiveness</h3>
        <Link href="/analytics/dribbling" className="text-xs text-[#14B871] hover:text-[#0DC582] transition-colors">
          View Details →
        </Link>
      </div>

      {/* Team Comparison Chart */}
      {teamData.length > 0 && (
        <Card className="glass-card p-4 border-[#14B871]/20">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={teamData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#14B871/20" />
              <XAxis dataKey="name" stroke="#9cb8a9" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9cb8a9" tick={{ fontSize: 12 }} name="Success Rate %" />
              <Tooltip
                contentStyle={{ backgroundColor: "#0D3B2B", border: "1px solid #14B871", borderRadius: "8px" }}
                labelStyle={{ color: "#e8f5ee" }}
                formatter={(value) => `${(value as number).toFixed(1)}%`}
              />
              <Bar dataKey="success_rate" fill="#14B871" radius={[8, 8, 0, 0]}>
                {teamData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.success_rate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card p-3 border-[#14B871]/20">
          <p className="text-xs text-[#9cb8a9]">Total Dribbles</p>
          <p className="text-xl font-bold text-[#e8f5ee]">{totalDribbles}</p>
        </Card>
        <Card className="glass-card p-3 border-[#14B871]/20">
          <p className="text-xs text-[#9cb8a9]">Successful</p>
          <p className="text-xl font-bold text-[#14B871]">{successfulDribbles}</p>
        </Card>
        <Card className="glass-card p-3 border-[#14B871]/20">
          <p className="text-xs text-[#9cb8a9]">Avg Success</p>
          <p className="text-xl font-bold text-[#60A5FA]">{avgSuccess.toFixed(1)}%</p>
        </Card>
      </div>

      {/* Top Dribblers Mini List */}
      {topDribblers.length > 0 && (
        <Card className="glass-card p-4 border-[#14B871]/20">
          <p className="text-sm font-semibold text-[#e8f5ee] mb-3">Top Dribblers</p>
          <div className="space-y-2">
            {topDribblers.map((player, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-[#9cb8a9]">{player.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9cb8a9]">{player.attempts} attempts</span>
                  <Badge className="bg-[#14B871]/20 text-[#14B871] text-xs">
                    {player.rate.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Team Stats Detail */}
      {teamData.length > 0 && (
        <div className="space-y-2">
          {teamData.map((team, idx) => (
            <Card key={idx} className="glass-card p-3 border-[#14B871]/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#e8f5ee]">{team.name}</span>
                <Badge className="bg-[#14B871]/20 text-[#14B871]">{team.success_rate.toFixed(1)}%</Badge>
              </div>
              <div className="w-full bg-[#0D3B2B]/40 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#14B871] to-[#0DC582]"
                  style={{ width: `${team.success_rate}%` }}
                ></div>
              </div>
              <p className="text-xs text-[#9cb8a9] mt-2">
                {team.successful} successful out of {team.attempts} attempts
              </p>
            </Card>
          ))}
        </div>
      )}

      {totalDribbles === 0 && (
        <Card className="glass-card p-4 border-[#14B871]/20">
          <p className="text-sm text-[#9cb8a9]">No dribbling data available yet. Process a video to see statistics.</p>
        </Card>
      )}
    </div>
  )
}
