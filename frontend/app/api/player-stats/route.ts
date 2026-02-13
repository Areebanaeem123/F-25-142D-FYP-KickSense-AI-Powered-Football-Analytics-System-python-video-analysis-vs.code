import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"

export async function GET() {
  try {
    // Path to the CSV file from the Python backend
    const csvPath = path.join(
      process.cwd(),
      "..",
      "video_results",
      "player_stats_advanced.csv"
    )

    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { error: "Player stats file not found" },
        { status: 404 }
      )
    }

    // Read and parse CSV
    const fileContent = fs.readFileSync(csvPath, "utf-8")
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    })

    // Convert string values to numbers
    const playerStats = records.map((record: Record<string, string>) => ({
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

    return NextResponse.json(playerStats)
  } catch (error) {
    console.error("Error reading player stats:", error)
    return NextResponse.json(
      { error: "Failed to load player statistics" },
      { status: 500 }
    )
  }
}
