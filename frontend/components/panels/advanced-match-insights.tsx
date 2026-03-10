"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, ResponsiveContainer
} from "recharts"
import { useEffect, useState } from "react"

type Ranking = { name: string; rating: number }
type TeamStat = { label: string; value: number }
type SpeedPoint = { minute: number; speed: number }

const FALLBACK_RANKINGS: Ranking[] = [
  { name: "L. Martinez", rating: 8.9 },
  { name: "A. Torres", rating: 8.5 },
  { name: "K. Silva", rating: 8.1 },
  { name: "M. Cruz", rating: 7.8 },
]

const FALLBACK_TEAM_STATS: TeamStat[] = [
  { label: "Tracked Players", value: 0 },
  { label: "Avg Speed (km/h)", value: 0 },
  { label: "Peak Speed (km/h)", value: 0 },
  { label: "Total Distance (km)", value: 0 },
]

const FALLBACK_SPEED: SpeedPoint[] = [
  { minute: 0, speed: 0 },
]

export function AdvancedMatchInsights() {
  const [playerRankings, setPlayerRankings] = useState<Ranking[]>(FALLBACK_RANKINGS)
  const [teamStats, setTeamStats] = useState<TeamStat[]>(FALLBACK_TEAM_STATS)
  const [speedTimeline, setSpeedTimeline] = useState<SpeedPoint[]>(FALLBACK_SPEED)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/match-insights")
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data.playerRankings) && data.playerRankings.length > 0) {
          setPlayerRankings(data.playerRankings)
        }
        if (Array.isArray(data.teamStats) && data.teamStats.length > 0) {
          setTeamStats(data.teamStats)
        }
        if (Array.isArray(data.speedTimeline) && data.speedTimeline.length > 0) {
          setSpeedTimeline(data.speedTimeline)
        }
      } catch {
        // Keep fallback values
      }
    }
    load()
  }, [])

  return (
    <div className="flex flex-col gap-10 animate-fade-in">

      {/* ================= PLAYER RANKINGS ================= */}
      <div>
        <h2 className="text-xl font-bold text-[#e8f5ee]">Real-Time Player Rankings</h2>
        <div className="glass-card p-6 rounded-2xl mt-4 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={playerRankings} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f3d33" />
              <XAxis type="number" domain={[0, 10]} stroke="#9cb8a9" />
              <YAxis dataKey="name" type="category" stroke="#9cb8a9" />
              <Tooltip />
              <Bar dataKey="rating" fill="#14B871" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================= STAT SUMMARY ================= */}
      <div>
        <h2 className="text-xl font-bold text-[#e8f5ee]">Match Statistical Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {teamStats.map((stat) => (
            <div key={stat.label} className="glass-card p-4 rounded-xl text-center">
              <p className="text-sm text-[#9cb8a9]">{stat.label}</p>
              <p className="text-2xl font-bold text-[#14B871] mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ================= SPEED GRAPH ================= */}
      <div>
        <h2 className="text-xl font-bold text-[#e8f5ee]">Speed Timeline (Filtered View)</h2>
        <div className="glass-card p-6 rounded-2xl mt-4 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={speedTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f3d33" />
              <XAxis dataKey="minute" stroke="#9cb8a9" />
              <YAxis stroke="#9cb8a9" />
              <Tooltip />
              <Line type="monotone" dataKey="speed" stroke="#14B871" strokeWidth={3} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}
