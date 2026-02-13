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
    id: "player-stats",
    label: "Individual Player Stats",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 17 9 11 13 15 21 7" />
        <polyline points="14 7 21 7 21 14" />
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
