import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"

export const runtime = "nodejs"

async function readFromTimescale(matchId: number) {
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
    const result = await client.query(
      `
      SELECT
        track_id AS "Track_ID",
        class AS "Class",
        max_speed_kmh AS "Max_Speed_kmh",
        avg_speed_kmh AS "Avg_Speed_kmh",
        total_distance_m AS "Total_Distance_m",
        foul_risk AS "Foul_Risk",
        yellow_likelihood AS "Yellow_Likelihood",
        red_likelihood AS "Red_Likelihood",
        card_prediction AS "Card_Prediction",
        contact_events AS "Contact_Events"
      FROM player_match_stats
      WHERE match_id = $1
      ORDER BY track_id
      `,
      [matchId]
    )
    return result.rows
  } finally {
    await client.end()
  }
}

function readFromCsv() {
  const csvPath = path.join(
    process.cwd(),
    "..",
    "video_results",
    "player_stats_advanced.csv"
  )

  if (!fs.existsSync(csvPath)) {
    return null
  }

  const fileContent = fs.readFileSync(csvPath, "utf-8")
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  }) as Record<string, string>[]

  return records.map((record: Record<string, string>) => ({
    Track_ID: parseInt(record.Track_ID),
    Class: record.Class,
    Max_Speed_kmh: parseFloat(record.Max_Speed_kmh),
    Avg_Speed_kmh: parseFloat(record.Avg_Speed_kmh),
    Total_Distance_m: parseFloat(record.Total_Distance_m),
    Foul_Risk: record.Foul_Risk ? parseFloat(record.Foul_Risk) : undefined,
    Yellow_Likelihood: record.Yellow_Likelihood ? parseFloat(record.Yellow_Likelihood) : undefined,
    Red_Likelihood: record.Red_Likelihood ? parseFloat(record.Red_Likelihood) : undefined,
    Card_Prediction: record.Card_Prediction || undefined,
    Contact_Events: record.Contact_Events ? parseInt(record.Contact_Events) : undefined,
  }))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const matchId = Number(searchParams.get("match_id") || 1)

  try {
    // Primary source: TimescaleDB
    const dbRows = await readFromTimescale(matchId)
    if (dbRows.length > 0) {
      return NextResponse.json(dbRows)
    }
  } catch (error) {
    console.warn("TimescaleDB read failed, falling back to CSV:", error)
  }

  try {
    // Fallback source: CSV (kept for quick validation)
    const csvRows = readFromCsv()
    if (csvRows) {
      return NextResponse.json(csvRows)
    }

    return NextResponse.json(
      { error: "No data found in TimescaleDB or CSV" },
      { status: 404 }
    )
  } catch (error) {
    console.error("Error loading player stats:", error)
    return NextResponse.json(
      { error: "Failed to load player statistics" },
      { status: 500 }
    )
  }
}
