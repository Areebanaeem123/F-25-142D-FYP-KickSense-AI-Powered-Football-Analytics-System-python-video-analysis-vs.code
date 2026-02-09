"use client"

import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts"

export function FoulCardAnalysis() {
  // --- Set-Piece Specialist Data ---
  const setPiecePlayers = [
    {
      name: "L. Martinez",
      shootingAccuracy: 88,
      composure: 92,
      conversionRate: 85,
    },
    {
      name: "K. Silva",
      shootingAccuracy: 81,
      composure: 86,
      conversionRate: 79,
    },
    {
      name: "A. Torres",
      shootingAccuracy: 90,
      composure: 89,
      conversionRate: 91,
    },
    {
        name: "A. Torres",
        shootingAccuracy: 90,
        composure: 89,
        conversionRate: 91,
    },
    {
        name: "A. Torres",
        shootingAccuracy: 90,
        composure: 89,
        conversionRate: 91,
    },
    {
        name: "A. Torres",
        shootingAccuracy: 90,
        composure: 89,
        conversionRate: 91,
    },
    {
        name: "A. Torres",
        shootingAccuracy: 90,
        composure: 89,
        conversionRate: 91,
    },
    {
        name: "A. Torres",
        shootingAccuracy: 90,
        composure: 89,
        conversionRate: 91,
    },
    {
        name: "A. Torres",
        shootingAccuracy: 90,
        composure: 89,
        conversionRate: 91,
    },
    {
        name: "A. Torres",
        shootingAccuracy: 90,
        composure: 89,
        conversionRate: 91,
    },
    {
        name: "A. Torres",
        shootingAccuracy: 90,
        composure: 89,
        conversionRate: 91,
    },
  ]

  // Radar chart format (one example player profile view)
  const radarData = [
    { skill: "Shooting Accuracy", value: 90 },
    { skill: "Composure", value: 89 },
    { skill: "Conversion Rate", value: 91 },
  ]

  // --- Foul & Card Prediction Data ---
  const foulRiskPlayers = [
    { name: "R. Fernandez", yellowProb: 65, redProb: 18 },
    { name: "L. Martinez", yellowProb: 40, redProb: 6 },
    { name: "D. Lopez", yellowProb: 22, redProb: 3 },
    { name: "K. Silva", yellowProb: 55, redProb: 12 },
    { name: "A. Torres", yellowProb: 70, redProb: 25 },
    { name: "A. Torres", yellowProb: 70, redProb: 25 },
    { name: "A. Torres", yellowProb: 70, redProb: 25 },
    { name: "A. Torres", yellowProb: 70, redProb: 25 },
    { name: "A. Torres", yellowProb: 70, redProb: 25 },
    { name: "A. Torres", yellowProb: 70, redProb: 25 },
    { name: "A. Torres", yellowProb: 70, redProb: 25 },
  ]

  const getRiskLevel = (yellow: number, red: number) => {
    if (red > 20 || yellow > 65) return "High Risk"
    if (red > 10 || yellow > 45) return "Moderate Risk"
    return "Low Risk"
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">

      {/* ================= SET-PIECE SPECIALISTS ================= */}
      <div>
        <h1 className="text-2xl font-bold text-[#e8f5ee]">Set-Piece Specialist Identification</h1>
        <p className="text-sm text-[#9cb8a9] mt-1">
          Based on shooting accuracy, composure under pressure, and historical conversion rates
        </p>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#14B871]/10">
              <th className="px-6 py-3 text-left text-xs text-[#9cb8a9] uppercase">Player</th>
              <th className="px-6 py-3 text-left text-xs text-[#9cb8a9] uppercase">Shooting Accuracy (%)</th>
              <th className="px-6 py-3 text-left text-xs text-[#9cb8a9] uppercase">Composure (%)</th>
              <th className="px-6 py-3 text-left text-xs text-[#9cb8a9] uppercase">Conversion Rate (%)</th>
              <th className="px-6 py-3 text-left text-xs text-[#9cb8a9] uppercase">Role Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {setPiecePlayers.map((p) => (
              <tr key={p.name} className="border-b border-[#14B871]/5 hover:bg-[#14B871]/5">
                <td className="px-6 py-3 font-medium text-[#e8f5ee]">{p.name}</td>
                <td className="px-6 py-3">{p.shootingAccuracy}</td>
                <td className="px-6 py-3">{p.composure}</td>
                <td className="px-6 py-3">{p.conversionRate}</td>
                <td className="px-6 py-3 text-[#14B871] font-semibold">
                  {p.conversionRate > 88 ? "Primary Taker" : "Secondary Option"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Radar Chart Example */}
      <div className="glass-card rounded-2xl p-6 h-[320px]">
        <h3 className="text-sm font-semibold text-[#e8f5ee] mb-4">
          Specialist Skill Profile (Top Candidate)
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#1f3d33" />
            <PolarAngleAxis dataKey="skill" stroke="#9cb8a9" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#9cb8a9" />
            <Radar name="Skill Level" dataKey="value" stroke="#14B871" fill="#14B871" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* ================= FOUL & CARD PREDICTION ================= */}
      <div>
        <h1 className="text-2xl font-bold text-[#e8f5ee]">Foul & Card Likelihood Prediction</h1>
        <p className="text-sm text-[#9cb8a9] mt-1">
          Predicted probabilities using historical aggression, referee strictness, and match intensity
        </p>
      </div>

      {/* Risk Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#14B871]/10">
              <th className="px-6 py-3 text-left text-xs text-[#9cb8a9] uppercase">Player</th>
              <th className="px-6 py-3 text-left text-xs text-[#9cb8a9] uppercase">Yellow Card Probability (%)</th>
              <th className="px-6 py-3 text-left text-xs text-[#9cb8a9] uppercase">Red Card Probability (%)</th>
              <th className="px-6 py-3 text-left text-xs text-[#9cb8a9] uppercase">Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {foulRiskPlayers.map((p) => (
              <tr key={p.name} className="border-b border-[#14B871]/5 hover:bg-[#14B871]/5">
                <td className="px-6 py-3 font-medium text-[#e8f5ee]">{p.name}</td>
                <td className="px-6 py-3">{p.yellowProb}%</td>
                <td className="px-6 py-3">{p.redProb}%</td>
                <td className="px-6 py-3 font-semibold">
                  {getRiskLevel(p.yellowProb, p.redProb)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar Chart for Card Risk */}
      <div className="glass-card rounded-2xl p-6 h-[350px]">
        <h3 className="text-sm font-semibold text-[#e8f5ee] mb-4">
          Card Risk Comparison
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={foulRiskPlayers}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f3d33" />
            <XAxis dataKey="name" stroke="#9cb8a9" />
            <YAxis stroke="#9cb8a9" domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="yellowProb" fill="#FFD166" name="Yellow Card %" />
            <Bar dataKey="redProb" fill="#FF4C4C" name="Red Card %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}
