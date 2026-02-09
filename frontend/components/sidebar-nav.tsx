"use client"

import React from "react"

import { cn } from "@/lib/utils"

type NavItem = {
  id: string
  label: string
  icon: React.ReactNode
}
const navItems: NavItem[] = [
  {
    id: "upload",
    label: "Upload Video",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    id: "individual-player-stats",
    label: "Individual Player Stats",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
      </svg>
    ),
  },
  {
    id: "ideal-formation",
    label: "Ideal Formation",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="6" cy="6" r="2" />
        <circle cx="18" cy="6" r="2" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="6" y1="8" x2="6" y2="16" />
        <line x1="18" y1="8" x2="18" y2="16" />
      </svg>
    ),
  },
  {
    id: "team-cohesion-index",
    label: "Team Cohesion Index",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="8" cy="12" r="2" />
        <circle cx="16" cy="12" r="2" />
        <circle cx="12" cy="6" r="2" />
        <circle cx="12" cy="18" r="2" />
        <line x1="10" y1="12" x2="14" y2="12" />
        <line x1="12" y1="8" x2="12" y2="16" />
      </svg>
    ),
  },
  {
    id: "ideal-substitution",
    label: "Ideal Substitution Recom",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 3 21 3 21 8" />
        <line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="8 21 3 21 3 16" />
      </svg>
    ),
  },
  {
    id: "foul-card",
    label: "Foul Card Analysis",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="3" width="12" height="18" rx="2" />
        <line x1="6" y1="9" x2="18" y2="9" />
      </svg>
    ),
  },
  {
    id: "advanced-match-insights",
    label: "Advanced Insights",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 17 9 11 13 15 21 7" />
        <polyline points="14 7 21 7 21 14" />
      </svg>
    ),
  },
  {
    id: "visual-tactical-analysis",
    label: "Tactical Analysis",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <line x1="9" y1="12" x2="15" y2="12" />
      </svg>
    ),
  },
  {
    id: "visual-prompt",
    label: "Visual Prompt",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a7 7 0 0 0-7 7c0 3 2 5 2 5h10s2-2 2-5a7 7 0 0 0-7-7z" />
        <line x1="12" y1="22" x2="12" y2="14" />
      </svg>
    ),
  },
  {
    id: "match-report-export",
    label: "Export Pdf",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <polyline points="9 15 12 18 15 15" />
      </svg>
    ),
  },
]


export function SidebarNav({
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
}: {
  activeTab: string
  onTabChange: (id: string) => void
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-[#050F0C]/60 md:hidden"
          onClick={onToggle}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-72 flex-col glass-strong transition-transform duration-300 md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-[#14B871]/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14B871]/15 border border-[#14B871]/25">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14B871" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#e8f5ee] tracking-tight">KickSense</h2>
            <p className="text-[10px] font-medium text-[#14B871] tracking-widest uppercase">Analytics</p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4" aria-label="Dashboard navigation">
          <ul className="flex flex-col gap-1">
            {navItems.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "animate-slide-in-left group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    activeTab === item.id
                      ? "bg-[#14B871]/15 text-[#14B871] border border-[#14B871]/20"
                      : "text-[#9cb8a9] hover:bg-[#14B871]/8 hover:text-[#c0ddd0] border border-transparent"
                  )}
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <span
                    className={cn(
                      "flex-shrink-0 transition-all duration-200",
                      activeTab === item.id && item.id === "upload" && "animate-pulse-icon"
                    )}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-[#14B871]/10 px-6 py-4">
          <div className="glass rounded-xl px-4 py-3">
            <p className="text-xs font-medium text-[#14B871]">Pro Version</p>
            <p className="mt-0.5 text-[10px] text-[#9cb8a9]">Unlock advanced AI features</p>
          </div>
        </div>
      </aside>
    </>
  )
}
