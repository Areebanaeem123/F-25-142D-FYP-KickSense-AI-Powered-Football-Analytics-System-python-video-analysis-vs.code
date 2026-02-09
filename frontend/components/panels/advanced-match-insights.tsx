"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell,
  ScatterChart, Scatter
} from "recharts"

export function AdvancedMatchInsights() {
  // ---------------- PLAYER RANKINGS ----------------
  const playerRankings = [
    { name: "L. Martinez", rating: 8.9 },
    { name: "A. Torres", rating: 8.5 },
    { name: "K. Silva", rating: 8.1 },
    { name: "M. Cruz", rating: 7.8 },
    { name: "R. Fernandez", rating: 7.5 },
    { name: "R. Fernandez", rating: 7.5 },
    { name: "R. Fernandez", rating: 7.5 },
    { name: "R. Fernandez", rating: 7.5 },
    { name: "R. Fernandez", rating: 7.5 },
    { name: "R. Fernandez", rating: 7.5 },
    
  ]

  // ---------------- STATISTICAL SUMMARY ----------------
  const teamStats = [
    { label: "Possession %", value: 58 },
    { label: "Pass Accuracy %", value: 86 },
    { label: "Shots on Target", value: 9 },
    { label: "Total Distance (km)", value: 112 },
  ]

  // ---------------- HEATMAP DATA (zones) ----------------
  const heatZones = [
    { x: 20, y: 40, intensity: 80 },
    { x: 50, y: 60, intensity: 65 },
    { x: 70, y: 30, intensity: 90 },
    { x: 35, y: 75, intensity: 55 },
    { x: 60, y: 50, intensity: 72 },
  ]

  // ---------------- PASSING NETWORK ----------------
  const passes = [
    { x: 10, y: 40 }, { x: 30, y: 60 }, { x: 50, y: 45 },
    { x: 65, y: 30 }, { x: 75, y: 50 }
  ]

  // ---------------- SPEED GRAPH ----------------
  const speedTimeline = [
    { minute: 0, speed: 12 },
    { minute: 15, speed: 24 },
    { minute: 30, speed: 28 },
    { minute: 45, speed: 22 },
    { minute: 60, speed: 30 },
    { minute: 75, speed: 26 },
    { minute: 90, speed: 18 },
  ]

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

      {/* ================= MOVEMENT HEATMAP ================= */}
      <div>
        <h2 className="text-xl font-bold text-[#e8f5ee]">Movement Heatmap</h2>
        <div className="relative glass-card mt-4 rounded-2xl p-6 h-[300px] bg-[#0d4a35]">
          {heatZones.map((zone, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.intensity / 2}px`,
                height: `${zone.intensity / 2}px`,
                backgroundColor: `rgba(255,0,0,${zone.intensity / 100})`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
      </div>

      {/* ================= PASSING NETWORK ================= */}
      <div>
        <h2 className="text-xl font-bold text-[#e8f5ee]">Passing Network</h2>
        <div className="glass-card p-6 rounded-2xl mt-4 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid stroke="#1f3d33" />
              <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
              <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={passes} fill="#14B871" />
            </ScatterChart>
          </ResponsiveContainer>
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
