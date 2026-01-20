'use client';

import Link from "next/link"

import { useState } from 'react'
import {
  Menu,
  X,
  LogOut,
  Home,
  Upload,
  Users,
  Grid,
  Target,
  AlertCircle,
  Zap,
  Network,
  Layers,
  Sparkles,
  Shield,
} from 'lucide-react'
import '../styles/sidebar.css'

const menuItems = [
  { id: 1, label: 'Team Overview', moduleId: 'team-overview', icon: Home },
  { id: 2, label: 'Upload Video', moduleId: 'upload-video', icon: Upload },
  { id: 3, label: 'Player Stats', moduleId: 'player-stats', icon: Users },
  { id: 4, label: 'Team Cohesion', moduleId: 'team-cohesion', icon: Shield },
  { id: 5, label: 'Ideal Formation', moduleId: 'ideal-formation', icon: Grid },
  { id: 6, label: 'Ideal Substitution', moduleId: 'ideal-substitution', icon: Target },
  { id: 7, label: 'Foul Card Risk', moduleId: 'foul-risk', icon: AlertCircle },
  { id: 8, label: 'Speed Analytics', moduleId: 'speed-analytics', icon: Zap },
  { id: 9, label: 'Passing Networks', moduleId: 'passing-networks', icon: Network },
  { id: 10, label: 'Heatmaps', moduleId: 'heatmaps', icon: Layers },
  { id: 11, label: 'Visual Prompt', moduleId: 'visual-prompt', icon: Sparkles },
]

export default function Sidebar({ isOpen, onToggle, onLogout, onModuleSelect, currentModule }) {
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (moduleId) => currentModule === moduleId

  return (
    <>
      <div className={`sidebar ${isOpen ? 'open' : 'closed'} ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">⚽</span>
            {!collapsed && <span className="logo-text">KICKSENSE</span>}
          </div>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        <div className="sidebar-menu">
          <div className="menu-section">
            {!collapsed && <h3 className="menu-title">Analytics Modules</h3>}
            <ul>
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onModuleSelect(item.moduleId)}
                      className={`menu-item ${isActive(item.moduleId) ? 'active' : ''}`}
                      title={collapsed ? item.label : ''}
                      style={{ width: '100%', textAlign: 'left' }}
                    >
                      <Icon size={20} className="menu-icon" />
                      {!collapsed && <span className="menu-label">{item.label}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="sidebar-footer">
          <button
            onClick={onLogout}
            className="logout-btn"
            title={collapsed ? 'Logout' : ''}
          >
            <LogOut size={20} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      <button className="sidebar-toggle-mobile" onClick={onToggle}>
        <Menu size={24} />
      </button>
    </>
  )
}
