'use client';

import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import TeamOverview from '../components/modules/TeamOverview'
import PlayerStats from '../components/modules/PlayerStats'
import UploadVideo from '../components/modules/UploadVideo'
import TeamCohesionIndex from '../components/modules/TeamCohesionIndex'
import IdealFormation from '../components/modules/IdealFormation'
import IdealSubstitution from '../components/modules/IdealSubstitution'
import FoulCardRisk from '../components/modules/FoulCardRisk'
import PlayerSpeedAnalytics from '../components/modules/PlayerSpeedAnalytics'
import PassingNetworks from '../components/modules/PassingNetworks'
import Heatmaps from '../components/modules/Heatmaps'
import VisualPrompt from '../components/modules/VisualPrompt'
import '../styles/dashboard.css'

export default function Dashboard({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentModule, setCurrentModule] = useState('team-overview')

  const modules = {
    'upload-video': <UploadVideo />,
    'team-overview': <TeamOverview />,
    'player-stats': <PlayerStats />,
    'team-cohesion': <TeamCohesionIndex />,
    'ideal-formation': <IdealFormation />,
    'ideal-substitution': <IdealSubstitution />,
    'foul-risk': <FoulCardRisk />,
    'speed-analytics': <PlayerSpeedAnalytics />,
    'passing-networks': <PassingNetworks />,
    'heatmaps': <Heatmaps />,
    'visual-prompt': <VisualPrompt />,
  }

  const handleLogout = () => {
    onLogout()
  }

  return (
    <div className="dashboard-container">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        onModuleSelect={setCurrentModule}
        currentModule={currentModule}
      />
      <div className={`dashboard-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {modules[currentModule] || modules['team-overview']}
      </div>
    </div>
  )
}
