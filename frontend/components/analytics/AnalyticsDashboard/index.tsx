"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShotMap } from "./ShotMap"
import { XGTimeline } from "./XGTimeline"
import { RiskRadar } from "./RiskRadar"
import { SubPriorityList } from "./SubPriorityList"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, UserMinus, ShieldAlert, TrendingUp, Activity, AlertTriangle } from "lucide-react"

export function AnalyticsDashboard({ initialTab = "shooting" }: { initialTab?: string }) {
    const [activeTab, setActiveTab] = useState(initialTab)

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter">Squad Intelligence</h1>
                    <p className="text-white/40 text-sm font-bold tracking-widest">Advanced AI Match Analytics</p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 border-[#006747]/20 bg-[#006747]/5">
                        <Activity className="w-4 h-4 text-[#006747] animate-pulse" />
                        <span className="text-[10px] font-black text-white tracking-widest">Live Analysis Active</span>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="shooting" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="bg-black border border-white/10 p-1.5 mb-8 shadow-2xl rounded-2xl">
                    <TabsTrigger value="shooting" className="px-8 py-3 data-[state=active]:bg-[#006747] data-[state=active]:text-white transition-all rounded-xl font-black text-[10px] tracking-widest border border-transparent data-[state=active]:border-white/10">
                        <Target className="w-4 h-4 mr-2" /> Shooting
                    </TabsTrigger>
                    <TabsTrigger value="substitution" className="px-8 py-3 data-[state=active]:bg-red-700 data-[state=active]:text-white transition-all rounded-xl font-black text-[10px] tracking-widest border border-transparent data-[state=active]:border-white/10">
                        <UserMinus className="w-4 h-4 mr-2" /> Substitutions
                    </TabsTrigger>
                    <TabsTrigger value="disciplinary" className="px-8 py-3 data-[state=active]:bg-[#006747] data-[state=active]:text-white transition-all rounded-xl font-black text-[10px] tracking-widest border border-transparent data-[state=active]:border-white/10">
                        <ShieldAlert className="w-4 h-4 mr-2" /> Intensity
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="shooting" className="space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 space-y-6">
                            <ShotMap />
                            <XGTimeline />
                        </div>
                        <div className="space-y-6">
                            <Card className="glass border-white/5 h-full bg-black/40">
                                <CardHeader className="border-b border-white/5 pb-4">
                                    <CardTitle className="text-xs font-black text-white tracking-widest">Shooting Intelligence</CardTitle>
                                    <CardDescription className="text-[10px] font-bold text-white/30 tracking-tighter">AI-detected precision trends</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="p-4 rounded-2xl bg-[#006747]/5 border border-[#006747]/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="w-4 h-4 text-[#006747]" />
                                            <span className="text-[10px] font-black text-white tracking-widest">High xG Conversion</span>
                                        </div>
                                        <p className="text-[10px] text-white/50 leading-relaxed font-medium">
                                            The squad is creating 1.4x higher quality chances this half.
                                            Efficiency inside the 18-yard box is optimized by 12%.
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                            <span className="text-[10px] font-black text-white tracking-widest">Awaiting Velocity Data</span>
                                        </div>
                                        <p className="text-[10px] text-white/50 leading-relaxed font-medium">
                                            AI is currently seeking high-velocity shot events (&gt;8m/s). Use the intelligence filters above or check back after the next pipeline sync.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="substitution" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SubPriorityList />
                        <Card className="glass border-red-500/20 bg-red-500/[0.02]">
                            <CardHeader className="border-b border-red-500/10 pb-4">
                                <CardTitle className="text-xs font-black text-white tracking-widest">Strategic substitution logic</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <p className="text-[10px] text-white/40 font-bold tracking-tighter leading-relaxed">
                                    Recommendations are prioritized based on **Disciplinary Risk Intelligence**. Players flagged in red have a high (&gt;70%) likelihood of dismissal.
                                </p>
                                <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20 shadow-2xl">
                                    <span className="text-[10px] font-black text-red-500 tracking-widest block mb-3">Neural Analysis Parameters</span>
                                    <ul className="text-[10px] text-white/60 font-medium list-disc list-inside space-y-2 tracking-tighter">
                                        <li>Impact Intensity Peak &gt; 0.8</li>
                                        <li>Yellow Likelihood Projection &gt; 0.6</li>
                                        <li>Recent Foul Frequency Burst</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="disciplinary" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RiskRadar />
                        <Card className="glass border-white/5">
                            <CardHeader className="border-b border-white/5 pb-4">
                                <CardTitle className="text-xs font-black text-white tracking-widest">Spatiotemporal Foul Intensity</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center justify-center h-64 border border-dashed border-white/10 rounded-3xl m-6 bg-black/20">
                                <div className="text-center">
                                    <div className="w-10 h-10 border-2 border-[#006747] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-[10px] text-white/30 font-bold tracking-[0.2em] italic">
                                        Aggregating heatmap data...<br />
                                        <span className="text-[8px] opacity-50 mt-1 block">Requires 10+ Neural Detection Events</span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
