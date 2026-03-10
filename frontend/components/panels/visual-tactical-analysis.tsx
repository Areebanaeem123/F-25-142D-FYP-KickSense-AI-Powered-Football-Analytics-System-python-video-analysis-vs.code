"use client"

export function VisualTacticalAnalysis() {
  // 🔥 Player Movement Heatmap (dummy intensity zones)
  const heatmapSpots = [
    { x: 20, y: 40, intensity: 80 },
    { x: 35, y: 65, intensity: 60 },
    { x: 55, y: 50, intensity: 90 },
    { x: 70, y: 30, intensity: 75 },
    { x: 60, y: 75, intensity: 55 },
  ]

  // 🧩 Zone Coverage (pitch divided into tactical zones)
  const zones = [
    { name: "Left Wing", x: "10%", y: "30%", coverage: 72 },
    { name: "Center Mid", x: "45%", y: "50%", coverage: 88 },
    { name: "Right Wing", x: "75%", y: "35%", coverage: 64 },
    { name: "Defensive Third", x: "30%", y: "75%", coverage: 81 },
    { name: "Attacking Third", x: "65%", y: "25%", coverage: 77 },
  ]

  // 📐 Tactical Positioning Diagram (average formation shape)
  const avgPositions = [
    { role: "GK", x: "10%", y: "50%" },
    { role: "LB", x: "25%", y: "20%" },
    { role: "CB", x: "25%", y: "45%" },
    { role: "CB", x: "25%", y: "70%" },
    { role: "RB", x: "25%", y: "85%" },
    { role: "CM", x: "45%", y: "35%" },
    { role: "CM", x: "45%", y: "65%" },
    { role: "LW", x: "70%", y: "20%" },
    { role: "ST", x: "75%", y: "50%" },
    { role: "RW", x: "70%", y: "80%" },
  ]

  return (
    <div className="flex flex-col gap-10 animate-fade-in">

      {/* ================= HEATMAP ================= */}
      <div>
        <h2 className="text-xl font-bold text-[#e8f5ee]">Player Movement Heatmap</h2>
        <div className="relative mt-4 h-[320px] rounded-2xl glass-card bg-[#0d4a35] p-6 overflow-hidden">
          {heatmapSpots.map((spot, i) => (
            <div
              key={i}
              className="absolute rounded-full blur-xl"
              style={{
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                width: `${spot.intensity}px`,
                height: `${spot.intensity}px`,
                backgroundColor: `rgba(255,0,0,${spot.intensity / 120})`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
      </div>

      {/* ================= ZONE COVERAGE ================= */}
      <div>
        <h2 className="text-xl font-bold text-[#e8f5ee]">Zone Coverage Analysis</h2>
        <div className="relative mt-4 h-[320px] rounded-2xl glass-card bg-[#0d4a35] p-6 overflow-hidden">
          {zones.map((zone, i) => (
            <div
              key={i}
              className="absolute text-center"
              style={{ left: zone.x, top: zone.y, transform: "translate(-50%, -50%)" }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: `rgba(20,184,113,${zone.coverage / 100})`,
                  color: "#04130f",
                }}
              >
                {zone.coverage}%
              </div>
              <p className="text-[10px] text-[#9cb8a9] mt-1">{zone.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ================= TACTICAL POSITIONING ================= */}
      <div>
        <h2 className="text-xl font-bold text-[#e8f5ee]">Tactical Positioning Diagram</h2>
        <div className="relative mt-4 h-[320px] rounded-2xl glass-card bg-[#0d4a35] p-6 overflow-hidden">
          {avgPositions.map((p, i) => (
            <div
              key={i}
              className="absolute w-10 h-10 rounded-full bg-[#14B871] text-black flex items-center justify-center text-xs font-bold shadow-lg"
              style={{ left: p.x, top: p.y, transform: "translate(-50%, -50%)" }}
            >
              {p.role}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
