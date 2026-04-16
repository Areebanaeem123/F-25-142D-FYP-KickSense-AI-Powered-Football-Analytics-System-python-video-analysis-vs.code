import { NextResponse } from "next/server"

type PositionRow = {
  track_id: number
  x_coord: number
  y_coord: number
}

function nearestNeighborMean(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) return 0
  let total = 0
  for (let i = 0; i < points.length; i++) {
    let best = Number.POSITIVE_INFINITY
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue
      const dx = points[i].x - points[j].x
      const dy = points[i].y - points[j].y
      const d = Math.hypot(dx, dy)
      if (d < best) best = d
    }
    total += best
  }
  return total / points.length
}

function convexHullArea(points: Array<{ x: number; y: number }>) {
  if (points.length < 3) return 0
  const sorted = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x))
  const cross = (o: any, a: any, b: any) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)

  const lower: Array<{ x: number; y: number }> = []
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop()
    }
    lower.push(p)
  }

  const upper: Array<{ x: number; y: number }> = []
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop()
    }
    upper.push(p)
  }

  const hull = lower.slice(0, -1).concat(upper.slice(0, -1))
  let area = 0
  for (let i = 0; i < hull.length; i++) {
    const j = (i + 1) % hull.length
    area += hull[i].x * hull[j].y - hull[j].x * hull[i].y
  }
  return Math.abs(area) / 2
}

function toPercent(v: number, min: number, max: number) {
  if (max - min <= 1e-6) return 50
  return 10 + ((v - min) / (max - min)) * 80
}

export const runtime = "nodejs"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const matchId = Number(searchParams.get("match_id") || 1)
  const teamId = Number(searchParams.get("team_id") || 0)

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
      // 1. Try to fetch persisted formation stats
      const persisted = await client.query(
        `
        SELECT team_id, formation, status, avg_area, area_per_player
        FROM team_formation_stats
        WHERE match_id = $1 AND team_id = $2
        `,
        [matchId, teamId]
      )

      if (persisted.rows.length > 0) {
        const row = persisted.rows[0]

        // We still need player positions for the tactical map visualization
        const positionsResult = await client.query(
          `
          SELECT track_id, x_coord, y_coord
          FROM tracking_data
          WHERE match_id = $1
            AND team_id = $2
            AND time = (SELECT MAX(time) FROM tracking_data WHERE match_id = $1 AND team_id = $2)
          ORDER BY track_id
          `,
          [matchId, teamId]
        )
        const pts = positionsResult.rows.map((r) => ({ id: r.track_id, x: r.x_coord, y: r.y_coord }))
        const xs = pts.map((p) => p.x)
        const ys = pts.map((p) => p.y)
        const minX = Math.min(...xs, -50), maxX = Math.max(...xs, 50)
        const minY = Math.min(...ys, -35), maxY = Math.max(...ys, 35)

        const playerPositions = pts.map((p) => ({
          x: `${toPercent(p.x, minX, maxX).toFixed(1)}%`,
          y: `${toPercent(p.y, minY, maxY).toFixed(1)}%`,
          number: p.id,
        }))

        // Fetch possession
        const possessionResult = await client.query(
          `SELECT possession_percentage FROM team_possession_stats WHERE match_id = $1 AND team_id = $2`,
          [matchId, teamId]
        )
        const possession = possessionResult.rows[0]?.possession_percentage || 0

        return NextResponse.json({
          detectedFormation: row.formation,
          tacticalStatus: row.status,
          convexHullArea: Number((row.avg_area || 0).toFixed(2)),
          avgPlayerSpacing: Number((row.area_per_player || 0).toFixed(2)),
          teamWidth: 0,
          teamDepth: 0,
          possessionPercentage: Number(possession.toFixed(1)),
          playerPositions,
        })
      }

      // 2. Fallback to dynamic calculation
      // Fetch possession anyway if available
      const possessionResult = await client.query(
        `SELECT possession_percentage FROM team_possession_stats WHERE match_id = $1 AND team_id = $2`,
        [matchId, teamId]
      )
      const possession = possessionResult.rows[0]?.possession_percentage || 0
      const latest = await client.query(
        `
        SELECT MAX(time) AS max_time
        FROM tracking_data
        WHERE match_id = $1
          AND team_id = $2
        `,
        [matchId, teamId]
      )

      const maxTime = latest.rows[0]?.max_time
      if (!maxTime) {
        return NextResponse.json({
          detectedFormation: "N/A",
          convexHullArea: 0,
          avgPlayerSpacing: 0,
          teamWidth: 0,
          teamDepth: 0,
          possessionPercentage: Number(possession.toFixed(1)),
          playerPositions: [],
        })
      }

      const positionsResult = await client.query(
        `
        SELECT track_id, x_coord, y_coord
        FROM tracking_data
        WHERE match_id = $1
          AND team_id = $2
          AND time = $3
        ORDER BY track_id
        `,
        [matchId, teamId, maxTime]
      )
      const positions = positionsResult.rows as PositionRow[]

      const pts = positions.map((r) => ({ id: r.track_id, x: r.x_coord, y: r.y_coord }))
      if (pts.length === 0) {
        return NextResponse.json({
          detectedFormation: "N/A",
          convexHullArea: 0,
          avgPlayerSpacing: 0,
          teamWidth: 0,
          teamDepth: 0,
          playerPositions: [],
        })
      }

      const xs = pts.map((p) => p.x)
      const ys = pts.map((p) => p.y)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)

      const width = maxY - minY
      const depth = maxX - minX
      const spacing = nearestNeighborMean(pts)
      const area = convexHullArea(pts)

      const sortedX = [...xs].sort((a, b) => a - b)
      const q1 = sortedX[Math.floor(sortedX.length / 3)] ?? sortedX[0]
      const q2 = sortedX[Math.floor((2 * sortedX.length) / 3)] ?? sortedX[sortedX.length - 1]
      let def = 0
      let mid = 0
      let att = 0
      for (const x of xs) {
        if (x <= q1) def += 1
        else if (x <= q2) mid += 1
        else att += 1
      }
      const detectedFormation = `${def}-${mid}-${att}`

      const playerPositions = pts.map((p) => ({
        x: `${toPercent(p.x, minX, maxX).toFixed(1)}%`,
        y: `${toPercent(p.y, minY, maxY).toFixed(1)}%`,
        number: p.id,
      }))

      return NextResponse.json({
        detectedFormation,
        convexHullArea: Number(area.toFixed(2)),
        avgPlayerSpacing: Number(spacing.toFixed(2)),
        teamWidth: Number(width.toFixed(2)),
        teamDepth: Number(depth.toFixed(2)),
        possessionPercentage: Number(possession.toFixed(1)),
        playerPositions,
      })
    } finally {
      await client.end()
    }
  } catch (error) {
    console.warn("Failed to read formation data from TimescaleDB:", error)
    return NextResponse.json({
      detectedFormation: "N/A",
      convexHullArea: 0,
      avgPlayerSpacing: 0,
      teamWidth: 0,
      teamDepth: 0,
      playerPositions: [],
    })
  }
}
