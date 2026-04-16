import { NextResponse } from "next/server"

export const runtime = "nodejs"

async function readPassingData(matchId: number, playerId: number | null = null) {
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
        // 1. Individual pass events
        let eventQuery = `
            SELECT
                pass_id,
                passer_id,
                receiver_id,
                passer_team,
                receiver_team,
                frame_idx,
                time,
                distance_m,
                is_completed,
                is_progressive,
                x_origin,
                y_origin,
                x_target,
                y_target,
                trajectory
            FROM pass_events
            WHERE match_id = $1
        `
        const eventParams: any[] = [matchId]
        if (playerId !== null) {
            eventQuery += ` AND passer_id = $2`
            eventParams.push(playerId)
        }
        eventQuery += ` ORDER BY frame_idx ASC`
        const eventsResult = await client.query(eventQuery, eventParams)

        // 2. Per-player passing aggregates
        let playerQuery = `
            SELECT
                track_id,
                team_id,
                passes_attempted,
                passes_completed,
                pass_accuracy,
                avg_pass_distance_m,
                progressive_passes
            FROM player_match_stats
            WHERE match_id = $1
              AND passes_attempted > 0
            ORDER BY passes_attempted DESC
        `
        const playerParams: any[] = [matchId]
        const playerResult = await client.query(playerQuery, playerParams)

        // 3. Team-level passing stats
        const teamQuery = `
            SELECT
                team_id,
                total_passes,
                completed_passes,
                pass_accuracy,
                total_pass_distance_m,
                progressive_passes,
                avg_pass_distance_m
            FROM team_passing_stats
            WHERE match_id = $1
            ORDER BY team_id ASC
        `
        const teamResult = await client.query(teamQuery, [matchId])

        // 4. Team-level possession stats
        const possessionQuery = `
            SELECT
                team_id,
                possession_percentage,
                possession_frames
            FROM team_possession_stats
            WHERE match_id = $1
            ORDER BY team_id ASC
        `
        const possessionResult = await client.query(possessionQuery, [matchId])

        return {
            pass_events: eventsResult.rows,
            player_passing_stats: playerResult.rows,
            team_passing_stats: teamResult.rows,
            possession_stats: possessionResult.rows,
        }
    } finally {
        await client.end()
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const matchId = Number(searchParams.get("match_id") || 1)
    const playerId = searchParams.get("player_id") ? Number(searchParams.get("player_id")) : null

    try {
        const data = await readPassingData(matchId, playerId)
        return NextResponse.json(data)
    } catch (error) {
        console.error("Error loading passing stats:", error)
        return NextResponse.json(
            { error: "Failed to load passing stats" },
            { status: 500 }
        )
    }
}
