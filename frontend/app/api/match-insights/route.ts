import { NextResponse } from "next/server"

type PlayerRow = {
  track_id: number
  max_speed_kmh: number | null
  avg_speed_kmh: number | null
  total_distance_m: number | null
  foul_risk: number | null
}

type TimelineRow = {
  bucket: Date
  avg_speed_kmh: number | null
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function normalizeRows(rows: PlayerRow[]) {
  if (rows.length === 0) {
    return []
  }
  const maxDistance = Math.max(...rows.map((r) => r.total_distance_m || 0), 1)
  const maxAvgSpeed = Math.max(...rows.map((r) => r.avg_speed_kmh || 0), 1)

  return rows.map((r) => {
    const nd = (r.total_distance_m || 0) / maxDistance
    const ns = (r.avg_speed_kmh || 0) / maxAvgSpeed
    const nf = 1 - (r.foul_risk || 0)
    const rating = clamp((0.45 * nd + 0.35 * ns + 0.2 * nf) * 10, 0, 10)
    return {
      name: `P${r.track_id}`,
      rating: Number(rating.toFixed(2)),
    }
  })
}

export const runtime = "nodejs"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const matchId = Number(searchParams.get("match_id") || 1)

  try {
    const { Client } = await import("pg")
    const client = new Client({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || "kicksense",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "password123",
    })
    await client.connect()

    try {
      const playersResult = await client.query(
        `
        SELECT
          track_id,
          max_speed_kmh,
          avg_speed_kmh,
          total_distance_m,
          foul_risk
        FROM player_match_stats
        WHERE match_id = $1
          AND class IN ('Player', 'Goalkeeper')
        ORDER BY track_id
        `,
        [matchId]
      )
      const players = playersResult.rows as PlayerRow[]

      const aggregated = await client.query(
        `
        SELECT
          AVG(speed) * 3.6 AS avg_speed_kmh,
          MAX(speed) * 3.6 AS peak_speed_kmh,
          COUNT(DISTINCT track_id) AS tracked_players
        FROM tracking_data
        WHERE match_id = $1
        `,
        [matchId]
      )

      const speedTimelineResult = await client.query(
        `
        SELECT
          time_bucket('10 seconds', time) AS bucket,
          AVG(speed) * 3.6 AS avg_speed_kmh
        FROM tracking_data
        WHERE match_id = $1
        GROUP BY bucket
        ORDER BY bucket
        `,
        [matchId]
      )
      const speedTimeline = speedTimelineResult.rows as TimelineRow[]

      if (players.length === 0) {
        return NextResponse.json({
          playerRankings: [],
          teamStats: [],
          speedTimeline: [],
        })
      }

      const rankings = normalizeRows(players)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10)

      const totalDistanceKm =
        players.reduce((acc, row) => acc + (row.total_distance_m || 0), 0) / 1000
      const highRiskPlayers = players.filter((r) => (r.foul_risk || 0) >= 0.4).length
      const agg = aggregated.rows[0] || {}

      const firstBucket = speedTimeline[0]?.bucket
      const speedData = speedTimeline.map((row) => {
        const minute =
          firstBucket instanceof Date && row.bucket instanceof Date
            ? Math.round((row.bucket.getTime() - firstBucket.getTime()) / 60000)
            : 0
        return {
          minute,
          speed: Number((row.avg_speed_kmh || 0).toFixed(2)),
        }
      })

      return NextResponse.json({
        playerRankings: rankings,
        teamStats: [
          { label: "Tracked Players", value: Number(agg.tracked_players || 0) },
          { label: "Avg Speed (km/h)", value: Number((agg.avg_speed_kmh || 0).toFixed(2)) },
          { label: "Peak Speed (km/h)", value: Number((agg.peak_speed_kmh || 0).toFixed(2)) },
          { label: "Total Distance (km)", value: Number(totalDistanceKm.toFixed(2)) },
          { label: "High Card Risk", value: highRiskPlayers },
        ],
        speedTimeline: speedData,
      })
    } finally {
      await client.end()
    }
  } catch (error) {
    console.warn("Failed to read match insights from TimescaleDB:", error)
    return NextResponse.json({
      playerRankings: [],
      teamStats: [],
      speedTimeline: [],
    })
  }
}
