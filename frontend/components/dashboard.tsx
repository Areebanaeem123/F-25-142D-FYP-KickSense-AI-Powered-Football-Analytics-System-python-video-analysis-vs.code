"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { IndividualPlayerStats } from "@/components/individual-player-stats"
import { DribblingStats } from "@/components/panels/dribbling-stats"
import { ShootingStats } from "@/components/panels/shooting-stats"
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard"
import { ReportPage } from "@/components/panels/report-page"
import { MatchReplay } from "@/components/panels/match-replay"
import { Login } from "@/components/auth/Login"
import { Signup } from "@/components/auth/Signup"


export function Dashboard() {
  const [activeTab, setActiveTab] = useState("match-replay")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderPanel = () => {
    switch (activeTab) {
      case "dribbling":
        return <DribblingStats />
      case "shooting":
        return <ShootingStats />
      case "match-replay":
        return <MatchReplay />
      case "substitution-alerts":
        return <AnalyticsDashboard initialTab="substitution" />
      case "generate-report":
        return <ReportPage />
      case "player-stats":
        return <IndividualPlayerStats />
      case "login":
        return <Login />
      case "signup":
        return <Signup />
      default:
        return <IndividualPlayerStats />
    }
  }

  return (
    <div className="flex h-screen bg-[#050F0C] overflow-hidden">
      <SidebarNav
        activeTab={activeTab}
        onTabChange={(id) => {
          setActiveTab(id)
          setSidebarOpen(false)
        }}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#14B871]/10 glass">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[#14B871]/10 transition-colors md:hidden text-[#9cb8a9]"
              aria-label="Toggle sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#9cb8a9]">
              <span>Dashboard</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
              <span className="text-[#e8f5ee] font-medium capitalize">
                {activeTab === "player-stats" && "Individual Player Stats"}
                {activeTab === "dribbling" && "Dribbling Effectiveness"}
                {activeTab === "shooting" && "Shooting Statistics"}
                {activeTab === "match-replay" && "Neural Match Analysis"}
                {activeTab === "upload" && "Upload Video"}
                {activeTab === "detection" && "Player Detection"}
                {activeTab === "metrics" && "Performance Metrics"}
                {activeTab === "team" && "Team Analysis"}
                {activeTab === "substitution-alerts" && "Substitution Alerts"}
                {activeTab === "generate-report" && "Match Intelligence Export"}
                {activeTab === "login" && "Member Access"}
                {activeTab === "signup" && "Join KickSense"}
              </span>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("login")}
              className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white hover:text-[#006747] transition-all"
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className="px-6 py-2.5 bg-[#006747] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-[0_5px_15px_rgba(0,103,71,0.3)] hover:bg-[#006747]/90 active:scale-95 transition-all"
            >
              Register
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" key={activeTab}>
          {renderPanel()}
        </div>
      </main>
    </div >
  )
}
