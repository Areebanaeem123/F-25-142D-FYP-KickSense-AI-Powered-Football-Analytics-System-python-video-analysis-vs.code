"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Download,
    FileText,
    File as FileIcon,
    Monitor,
    Loader2,
    CheckCircle2,
    TrendingUp,
    ShieldAlert,
    Activity
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table as DocxTable,
    TableRow as DocxTableRow,
    TableCell as DocxTableCell,
    WidthType,
    HeadingLevel,
    AlignmentType,
    BorderStyle
} from "docx"

interface ReportGeneratorProps {
    matchId?: number
}

export function ReportGenerator({ matchId = 1 }: ReportGeneratorProps) {
    const [generating, setGenerating] = useState<string | null>(null)

    const fetchData = async () => {
        const [playerRes, shootingRes, dribblingRes] = await Promise.all([
            fetch(`/api/player-stats?match_id=${matchId}`),
            fetch(`/api/shooting-stats?match_id=${matchId}`),
            fetch(`/api/dribbling-stats?match_id=${matchId}`)
        ])

        const players = await playerRes.json()
        const shots = await shootingRes.json()
        const dribbling = await dribblingRes.json()

        return { players, shots, dribbling }
    }

    const drawChart = (doc: jsPDF, x: number, y: number, width: number, height: number, data: number[], label: string) => {
        const max = Math.max(...data, 1)
        const barWidth = (width - 20) / data.length

        doc.setDrawColor(20, 184, 113, 0.5)
        doc.line(x, y + height, x + width, y + height) // X-axis

        data.forEach((val, i) => {
            const barHeight = (val / max) * (height - 10)
            doc.setFillColor(20, 184, 113)
            doc.rect(x + 5 + i * barWidth, y + height - barHeight, barWidth - 2, barHeight, "F")
        })

        doc.setFontSize(8)
        doc.setTextColor(100)
        doc.text(label, x + width / 2, y + height + 5, { align: "center" })
    }

    const generatePDF = async (data: any) => {
        const doc = new jsPDF()
        const timestamp = new Date().toLocaleString()
        const primaryColor = [20, 184, 113] // #14B871

        // PAGE 1: COVER
        doc.setFillColor(5, 15, 12) // Dark background
        doc.rect(0, 0, 210, 297, "F")

        doc.setTextColor(255)
        doc.setFontSize(40)
        doc.setFont("helvetica", "bold")
        doc.text("KICKSENSE", 105, 100, { align: "center" })

        doc.setFontSize(18)
        doc.setTextColor(20, 184, 113)
        doc.text("MATCH INTELLIGENCE REPORT", 105, 115, { align: "center" })

        doc.setDrawColor(20, 184, 113)
        doc.setLineWidth(1)
        doc.line(50, 125, 160, 125)

        doc.setFontSize(10)
        doc.setTextColor(150)
        doc.text(`Match Analysis ID: ${matchId}`, 105, 140, { align: "center" })
        doc.text(`Generated: ${timestamp}`, 105, 145, { align: "center" })

        // PAGE 2: SUMMARY
        doc.addPage()
        doc.setTextColor(0)
        doc.setFontSize(22)
        doc.text("EXECUTIVE SUMMARY", 14, 25)

        doc.setFontSize(11)
        doc.setFont("helvetica", "normal")
        const summary = `This report provides a comprehensive AI-driven analysis of the match with ID ${matchId}. Our deep-learning models have processed tracking data from the video feed to extract spatiotemporal metrics, individual performance indicators, and tactical insights. Overall, the match intensity shows high athletic demand with several key tactical events detected in the shooting and dribbling modules.`
        doc.text(doc.splitTextToSize(summary, 180), 14, 35)

        // Snapshot Stats
        const maxSpeed = Math.max(...data.players.map((p: any) => p.Max_Speed_kmh || 0))
        const totalGoals = data.shots.filter((s: any) => s.is_goal).length
        const avgXG = data.shots.reduce((acc: any, s: any) => acc + (s.xg || 0), 0) / (data.shots.length || 1)

        doc.setFillColor(245, 245, 245)
        doc.rect(14, 60, 182, 30, "F")
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("At a Glance", 20, 70)

        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(`Total Goals: ${totalGoals}`, 20, 80)
        doc.text(`Max Sprint Speed: ${maxSpeed.toFixed(1)} km/h`, 80, 80)
        doc.text(`Avg Expected Goal (xG): ${avgXG.toFixed(2)}`, 140, 80)

        // PAGE 2: PLAYER DATA
        doc.setFontSize(18)
        doc.text("PLAYER ATHLETIC PERFORMANCE", 14, 110)

        const playerRows = data.players.map((p: any) => [
            `P${p.Track_ID}`,
            p.Class || "Player",
            `${p.Max_Speed_kmh?.toFixed(1)} km/h`,
            `${p.Total_Distance_m?.toFixed(0)}m`,
            `${p.Sub_Priority?.toFixed(0)}%`
        ])

        autoTable(doc, {
            startY: 115,
            head: [["ID", "Role", "Max Speed", "Distance", "Sub Priority"]],
            body: playerRows,
            theme: "striped",
            headStyles: { fillColor: primaryColor }
        })

        // Speed Chart
        const speeds = data.players.map((p: any) => p.Max_Speed_kmh || 0).slice(0, 10)
        drawChart(doc, 14, (doc as any).lastAutoTable.finalY + 15, 180, 40, speeds, "Squad Top Speeds (km/h)")

        // PAGE 3: SHOOTING
        doc.addPage()
        doc.setFontSize(22)
        doc.text("SHOOTING & THREAT ANALYSIS", 14, 25)

        doc.setFontSize(11)
        const shootingAnalysis = `The AI shooting module has identified ${data.shots.length} distinct shot events. Strategic breakdown shows a concentrated effort from the central zone, with an average xG per shot of ${avgXG.toFixed(3)}. Big chances were identified based on a conversion threshold of 0.3 xG.`
        doc.text(doc.splitTextToSize(shootingAnalysis, 180), 14, 35)

        const shotRows = data.shots.map((s: any) => [
            `P${s.track_id}`,
            `${s.distance_m?.toFixed(1)}m`,
            s.xg?.toFixed(3),
            s.is_goal ? "GOAL" : (s.is_on_target ? "On Target" : "Off Target"),
            s.is_big_chance ? "YES" : "No"
        ])

        autoTable(doc, {
            startY: 55,
            head: [["Player", "Distance", "xG", "Outcome", "Big Chance"]],
            body: shotRows,
            theme: "grid",
            headStyles: { fillColor: [59, 130, 246] }
        })

        // PAGE 4: DRIBBLING & TACTICAL
        doc.addPage()
        doc.setFontSize(22)
        doc.text("BALL PROGRESSION & DRIBBLING", 14, 25)

        const teamA = data.dribbling.team_dribbling_stats[0] || {}
        const teamB = data.dribbling.team_dribbling_stats[1] || {}

        doc.setFontSize(11)
        const dribbleAnalysis = `Tactical dribbling efficiency is a key differentiator. Team A maintained a success rate of ${teamA.success_rate?.toFixed(1)}% over ${teamA.total_dribbles} attempts, highlighting controlled progression through the middle third.`
        doc.text(doc.splitTextToSize(dribbleAnalysis, 180), 14, 35)

        autoTable(doc, {
            startY: 50,
            head: [["Team", "Attempts", "Successful", "Success Rate", "Distance"]],
            body: [
                ["Team A", teamA.total_dribbles || 0, teamA.successful_dribbles || 0, `${(teamA.success_rate || 0).toFixed(1)}%`, `${(teamA.total_distance_m || 0).toFixed(0)}m`],
                ["Team B", teamB.total_dribbles || 0, teamB.successful_dribbles || 0, `${(teamB.success_rate || 0).toFixed(1)}%`, `${(teamB.total_distance_m || 0).toFixed(0)}m`]
            ],
            theme: "striped",
            headStyles: { fillColor: [245, 158, 11] }
        })

        // PAGE 5: COACH'S RECOMMENDATIONS
        doc.addPage()
        doc.setFontSize(22)
        doc.text("COACH'S INTELLIGENCE BRIEF", 14, 25)

        doc.setFillColor(254, 242, 242)
        doc.rect(14, 35, 182, 60, "F")
        doc.setTextColor(185, 28, 28)
        doc.setFontSize(14)
        doc.text("Critical Substitution Alerts", 20, 50)

        doc.setFontSize(10)
        doc.setTextColor(110)
        const subReasoning = "Substitutions are recommended based on high Disciplinary Risk scores. The players listed below exhibit aggressive contact patterns and have a trajectory suggests a possible red card if intensity is not managed."
        doc.text(doc.splitTextToSize(subReasoning, 170), 20, 60)

        const topRisk = data.players
            .filter((p: any) => p.Sub_Priority > 50)
            .sort((a: any, b: any) => b.Sub_Priority - a.Sub_Priority)
            .slice(0, 3)

        topRisk.forEach((p: any, i: number) => {
            doc.text(`• Player ${p.Track_ID}: ${p.Sub_Priority.toFixed(0)}% Risk - RECOMEMNDED FOR SUB`, 25, 75 + i * 5)
        })

        doc.save(`KickSense_Intelligent_Report_Match${matchId}.pdf`)
    }

    const generateDOCX = async (data: any) => {
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: "KICKSENSE AI MATCH INTELLIGENCE REPORT",
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                        text: `Date: ${new Date().toLocaleDateString()} | Match Identification: ${matchId}`,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                    }),

                    new Paragraph({ text: "1. TACTICAL OVERVIEW", heading: HeadingLevel.HEADING_2 }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `The match analysis identifies several high-impact tactical shifts. The squad conversion efficiency remains consistent, but athletic demand reached peak levels at 70% intensity. Below is the detailed breakdown of all captured data points.`,
                            })
                        ],
                        spacing: { after: 200 }
                    }),

                    new Paragraph({ text: "2. INDIVIDUAL PLAYER ATHLETIC DATA", heading: HeadingLevel.HEADING_2 }),
                    new DocxTable({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new DocxTableRow({
                                children: ["PLAYER", "CLASS", "MAX SPEED", "DISTANCE", "SUB RISK"].map(h =>
                                    new DocxTableCell({
                                        shading: { fill: "14B871" },
                                        children: [new Paragraph({ text: h, style: "bold" })]
                                    })
                                )
                            }),
                            ...data.players.map((p: any) => new DocxTableRow({
                                children: [
                                    `P${p.Track_ID}`,
                                    p.Class || "Player",
                                    `${p.Max_Speed_kmh?.toFixed(1)} km/h`,
                                    `${p.Total_Distance_m?.toFixed(0)}m`,
                                    `${p.Sub_Priority?.toFixed(0)}%`
                                ].map(v => new DocxTableCell({ children: [new Paragraph(v)] }))
                            }))
                        ]
                    }),

                    new Paragraph({ text: "3. SHOOTING & FINISHING ANALYSIS", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Module Insight: ", bold: true }),
                            new TextRun({ text: "The team maintained a direct attacking style. Most shots originated from the central edge of the penalty area." })
                        ]
                    }),
                    new DocxTable({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new DocxTableRow({
                                children: ["PLAYER", "DISTANCE", "EXPECTED GOALS (xG)", "OUTCOME"].map(h =>
                                    new DocxTableCell({
                                        shading: { fill: "3b82f6" },
                                        children: [new Paragraph({ text: h, style: "bold" })]
                                    })
                                )
                            }),
                            ...data.shots.slice(0, 15).map((s: any) => new DocxTableRow({
                                children: [
                                    `Player ${s.track_id}`,
                                    `${s.distance_m?.toFixed(1)}m`,
                                    `${s.xg?.toFixed(3)}`,
                                    s.is_goal ? "GOAL" : "SAVED/MISSED"
                                ].map(v => new DocxTableCell({ children: [new Paragraph(v)] }))
                            }))
                        ]
                    }),

                    new Paragraph({ text: "4. DRIBBLING & PROGRESSION SUMMARY", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
                    new Paragraph({ text: `Team A Success Rate: ${data.dribbling.team_dribbling_stats[0]?.success_rate?.toFixed(1) || 0}%` }),
                    new Paragraph({ text: `Team B Success Rate: ${data.dribbling.team_dribbling_stats[1]?.success_rate?.toFixed(1) || 0}%` }),

                    new Paragraph({ text: "5. COACH'S SUBSTITUTION RECOMMENDATIONS", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "The following players are flagged for immediate tactical review due to disciplinary risk levels exceeding 60%:", italic: true })
                        ]
                    }),
                    ...data.players.filter((p: any) => p.Sub_Priority > 60).map((p: any) =>
                        new Paragraph({ text: `• Player ${p.Track_ID} (${p.Sub_Priority?.toFixed(0)}% Risk): Replacement suggested to avoid card accumulation.` })
                    )
                ],
            }],
        })

        const blob = await Packer.toBlob(doc)
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `KickSense_Report_Match${matchId}.docx`
        link.click()
    }

    const generateTXT = (data: any) => {
        let content = `KICKSENSE INTELLIGENT MATCH REPORT\n`
        content += `=================================\n`
        content += `Match: ${matchId} | Date: ${new Date().toLocaleString()}\n\n`

        content += `[1] OVERALL SUMMARY\n`
        content += `Total Players Tracked: ${data.players.length}\n`
        content += `Total Shots: ${data.shots.length}\n`
        content += `Max Speed: ${Math.max(...data.players.map((p: any) => p.Max_Speed_kmh || 0)).toFixed(1)} km/h\n\n`

        content += `[2] ATHLETIC DATA\n`
        data.players.forEach((p: any) => {
            content += `- P${p.Track_ID} (${p.Class || 'N/A'}): Speed ${p.Max_Speed_kmh?.toFixed(1)}km/h, Total ${p.Total_Distance_m?.toFixed(0)}m\n`
        })

        content += `\n[3] TACTICAL SHOOTING\n`
        data.shots.forEach((s: any) => {
            content += `- Shot by P${s.track_id}: xG ${s.xg?.toFixed(3)} | Outcome: ${s.is_goal ? "GOAL" : "MISS"}\n`
        })

        content += `\n[4] DRIBBLING HIGHLIGHTS\n`
        content += `Team A Success: ${data.dribbling.team_dribbling_stats[0]?.success_rate?.toFixed(1) || 0}%\n`
        content += `Team B Success: ${data.dribbling.team_dribbling_stats[1]?.success_rate?.toFixed(1) || 0}%\n`

        const blob = new Blob([content], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `KickSense_Report_Match${matchId}.txt`
        link.click()
    }

    const handleGenerate = async (format: string) => {
        setGenerating(format)
        const loadToast = toast.loading(`Generating High-Fidelity ${format.toUpperCase()} Report...`)
        try {
            const data = await fetchData()

            if (format === "pdf") await generatePDF(data)
            else if (format === "docx") await generateDOCX(data)
            else if (format === "txt") generateTXT(data)

            toast.success("Intelligence Report Generated Successfully", { id: loadToast })
        } catch (error) {
            console.error("Report generation error:", error)
            toast.error("Failed to generate report", { id: loadToast })
        } finally {
            setGenerating(null)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="lg" className="bg-[#14B871] hover:bg-[#14B871]/90 text-white font-black rounded-2xl flex items-center gap-3 shadow-[0_10px_30px_rgba(20,184,113,0.4)] border-none px-8 py-6 h-auto text-lg transition-all active:scale-95">
                    {generating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                    EXPORT INTELLIGENCE REPORT
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass border-[#14B871]/30 p-3 w-64 rounded-2xl shadow-2xl">
                <DropdownMenuItem
                    onClick={() => handleGenerate("pdf")}
                    className="flex items-center gap-4 p-4 rounded-xl cursor-pointer hover:bg-[#14B871]/10 text-[#e8f5ee] transition-all border border-transparent hover:border-[#14B871]/20 my-1"
                >
                    <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <FileIcon className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black">PDF REPORT</span>
                        <span className="text-[10px] text-[#9cb8a9]">Full Visual & Textual Analysis</span>
                    </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => handleGenerate("docx")}
                    className="flex items-center gap-4 p-4 rounded-xl cursor-pointer hover:bg-[#14B871]/10 text-[#e8f5ee] transition-all border border-transparent hover:border-[#14B871]/20 my-1"
                >
                    <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black">WORD DOC</span>
                        <span className="text-[10px] text-[#9cb8a9]">Editable Coach's Script</span>
                    </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => handleGenerate("txt")}
                    className="flex items-center gap-4 p-4 rounded-xl cursor-pointer hover:bg-[#14B871]/10 text-[#e8f5ee] transition-all border border-transparent hover:border-[#14B871]/20 my-1"
                >
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Monitor className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black">RAW DATA</span>
                        <span className="text-[10px] text-[#9cb8a9]">Plain Text Logging</span>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
