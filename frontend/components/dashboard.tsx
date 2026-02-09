"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { UploadVideoPanel } from "@/components/panels/upload-video"
import { IndividualPlayerStats } from "@/components/panels/individual-player-stats"
import { IdealFormation } from "@/components/panels/ideal-formation"
import {TeamCohesion} from "@/components/panels/team-cohesion-index"
import {IdealSubstitution} from "@/components/panels/ideal-substitution"
import {FoulCardAnalysis} from "@/components/panels/foul-card"
import {AdvancedMatchInsights} from "@/components/panels/advanced-match-insights"
import {VisualTacticalAnalysis} from "@/components/panels/visual-tactical-analysis"
import {MatchReportExport} from "@/components/panels/match-report-export"


export function Dashboard() {
  const [activeTab, setActiveTab] = useState("upload")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderPanel = () => {
    switch (activeTab) {
      case "upload":
        return <UploadVideoPanel />
      case "detection":
        return <PlayerDetectionPanel />
      case "metrics":
        return <PerformanceMetricsPanel />
      case "team":
        return <TeamAnalysisPanel />
      case "reports":
        return <ReportsAnalyticsPanel />
      case "individual-player-stats":
        return <IndividualPlayerStats />
      case "ideal-formation":
        return <IdealFormation/>
      case "team-cohesion-index":
        return <TeamCohesion/>
      case "ideal-substitution":
        return <IdealSubstitution/>
      case "foul-card":
        return <FoulCardAnalysis/>
      case "advanced-match-insights":
        return <AdvancedMatchInsights/>
      case "visual-tactical-analysis":
        return <VisualTacticalAnalysis/>
      case "match-report-export":
        return <MatchReportExport/>
      default:
        return <UploadVideoPanel />
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
              <span className="text-[#e8f5ee] font-medium capitalize">{activeTab === "upload" ? "Upload Video" : activeTab === "detection" ? "Player Detection" : activeTab === "metrics" ? "Performance Metrics" : activeTab === "team" ? "Team Analysis" : "Reports"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden sm:flex items-center gap-2 glass rounded-xl px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9cb8a9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm text-[#e8f5ee] placeholder:text-[#9cb8a9]/60 focus:outline-none w-40"
              />
            </div>

            {/* Notifications */}
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[#14B871]/10 transition-colors text-[#9cb8a9]"
              aria-label="Notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#14B871]" />
            </button>

            {/* Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14B871]/15 border border-[#14B871]/25 text-[#14B871] text-xs font-bold">
              AC
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" key={activeTab}>
          {renderPanel()}
        </div>
      </main>
    </div>
  )
}
