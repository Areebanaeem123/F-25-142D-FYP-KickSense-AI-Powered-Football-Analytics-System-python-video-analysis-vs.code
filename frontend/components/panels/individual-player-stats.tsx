"use client"

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts"

export function IndividualPlayerStats() {
  const players = [
    {
      id: 1,
      name: "L. Martinez",
      speed: 34.2,
      distance: 11.2,
      sprints: 18,
      fatigue: 72,
      passesAttempted: 42,
      passesCompleted: 36,
      shots: 4,
      shotsOnTarget: 2,
      goals: 1,
      possessionTime: 192,
      dribblesAttempted: 9,
      dribblesSuccessful: 6,
    },
    {
      id: 2,
      name: "K. Silva",
      speed: 31.8,
      distance: 12.8,
      sprints: 14,
      fatigue: 58,
      passesAttempted: 65,
      passesCompleted: 58,
      shots: 2,
      shotsOnTarget: 1,
      goals: 0,
      possessionTime: 242,
      dribblesAttempted: 6,
      dribblesSuccessful: 4,
    },
    {
        id: 3,
        name: "areeba naeem ",
        speed: 31.8,
        distance: 12.8,
        sprints: 14,
        fatigue: 58,
        passesAttempted: 65,
        passesCompleted: 58,
        shots: 2,
        shotsOnTarget: 1,
        goals: 0,
        possessionTime: 242,
        dribblesAttempted: 6,
        dribblesSuccessful: 4,
    },
    {
        id: 4,
        name: "mustafa zafar",
        speed: 31.8,
        distance: 12.8,
        sprints: 14,
        fatigue: 100,
        passesAttempted: 65,
        passesCompleted: 58,
        shots: 2,
        shotsOnTarget: 1,
        goals: 0,
        possessionTime: 242,
        dribblesAttempted: 6,
        dribblesSuccessful: 4,
    },
    {
        id: 5,
        name: "tayyab",
        speed: 31.8,
        distance: 12.8,
        sprints: 14,
        fatigue: 58,
        passesAttempted: 65,
        passesCompleted: 58,
        shots: 2,
        shotsOnTarget: 1,
        goals: 0,
        possessionTime: 242,
        dribblesAttempted: 6,
        dribblesSuccessful: 4,
    },
    {
        id: 6,
        name: "umama",
        speed: 31.8,
        distance: 12.8,
        sprints: 14,
        fatigue: 58,
        passesAttempted: 65,
        passesCompleted: 58,
        shots: 2,
        shotsOnTarget: 1,
        goals: 0,
        possessionTime: 242,
        dribblesAttempted: 6,
        dribblesSuccessful: 4,
    },
    {
        id: 7,
        name: "arman",
        speed: 31.8,
        distance: 12.8,
        sprints: 14,
        fatigue: 58,
        passesAttempted: 65,
        passesCompleted: 58,
        shots: 2,
        shotsOnTarget: 1,
        goals: 0,
        possessionTime: 242,
        dribblesAttempted: 6,
        dribblesSuccessful: 4,
    },
    {
      id: 8,
      name: "amna ",
      speed: 31.8,
      distance: 12.8,
      sprints: 14,
      fatigue: 100,
      passesAttempted: 65,
      passesCompleted: 58,
      shots: 2,
      shotsOnTarget: 1,
      goals: 0,
      possessionTime: 242,
      dribblesAttempted: 6,
      dribblesSuccessful: 4,
    },
    {
        id: 9,
        name: "meerab",
        speed: 31.8,
        distance: 12.8,
        sprints: 14,
        fatigue: 66,
        passesAttempted: 65,
        passesCompleted: 58,
        shots: 2,
        shotsOnTarget: 1,
        goals: 0,
        possessionTime: 242,
        dribblesAttempted: 6,
        dribblesSuccessful: 4,
    },
    {
        id: 10,
        name: "falak",
        speed: 31.8,
        distance: 12.8,
        sprints: 14,
        fatigue: 12,
        passesAttempted: 65,
        passesCompleted: 58,
        shots: 2,
        shotsOnTarget: 1,
        goals: 0,
        possessionTime: 242,
        dribblesAttempted: 6,
        dribblesSuccessful: 4,
    },
    {
        id: 11,
        name: "adina pro footballer",
        speed: 31.8,
        distance: 12.8,
        sprints: 14,
        fatigue: 65,
        passesAttempted: 65,
        passesCompleted: 58,
        shots: 2,
        shotsOnTarget: 1,
        goals: 0,
        possessionTime: 242,
        dribblesAttempted: 6,
        dribblesSuccessful: 4,
    },
  ]

  const getFatigueColor = (fatigue: number) => {
    if (fatigue > 70) return "text-red-400"
    if (fatigue > 50) return "text-yellow-400"
    return "text-green-400"
  }

  const performanceData = players.map((p) => ({
    name: p.name,
    Speed: p.speed,
    Distance: p.distance,
    Sprints: p.sprints,
    Passing: Math.round((p.passesCompleted / p.passesAttempted) * 100),
    Dribbling: Math.round((p.dribblesSuccessful / p.dribblesAttempted) * 100),
  }))

  return (
    <div className="animate-fade-in flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold text-[#e8f5ee]">Individual Player Performance</h1>
        <p className="mt-1 text-sm text-[#9cb8a9]">Advanced physical & technical analytics</p>
      </div>

      {/* PLAYER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {players.map((player) => {
          const passAccuracy = Math.round((player.passesCompleted / player.passesAttempted) * 100)
          const dribbleSuccess = Math.round((player.dribblesSuccessful / player.dribblesAttempted) * 100)

          return (
            <div key={player.id} className="glass-card rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#e8f5ee]">{player.name}</h3>
                  <p className="text-xs text-[#9cb8a9]">Jersey #{player.id}</p>
                </div>
                <span className={`text-xs font-semibold ${getFatigueColor(player.fatigue)}`}>
                  Fatigue: {player.fatigue}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Max Speed" value={`${player.speed} km/h`} />
                <Stat label="Distance" value={`${player.distance} km`} />
                <Stat label="Sprints" value={player.sprints.toString()} />
                <Stat label="Pass Accuracy" value={`${passAccuracy}%`} />
                <Stat label="Shots" value={player.shots.toString()} />
                <Stat label="Goals" value={player.goals.toString()} />
                <Stat label="Possession Time" value={`${Math.floor(player.possessionTime / 60)}m ${player.possessionTime % 60}s`} />
                <Stat label="Dribble Success" value={`${dribbleSuccess}%`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* BAR CHART */}
      <div className="glass-card rounded-2xl p-6 h-[350px]">
        <h3 className="text-sm font-semibold text-[#e8f5ee] mb-4">Speed & Distance Comparison</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f3d33" />
            <XAxis dataKey="name" stroke="#9cb8a9" />
            <YAxis stroke="#9cb8a9" />
            <Tooltip />
            <Bar dataKey="Speed" />
            <Bar dataKey="Distance" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* RADAR CHART */}
      <div className="glass-card rounded-2xl p-6 h-[350px]">
        <h3 className="text-sm font-semibold text-[#e8f5ee] mb-4">Overall Performance Radar</h3>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart outerRadius={90} data={performanceData}>
            <PolarGrid stroke="#1f3d33" />
            <PolarAngleAxis dataKey="name" stroke="#9cb8a9" />
            <PolarRadiusAxis stroke="#9cb8a9" />
            <Radar dataKey="Speed" stroke="#14B871" fill="#14B871" fillOpacity={0.5} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0d4a35]/40 rounded-lg p-3">
      <p className="text-xs text-[#9cb8a9]">{label}</p>
      <p className="text-sm font-semibold text-[#e8f5ee] mt-0.5">{value}</p>
    </div>
  )
}
