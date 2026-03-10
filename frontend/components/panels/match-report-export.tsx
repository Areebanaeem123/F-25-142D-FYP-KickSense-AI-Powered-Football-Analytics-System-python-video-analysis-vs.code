"use client"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export function MatchReportExport() {
  const generatePDF = () => {
    const doc = new jsPDF()

    // ================= TITLE =================
    doc.setFontSize(18)
    doc.text("Match Performance Analysis Report", 14, 20)

    doc.setFontSize(11)
    doc.text("Team: Green FC vs Blue United", 14, 30)
    doc.text("Date: 07 Feb 2026", 14, 36)

    // ================= MATCH STATS =================
    doc.setFontSize(14)
    doc.text("Team Statistical Summary", 14, 50)

    autoTable(doc, {
      startY: 55,
      head: [["Metric", "Value"]],
      body: [
        ["Possession", "58%"],
        ["Pass Accuracy", "86%"],
        ["Shots on Target", "9"],
        ["Total Distance Covered", "112 km"],
      ],
    })

    // ================= PLAYER STATS =================
    doc.text("Key Player Performance", 14, doc.lastAutoTable.finalY + 15)

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Player", "Max Speed", "Distance", "Pass Acc%", "Fatigue"]],
      body: [
        ["L. Martinez", "34.2 km/h", "11.2 km", "89%", "Low"],
        ["K. Silva", "31.8 km/h", "12.8 km", "92%", "Medium"],
        ["A. Torres", "33.0 km/h", "10.9 km", "85%", "High"],
      ],
    })

    // ================= NARRATIVE SUMMARY =================
    doc.text("Performance Summary", 14, doc.lastAutoTable.finalY + 15)

    const summaryText = `
The team maintained strong midfield control with 58% possession and high passing accuracy.
L. Martinez showed excellent attacking movement and sprint performance.
Fatigue levels increased in the final 20 minutes, suggesting earlier substitutions
could maintain intensity. Defensive spacing remained compact, reducing opponent
shot quality throughout the match.
    `
    doc.setFontSize(11)
    doc.text(summaryText, 14, doc.lastAutoTable.finalY + 22, { maxWidth: 180 })

    // ================= SAVE FILE =================
    doc.save("match-analysis-report.pdf")
  }

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 items-start">
      <h2 className="text-xl font-bold text-[#e8f5ee]">Export Match Analysis Report</h2>
      <p className="text-sm text-[#9cb8a9]">
        Download a detailed PDF report with performance statistics and insights.
      </p>

      <button
        onClick={generatePDF}
        className="px-5 py-2 rounded-lg bg-[#14B871] text-black font-semibold hover:opacity-90 transition"
      >
        Download PDF Report
      </button>
    </div>
  )
}
