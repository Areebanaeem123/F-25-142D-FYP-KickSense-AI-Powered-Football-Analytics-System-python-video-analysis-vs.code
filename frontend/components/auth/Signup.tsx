"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Lock, CheckCircle2 } from "lucide-react"

export function Signup() {
    return (
        <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
            <Card className="w-full max-w-md bg-black border-white/5 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#006747]" />
                <CardHeader className="space-y-1 pb-8">
                    <CardTitle className="text-3xl font-black text-white tracking-tighter">Join KickSense</CardTitle>
                    <CardDescription className="text-white/40">
                        Create an account to start your AI-powered match analysis journey.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white tracking-widest pl-1" htmlFor="name">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-3 h-4 w-4 text-white/20 group-focus-within:text-[#006747] transition-colors" />
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    className="bg-white/5 border-white/10 text-white pl-10 h-11 focus:border-[#006747]/50 transition-all rounded-xl"
                                    type="text"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white tracking-widest pl-1" htmlFor="email">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-white/20 group-focus-within:text-[#006747] transition-colors" />
                                <Input
                                    id="email"
                                    placeholder="name@example.com"
                                    className="bg-white/5 border-white/10 text-white pl-10 h-11 focus:border-[#006747]/50 transition-all rounded-xl"
                                    type="email"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-white tracking-widest pl-1" htmlFor="password">Create Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-white/20 group-focus-within:text-[#006747] transition-colors" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-white/5 border-white/10 text-white pl-10 h-11 focus:border-[#006747]/50 transition-all rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                    <Button className="w-full bg-[#006747] hover:bg-[#006747]/90 text-white font-black tracking-widest h-12 rounded-xl shadow-[0_10px_30px_rgba(0,103,71,0.3)] transition-all">
                        Create Account <CheckCircle2 className="ml-2 w-4 h-4" />
                    </Button>
                    <div className="text-center">
                        <p className="text-xs text-white/40">
                            Already have an account? <span className="text-[#006747] font-bold hover:underline cursor-pointer">Login Now</span>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
