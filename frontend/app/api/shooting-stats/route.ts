import { NextResponse } from "next/server"

export const runtime = "nodejs"

async function readShootingEvents(matchId: number, playerId: number | null = null) {
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
        let query = `
      SELECT
        shot_id,
        track_id,
        team_id,
        frame_idx,
        time,
        distance_m,
        angle_deg,
        power_ms,
        xg,
        is_on_target,
        is_goal,
        is_big_chance,
        x_origin,
        y_origin,
        trajectory
      FROM shot_events
      WHERE match_id = $1
      `
        const params: any[] = [matchId]

        if (playerId !== null) {
            query += ` AND track_id = $2`
            params.push(playerId)
        }

        query += ` ORDER BY frame_idx ASC`

        const result = await client.query(query, params)
        return result.rows
    } finally {
        await client.end()
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const matchId = Number(searchParams.get("match_id") || 1)
    const playerId = searchParams.get("player_id") ? Number(searchParams.get("player_id")) : null

    try {
        const events = await readShootingEvents(matchId, playerId)
        return NextResponse.json(events)
    } catch (error) {
        console.error("Error loading shooting events:", error)
        return NextResponse.json(
            { error: "Failed to load shooting events" },
            { status: 500 }
        )
    }
}
