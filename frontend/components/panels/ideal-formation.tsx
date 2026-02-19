"use client"

import { useEffect, useState } from "react"

type FormationData = {
  detectedFormation: string
  convexHullArea: number
  avgPlayerSpacing: number
  teamWidth: number
  teamDepth: number
}

type PlayerPosition = {
  x: string
  y: string
  number: number
}

export function IdealFormation() {
  const fallbackPositions: PlayerPosition[] = [
    { x: "10%", y: "50%", number: 1 },
    { x: "25%", y: "20%", number: 2 },
    { x: "25%", y: "50%", number: 3 },
    { x: "25%", y: "80%", number: 4 },
    { x: "45%", y: "25%", number: 6 },
    { x: "45%", y: "50%", number: 8 },
    { x: "45%", y: "75%", number: 10 },
    { x: "70%", y: "20%", number: 7 },
    { x: "70%", y: "50%", number: 9 },
    { x: "70%", y: "80%", number: 11 },
    { x: "85%", y: "50%", number: 9 },
  ]
  const [formationData, setFormationData] = useState<FormationData>({
    detectedFormation: "4-3-3",
    convexHullArea: 1850,
    avgPlayerSpacing: 14.2,
    teamWidth: 52,
    teamDepth: 38,
  })
  const [playerPositions, setPlayerPositions] = useState<PlayerPosition[]>(fallbackPositions)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/formation?match_id=1&team_id=0")
        if (!res.ok) return
        const data = await res.json()
        if (data?.detectedFormation) {
          setFormationData({
            detectedFormation: String(data.detectedFormation),
            convexHullArea: Number(data.convexHullArea || 0),
            avgPlayerSpacing: Number(data.avgPlayerSpacing || 0),
            teamWidth: Number(data.teamWidth || 0),
            teamDepth: Number(data.teamDepth || 0),
          })
        }
        if (Array.isArray(data?.playerPositions) && data.playerPositions.length > 0) {
          setPlayerPositions(data.playerPositions)
        }
      } catch {
        // Keep fallback values
      }
    }
    load()
  }, [])

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e8f5ee]">Formation Analysis</h1>
        <p className="mt-1 text-sm text-[#9cb8a9]">
          Geometric evaluation of team structure and spatial distribution
        </p>
      </div>

      {/* Formation Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Metric label="Detected Formation" value={formationData.detectedFormation} />
        <Metric label="Convex Hull Area" value={`${formationData.convexHullArea.toFixed(2)} m²`} />
        <Metric label="Avg Player Spacing" value={`${formationData.avgPlayerSpacing.toFixed(2)} m`} />
        <Metric label="Team Width" value={`${formationData.teamWidth.toFixed(2)} m`} />
        <Metric label="Team Depth" value={`${formationData.teamDepth.toFixed(2)} m`} />
      </div>

      {/* Tactical Shape Visualization */}
      <div className="glass-card rounded-2xl p-6 overflow-hidden">
        <h3 className="text-sm font-semibold text-[#e8f5ee] mb-4">Detected Team Shape</h3>

        <div className="relative w-full aspect-[2/1] rounded-xl bg-[#0d4a35] border border-[#14B871]/15 overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 300" fill="none">
            <rect x="10" y="10" width="580" height="280" stroke="#14B871" strokeWidth="1" strokeOpacity="0.3" />
            <line x1="300" y1="10" x2="300" y2="290" stroke="#14B871" strokeWidth="1" strokeOpacity="0.3" />
            <circle cx="300" cy="150" r="40" stroke="#14B871" strokeWidth="1" strokeOpacity="0.3" />
          </svg>

          {playerPositions.map((p, i) => (
            <div
              key={i}
              className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[9px] font-bold text-[#050F0C] bg-[#14B871] shadow-lg"
              style={{ left: p.x, top: p.y, boxShadow: `0 0 10px #14B87180` }}
            >
              {p.number}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <p className="text-xs text-[#9cb8a9]">{label}</p>
      <p className="text-lg font-semibold text-[#e8f5ee] mt-1">{value}</p>
    </div>
  )
}
