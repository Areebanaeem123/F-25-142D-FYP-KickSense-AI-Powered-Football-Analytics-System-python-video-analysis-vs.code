"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts"

export function IdealSubstitution() {
  const players = [
    { id: 1, name: "L. Martinez", fatigue: 82, performance: 65, injuryRisk: 15 },
    { id: 2, name: "K. Silva", fatigue: 68, performance: 78, injuryRisk: 5 },
    { id: 3, name: "R. Fernandez", fatigue: 75, performance: 70, injuryRisk: 10 },
    { id: 4, name: "D. Lopez", fatigue: 55, performance: 88, injuryRisk: 2 },
    { id: 5, name: "A. Torres", fatigue: 45, performance: 50, injuryRisk: 20 },
    { id: 6, name: "A. Torres", fatigue: 33, performance: 50, injuryRisk: 20 },
    { id: 7, name: "A. Torres", fatigue: 78, performance: 50, injuryRisk: 20 },
    { id: 8, name: "A. Torres", fatigue: 10, performance: 50, injuryRisk: 20 },
    { id: 9, name: "A. Torres", fatigue: 9, performance: 50, injuryRisk: 20 },
    { id: 10, name: "A. Torres", fatigue: 43, performance: 50, injuryRisk: 20 },
    { id: 11, name: "A. Torres", fatigue: 34, performance: 50, injuryRisk: 20 },

  ]

  const getAlertColor = (fatigue: number, performance: number, injuryRisk: number) => {
    if (fatigue > 85 || performance < 60 || injuryRisk > 15) return "bg-red-600 text-white"
    if (fatigue > 70 || performance < 70 || injuryRisk > 10) return "bg-yellow-500 text-black"
    return "bg-green-600 text-white"
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e8f5ee]">Substitution Recommendations</h1>
        <p className="mt-1 text-sm text-[#9cb8a9]">
          Player fatigue, performance decline, and injury risk indicators for optimal substitutions
        </p>
      </div>

      {/* Player Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#14B871]/10">
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9cb8a9] uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9cb8a9] uppercase tracking-wider">Player</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9cb8a9] uppercase tracking-wider">Fatigue (%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9cb8a9] uppercase tracking-wider">Performance (%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9cb8a9] uppercase tracking-wider">Injury Risk (%)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9cb8a9] uppercase tracking-wider">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const alertClass = getAlertColor(player.fatigue, player.performance, player.injuryRisk)
                return (
                  <tr key={player.id} className="border-b border-[#14B871]/5 hover:bg-[#14B871]/5 transition-colors">
                    <td className="px-6 py-3 font-bold text-[#14B871]">{player.id}</td>
                    <td className="px-6 py-3 font-medium text-[#e8f5ee]">{player.name}</td>
                    <td className="px-6 py-3">{player.fatigue}</td>
                    <td className="px-6 py-3">{player.performance}</td>
                    <td className="px-6 py-3">{player.injuryRisk}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${alertClass}`}>
                        {alertClass.includes("red") ? "Substitute Immediately" :
                         alertClass.includes("yellow") ? "Monitor / Consider Sub" :
                         "No Action Needed"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fatigue Bar Chart */}
      <div className="glass-card rounded-2xl p-6 h-[350px]">
        <h3 className="text-sm font-semibold text-[#e8f5ee] mb-4">Top 5 Most Fatigued Players</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={players.sort((a, b) => b.fatigue - a.fatigue)}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f3d33" />
            <XAxis type="number" domain={[0, 100]} stroke="#9cb8a9" />
            <YAxis dataKey="name" type="category" stroke="#9cb8a9" width={100} />
            <Tooltip />
            <Bar dataKey="fatigue" fill="#FF4C4C" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
