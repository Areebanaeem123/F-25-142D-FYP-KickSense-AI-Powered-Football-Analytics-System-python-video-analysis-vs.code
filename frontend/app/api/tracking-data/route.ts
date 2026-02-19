import { NextResponse } from "next/server"

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
            // Fetch tracking data for the match
            // We return x_coord, y_coord, track_id, and time
            // time is used to sync with video playback (seconds since start)
            const result = await client.query(
                `
        SELECT 
          track_id, 
          x_coord, 
          y_coord, 
          time
        FROM tracking_data
        WHERE match_id = $1
        ORDER BY time ASC
        `,
                [matchId]
            )

            if (result.rows.length === 0) {
                return NextResponse.json([])
            }

            // Convert time to seconds relative to first frame
            const firstTime = result.rows[0].time.getTime()
            const formattedData = result.rows.map(row => ({
                track_id: row.track_id,
                x: row.x_coord,
                y: row.y_coord,
                timestamp: (row.time.getTime() - firstTime) / 1000
            }))

            return NextResponse.json(formattedData)
        } finally {
            await client.end()
        }
    } catch (error) {
        console.error("Failed to fetch tracking data:", error)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
}
