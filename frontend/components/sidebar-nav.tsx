"use client"

import React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

type NavItem = {
  id: string
  label: string
  icon: React.ReactNode
}
const navItems: NavItem[] = [
  {
    id: "match-replay",
    label: "AI Match Replay",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <polygon points="10 8 10 12 14 10 10 8" />
      </svg>
    ),
  },
  {
    id: "player-stats",
    label: "Individual Player Stats",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 17 9 11 13 15 21 7" />
        <polyline points="14 7 21 7 21 14" />
      </svg>
    ),
  },
  {
    id: "dribbling",
    label: "Dribbling Effectiveness",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
        <path d="M8 12a4 4 0 0 1 8 0" />
      </svg>
    ),
  },
  {
    id: "passing",
    label: "Passing Accuracy",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
        <circle cx="5" cy="12" r="2" />
      </svg>
    ),
  },
  {
    id: "shooting",
    label: "Shooting Statistics",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="m16 10-4 4-4-4" />
        <path d="M12 2v10" />
      </svg>
    ),
  },
  {
    id: "substitution-alerts",
    label: "Substitution Alerts",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="m17 8 5 5" />
        <path d="m22 8-5 5" />
      </svg>
    ),
  },
  {
    id: "team-formation",
    label: "Team Formation",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "generate-report",
    label: "Generate Report",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
]


export function SidebarNav({
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
  onLogoClick,
}: {
  activeTab: string
  onTabChange: (id: string) => void
  isOpen: boolean
  onToggle: () => void
  onLogoClick: () => void
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
          "fixed left-0 top-0 z-40 flex h-screen w-72 flex-col bg-[#040a08] border-r border-[#14B871]/10 transition-transform duration-300 md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <button
          onClick={onLogoClick}
          className="flex flex-col items-center gap-2 px-6 py-10 border-b border-white/5 hover:bg-white/5 transition-all group w-full text-left"
        >
          <div className="relative h-16 w-full max-w-[200px] overflow-hidden group-hover:scale-105 transition-transform duration-500">
            <Image
              src="/logo.png"
              alt="KickSense Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <p className="text-xs font-bold text-[#14B871] tracking-[0.4em] uppercase opacity-70 group-hover:opacity-100 transition-opacity">
            Intelligence
          </p>
        </button>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4" aria-label="Dashboard navigation">
          <ul className="flex flex-col gap-1">
            {navItems.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "animate-slide-in-left group flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-base font-bold tracking-wider transition-all duration-300",
                    activeTab === item.id
                      ? "bg-[#006747] text-white shadow-[0_10px_20px_rgba(0,103,71,0.2)]"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
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
            <p className="text-sm font-medium text-[#14B871]">Pro Version</p>
            <p className="mt-0.5 text-xs text-[#9cb8a9]">Unlock advanced AI features</p>
          </div>
        </div>
      </aside>
    </>
  )
}
