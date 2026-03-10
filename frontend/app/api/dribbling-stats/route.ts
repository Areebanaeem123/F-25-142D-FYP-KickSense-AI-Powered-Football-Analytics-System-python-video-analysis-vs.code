import { NextResponse } from "next/server"

export const runtime = "nodejs"

async function readDribblingFromTimescale(matchId: number) {
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
    // Fetch player dribbling stats - handle case where columns might not exist yet
    let playerResult = { rows: [] }
    try {
      playerResult = await client.query(
        `
        SELECT
          track_id AS "player_id",
          team_id,
          class AS "player_class",
          dribbles_attempted AS "total_dribbles",
          dribbles_successful AS "successful_dribbles",
          dribble_success_rate AS "success_rate",
          dribble_distance_m AS "distance_covered_m",
          progressive_dribbles,
          avg_dribble_distance_m,
          avg_dribble_duration_s,
          dribble_opponents_beaten AS "opponents_beaten"
        FROM player_match_stats
        WHERE match_id = $1 AND dribbles_attempted > 0
        ORDER BY track_id
        `,
        [matchId]
      )
    } catch (e) {
      console.warn("Could not fetch player dribbling stats (columns may not exist yet):", e)
      playerResult = { rows: [] }
    }

    // Fetch team dribbling stats
    let teamResult = { rows: [] }
    try {
      teamResult = await client.query(
        `
        SELECT
          team_id,
          total_dribbles,
          successful_dribbles,
          success_rate,
          total_distance_m,
          progressive_dribbles,
          avg_dribble_distance_m
        FROM team_dribbling_stats
        WHERE match_id = $1
        ORDER BY team_id
        `,
        [matchId]
      )
    } catch (e) {
      console.warn("Could not fetch team dribbling stats (table may not exist yet):", e)
      teamResult = { rows: [] }
    }

    return { playerStats: playerResult.rows, teamStats: teamResult.rows }
  } finally {
    await client.end()
  }
}

export async function GET(request: Request) {
  try {
    // Extract match_id from query parameters, default to 1
    const { searchParams } = new URL(request.url)
    const matchId = parseInt(searchParams.get("match_id") || "1", 10)

    // Fetch real dribbling data from TimescaleDB
    const { playerStats, teamStats } = await readDribblingFromTimescale(matchId)

    // Transform player stats into the expected format
    const playerDribblingStats: Record<number, any> = {}
    let totalDribblesMatch = 0
    let totalSuccessfulDribbles = 0
    let totalDistanceDribbled = 0
    let totalProgressiveDribbles = 0

    for (const player of playerStats) {
      const playerId = player.player_id
      
      playerDribblingStats[playerId] = {
        player_id: playerId,
        team_id: player.team_id || 0,
        total_dribbles: player.total_dribbles || 0,
        successful_dribbles: player.successful_dribbles || 0,
        success_rate: player.success_rate || 0,
        distance_covered_m: player.distance_covered_m || 0,
        progressive_dribbles: player.progressive_dribbles || 0,
        avg_dribble_distance_m: player.avg_dribble_distance_m || 0,
        avg_dribble_duration_s: player.avg_dribble_duration_s || 0,
        opponents_beaten: player.opponents_beaten || 0,
      }

      totalDribblesMatch += player.total_dribbles || 0
      totalSuccessfulDribbles += player.successful_dribbles || 0
      totalDistanceDribbled += player.distance_covered_m || 0
      totalProgressiveDribbles += player.progressive_dribbles || 0
    }

    // Transform team stats into the expected format
    const teamDribblingStats: Record<number, any> = {}
    for (const team of teamStats) {
      const teamId = team.team_id
      
      teamDribblingStats[teamId] = {
        total_dribbles: team.total_dribbles || 0,
        successful_dribbles: team.successful_dribbles || 0,
        success_rate: team.success_rate || 0,
        total_distance_m: team.total_distance_m || 0,
        progressive_dribbles: team.progressive_dribbles || 0,
        avg_dribble_distance_m: team.avg_dribble_distance_m || 0,
      }
    }

    // Calculate match-level summary
    const matchSuccessRate = totalDribblesMatch > 0
      ? Math.round((totalSuccessfulDribbles / totalDribblesMatch) * 10) / 10
      : 0

    const dribblingStats = {
      player_dribbling_stats: playerDribblingStats,
      team_dribbling_stats: teamDribblingStats,
      summary: {
        total_dribbles_match: totalDribblesMatch,
        total_successful_dribbles: totalSuccessfulDribbles,
        match_success_rate: matchSuccessRate,
        total_distance_dribbled_m: Math.round(totalDistanceDribbled * 10) / 10,
        total_progressive_dribbles: totalProgressiveDribbles,
      },
    }

    return NextResponse.json(dribblingStats)
  } catch (error) {
    console.error("Error fetching dribbling stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch dribbling statistics", details: String(error) },
      { status: 500 }
    )
  }
}
