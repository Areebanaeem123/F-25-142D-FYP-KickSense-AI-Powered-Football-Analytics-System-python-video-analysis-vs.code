"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  RadarChart,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PlayerStat {
  Track_ID: number
  Class: string
  Max_Speed_kmh: number
  Avg_Speed_kmh: number
  Total_Distance_m: number
  Foul_Risk?: number
  Yellow_Likelihood?: number
  Red_Likelihood?: number
  Card_Prediction?: string
  Contact_Events?: number
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#14b8a6",
  "#f97316",
  "#6366f1",
]

export function IndividualPlayerStats() {
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  const normalizeStats = (data: PlayerStat[]) => {
    const cleaned = (data || [])
      .map((p) => ({
        Track_ID: Number((p as PlayerStat).Track_ID),
        Class: String((p as PlayerStat).Class),
        Max_Speed_kmh: Number((p as PlayerStat).Max_Speed_kmh),
        Avg_Speed_kmh: Number((p as PlayerStat).Avg_Speed_kmh),
        Total_Distance_m: Number((p as PlayerStat).Total_Distance_m),
        Foul_Risk: Number.isFinite((p as PlayerStat).Foul_Risk)
          ? Number((p as PlayerStat).Foul_Risk)
          : undefined,
        Yellow_Likelihood: Number.isFinite((p as PlayerStat).Yellow_Likelihood)
          ? Number((p as PlayerStat).Yellow_Likelihood)
          : undefined,
        Red_Likelihood: Number.isFinite((p as PlayerStat).Red_Likelihood)
          ? Number((p as PlayerStat).Red_Likelihood)
          : undefined,
        Card_Prediction:
          typeof (p as PlayerStat).Card_Prediction === "string"
            ? String((p as PlayerStat).Card_Prediction)
            : undefined,
        Contact_Events: Number.isFinite((p as PlayerStat).Contact_Events)
          ? Number((p as PlayerStat).Contact_Events)
          : undefined,
      }))
      .filter(
        (p) =>
          Number.isFinite(p.Track_ID) &&
          Number.isFinite(p.Max_Speed_kmh) &&
          Number.isFinite(p.Avg_Speed_kmh) &&
          Number.isFinite(p.Total_Distance_m) &&
          (p.Class === "Player" || p.Class === "Goalkeeper"),
      )

    // Keep the most likely 22 on-field players if extra IDs exist.
    const top22 = cleaned
      .sort((a, b) => b.Total_Distance_m - a.Total_Distance_m)
      .slice(0, 22)
      .sort((a, b) => a.Track_ID - b.Track_ID)

    return top22
  }

  useEffect(() => {
    // Fetch player stats from backend or use sample data
    const fetchPlayerStats = async () => {
      try {
        // Try to fetch from backend first
        const response = await fetch("/api/player-stats")
        if (response.ok) {
          const data = await response.json()
          setPlayerStats(normalizeStats(data))
        } else {
          // Use sample data if backend not available
          setPlayerStats(normalizeStats(SAMPLE_DATA))
        }
      } catch {
        // Fallback to sample data
        setPlayerStats(normalizeStats(SAMPLE_DATA))
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerStats()
  }, [])

  const SAMPLE_DATA: PlayerStat[] = [
    { Track_ID: 1, Class: "Player", Max_Speed_kmh: 14.70, Avg_Speed_kmh: 6.53, Total_Distance_m: 54.15 },
    { Track_ID: 10, Class: "Player", Max_Speed_kmh: 19.70, Avg_Speed_kmh: 6.91, Total_Distance_m: 57.20 },
    { Track_ID: 11, Class: "Player", Max_Speed_kmh: 14.66, Avg_Speed_kmh: 6.05, Total_Distance_m: 50.19 },
    { Track_ID: 12, Class: "Player", Max_Speed_kmh: 21.25, Avg_Speed_kmh: 6.17, Total_Distance_m: 51.23 },
    { Track_ID: 13, Class: "Player", Max_Speed_kmh: 22.27, Avg_Speed_kmh: 7.45, Total_Distance_m: 61.83 },
    { Track_ID: 14, Class: "Player", Max_Speed_kmh: 23.70, Avg_Speed_kmh: 6.89, Total_Distance_m: 57.23 },
    { Track_ID: 15, Class: "Player", Max_Speed_kmh: 19.58, Avg_Speed_kmh: 6.24, Total_Distance_m: 51.84 },
    { Track_ID: 16, Class: "Player", Max_Speed_kmh: 31.08, Avg_Speed_kmh: 9.40, Total_Distance_m: 77.97 },
    { Track_ID: 17, Class: "Player", Max_Speed_kmh: 18.09, Avg_Speed_kmh: 6.69, Total_Distance_m: 55.50 },
    { Track_ID: 18, Class: "Player", Max_Speed_kmh: 19.62, Avg_Speed_kmh: 9.90, Total_Distance_m: 82.15 },
    { Track_ID: 2, Class: "Player", Max_Speed_kmh: 18.67, Avg_Speed_kmh: 7.79, Total_Distance_m: 64.50 },
    { Track_ID: 20, Class: "Player", Max_Speed_kmh: 17.60, Avg_Speed_kmh: 6.55, Total_Distance_m: 54.32 },
    { Track_ID: 21, Class: "Player", Max_Speed_kmh: 23.70, Avg_Speed_kmh: 6.38, Total_Distance_m: 52.96 },
    { Track_ID: 23, Class: "Player", Max_Speed_kmh: 23.16, Avg_Speed_kmh: 7.55, Total_Distance_m: 61.00 },
    { Track_ID: 3, Class: "Player", Max_Speed_kmh: 16.21, Avg_Speed_kmh: 7.43, Total_Distance_m: 61.69 },
    { Track_ID: 33, Class: "Player", Max_Speed_kmh: 32.70, Avg_Speed_kmh: 17.76, Total_Distance_m: 6.91 },
    { Track_ID: 5, Class: "Player", Max_Speed_kmh: 17.04, Avg_Speed_kmh: 8.65, Total_Distance_m: 71.79 },
    { Track_ID: 6, Class: "Player", Max_Speed_kmh: 20.97, Avg_Speed_kmh: 8.99, Total_Distance_m: 74.59 },
    { Track_ID: 7, Class: "Player", Max_Speed_kmh: 22.55, Avg_Speed_kmh: 6.34, Total_Distance_m: 52.60 },
    { Track_ID: 8, Class: "Player", Max_Speed_kmh: 17.45, Avg_Speed_kmh: 7.99, Total_Distance_m: 66.32 },
    { Track_ID: 9, Class: "Player", Max_Speed_kmh: 16.30, Avg_Speed_kmh: 8.94, Total_Distance_m: 74.22 },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-muted-foreground">Loading player analytics...</p>
      </div>
    )
  }

  // Prepare data for charts
  const speedComparisonData = playerStats.map((p) => ({
    name: `Player ${p.Track_ID}`,
    maxSpeed: parseFloat(p.Max_Speed_kmh.toFixed(1)),
    avgSpeed: parseFloat(p.Avg_Speed_kmh.toFixed(1)),
  }))

  const performanceRadarData = playerStats.map((p) => ({
    player: `P${p.Track_ID}`,
    maxSpeed: p.Max_Speed_kmh,
    avgSpeed: p.Avg_Speed_kmh,
    distance: (p.Total_Distance_m / 100) * 35, // Normalize to 0-35 scale
  }))

  const distanceData = playerStats.map((p) => ({
    name: `Player ${p.Track_ID}`,
    distance: parseFloat(p.Total_Distance_m.toFixed(1)),
  }))

  const selectedPlayerStats = playerStats.find((p) => p.Track_ID === parseInt(selectedPlayer.split("-")[1]))

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Player Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">Real-world speed, distance, and performance metrics</p>
        </div>
        <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select player" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Players</SelectItem>
            {playerStats.map((p) => (
              <SelectItem key={p.Track_ID} value={`player-${p.Track_ID}`}>
                Player {p.Track_ID}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      {selectedPlayer !== "all" && selectedPlayerStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Max Speed</CardTitle>
              <CardDescription>Peak velocity reached</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedPlayerStats.Max_Speed_kmh.toFixed(2)} km/h</div>
              <p className="text-xs text-muted-foreground mt-1">During match</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Speed</CardTitle>
              <CardDescription>Average velocity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedPlayerStats.Avg_Speed_kmh.toFixed(2)} km/h</div>
              <p className="text-xs text-muted-foreground mt-1">Throughout match</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
              <CardDescription>Ground covered</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedPlayerStats.Total_Distance_m.toFixed(2)} m</div>
              <p className="text-xs text-muted-foreground mt-1">During match</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Card Risk</CardTitle>
              <CardDescription>Foul likelihood estimate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedPlayerStats.Foul_Risk !== undefined
                  ? `${(selectedPlayerStats.Foul_Risk * 100).toFixed(0)}%`
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedPlayerStats.Card_Prediction ? selectedPlayerStats.Card_Prediction : "No prediction"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Speed & Distance Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Speed & Distance Comparison</CardTitle>
          <CardDescription>Maximum and average speeds across all players</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={speedComparisonData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis label={{ value: "Speed (km/h)", angle: -90, position: "insideLeft" }} />
              <Tooltip
                cursor={{ fill: "rgba(16, 185, 129, 0.1)" }}
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                formatter={(value: number) => value.toFixed(2)}
              />
              <Legend />
              <Bar dataKey="maxSpeed" fill="#10b981" name="Max Speed" radius={[8, 8, 0, 0]} />
              <Bar dataKey="avgSpeed" fill="#3b82f6" name="Avg Speed" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Total Distance Covered */}
      <Card>
        <CardHeader>
          <CardTitle>Total Distance Covered</CardTitle>
          <CardDescription>Ground covered by each player during match</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distanceData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis label={{ value: "Distance (m)", angle: -90, position: "insideLeft" }} />
              <Tooltip
                cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                formatter={(value: number) => value.toFixed(2)}
              />
              <Bar dataKey="distance" fill="#06b6d4" name="Distance" radius={[8, 8, 0, 0]}>
                {distanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Overall Performance Radar */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Performance Radar</CardTitle>
          <CardDescription>Performance metrics comparison across key players</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={performanceRadarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="player" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 35]} />
              <Radar name="Max Speed" dataKey="maxSpeed" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              <Radar name="Avg Speed" dataKey="avgSpeed" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              <Radar name="Distance (m/3)" dataKey="distance" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Individual Player Cards */}
      <Card>
        <CardHeader>
          <CardTitle>All Players Statistics</CardTitle>
          <CardDescription>Detailed stats for each player</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playerStats.map((player, idx) => (
              <div
                key={player.Track_ID}
                className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Player {player.Track_ID}</h3>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Speed:</span>
                    <span className="font-medium">{player.Max_Speed_kmh.toFixed(2)} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Speed:</span>
                    <span className="font-medium">{player.Avg_Speed_kmh.toFixed(2)} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distance:</span>
                    <span className="font-medium">{player.Total_Distance_m.toFixed(2)} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Card Risk:</span>
                    <span className="font-medium">
                      {player.Foul_Risk !== undefined ? `${(player.Foul_Risk * 100).toFixed(0)}%` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prediction:</span>
                    <span className="font-medium">{player.Card_Prediction ?? "None"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
