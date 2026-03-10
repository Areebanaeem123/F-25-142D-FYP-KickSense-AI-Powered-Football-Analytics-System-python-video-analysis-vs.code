"use client"

import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts"

export function TeamCohesion() {
  const cohesionMetrics = {
    cohesionIndex: 78,
    avgSpacing: "13.6 m",
    passingNetworkDensity: "0.68",
    compactnessScore: "72%",
  }

  const cohesionTrend = [
    { minute: 0, cohesion: 65 },
    { minute: 15, cohesion: 70 },
    { minute: 30, cohesion: 74 },
    { minute: 45, cohesion: 69 },
    { minute: 60, cohesion: 75 },
    { minute: 75, cohesion: 80 },
    { minute: 90, cohesion: 78 },
  ]

  const getCohesionColor = (value: number) => {
    if (value > 75) return "text-green-400"
    if (value > 60) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e8f5ee]">Team Cohesion Analysis</h1>
        <p className="mt-1 text-sm text-[#9cb8a9]">
          Tactical synchronization and inter-player coordination metrics
        </p>
      </div>

      {/* Cohesion Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Cohesion Index" value={`${cohesionMetrics.cohesionIndex}%`} highlight />
        <Metric label="Avg Inter-Player Spacing" value={cohesionMetrics.avgSpacing} />
        <Metric label="Passing Network Density" value={cohesionMetrics.passingNetworkDensity} />
        <Metric label="Compactness Score" value={cohesionMetrics.compactnessScore} />
      </div>

      {/* Cohesion Trend Chart */}
      <div className="glass-card rounded-2xl p-6 h-[350px]">
        <h3 className="text-sm font-semibold text-[#e8f5ee] mb-4">Cohesion Trend Over Match Time</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cohesionTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f3d33" />
            <XAxis dataKey="minute" stroke="#9cb8a9" label={{ value: "Match Minute", position: "insideBottomRight", offset: -5 }} />
            <YAxis stroke="#9cb8a9" domain={[50, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="cohesion" stroke="#14B871" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Explanation Panel */}
      <div className="glass-card rounded-2xl p-6 text-sm text-[#9cb8a9] leading-relaxed">
        <p>
          <span className="text-[#e8f5ee] font-semibold">Cohesion Index</span> reflects how
          synchronized player movements and spacing are across the team. Higher values
          indicate better tactical unity and coordinated positioning.
        </p>
        <p className="mt-2">
          <span className="text-[#e8f5ee] font-semibold">Passing Network Density</span> measures
          how interconnected players are through passes, indicating teamwork fluidity.
        </p>
        <p className="mt-2">
          <span className="text-[#e8f5ee] font-semibold">Compactness Score</span> represents how
          well the team maintains optimal spacing between defensive and attacking lines.
        </p>
      </div>
    </div>
  )
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-xs text-[#9cb8a9]">{label}</p>
      <p className={`text-lg font-semibold mt-1 ${highlight ? "text-[#14B871]" : "text-[#e8f5ee]"}`}>
        {value}
      </p>
    </div>
  )
}
