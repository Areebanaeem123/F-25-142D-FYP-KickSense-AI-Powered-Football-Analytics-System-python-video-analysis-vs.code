"use client"

import { ReportGenerator } from "@/components/analytics/AnalyticsDashboard/ReportGenerator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileDown, ShieldCheck, Zap, BarChart3 } from "lucide-react"

export function ReportPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-[#e8f5ee] tracking-tighter uppercase">Match Intelligence Export</h1>
                <p className="text-[#9cb8a9] text-sm font-medium italic">Finalize analysis and generate secure, high-fidelity match reports for coaching staff.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 glass border-[#14B871]/20 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <FileDown className="w-48 h-48 text-[#14B871]" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-2xl font-bold text-[#e8f5ee]">Generate Final Report</CardTitle>
                        <CardDescription className="text-[#9cb8a9]">
                            Select your preferred format to compile all match metrics, AI insights, and substitution recommendations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#0D3B2B]/30 border border-[#14B871]/10">
                                <div className="h-12 w-12 rounded-xl bg-[#14B871]/20 flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-[#14B871]" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#e8f5ee]">AI Contextualization Active</p>
                                    <p className="text-[10px] text-[#9cb8a9]">Your report will include automatically generated xG trends and player risk scoring.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-xs font-bold text-[#e8f5ee] uppercase tracking-widest px-1">Choose Export Format</p>
                                <div className="flex flex-wrap gap-4">
                                    <ReportGenerator matchId={1} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="glass border-blue-500/20">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold text-[#e8f5ee] flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-blue-400" /> Security & Compliance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[11px] text-[#9cb8a9] leading-relaxed">
                                All generated reports are encrypted and comply with standard sports data privacy regulations. Ensure physical copies are stored securely.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="glass border-[#14B871]/20">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold text-[#e8f5ee] flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-[#14B871]" /> Included Analytics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-[10px] text-[#9cb8a9] space-y-2">
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-[#14B871]" />
                                    Player Speed & Spatiotemporal Data
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-[#14B871]" />
                                    Advanced Shooting Metrics (xG)
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-[#14B871]" />
                                    Dribbling Effectiveness Heatmaps
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-[#14B871]" />
                                    Substitution Priority Alerts
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
