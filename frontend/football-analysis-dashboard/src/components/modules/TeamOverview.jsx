import { TrendingUp, Users, Target, Zap, Home } from 'lucide-react'
import '../../styles/modules.css'

export default function TeamOverview() {
  const teamStats = [
    {
      label: 'Possession',
      value: '58%',
      change: '+5%',
      positive: true,
      icon: Target,
    },
    {
      label: 'Pass Accuracy',
      value: '87%',
      change: '+2%',
      positive: true,
      icon: TrendingUp,
    },
    {
      label: 'Shots on Target',
      value: '12',
      change: '+3',
      positive: true,
      icon: Zap,
    },
    {
      label: 'Tackles Won',
      value: '34',
      change: '+8',
      positive: true,
      icon: Users,
    },
  ]

  const recentMatches = [
    {
      id: 1,
      opponent: 'Manchester United',
      result: '2-1',
      date: '2024-01-20',
      status: 'Win',
      venue: 'Home',
    },
    {
      id: 2,
      opponent: 'Liverpool FC',
      result: '1-1',
      date: '2024-01-15',
      status: 'Draw',
      venue: 'Away',
    },
    {
      id: 3,
      opponent: 'Arsenal FC',
      result: '3-0',
      date: '2024-01-10',
      status: 'Win',
      venue: 'Home',
    },
    {
      id: 4,
      opponent: 'Chelsea FC',
      result: '0-2',
      date: '2024-01-05',
      status: 'Loss',
      venue: 'Away',
    },
  ]

  return (
    <div className="module-container">
      <div className="page-header">
        <h1>
          <span className="header-icon">
            <Home size={24} />
          </span>
          Team Overview
        </h1>
        <p>Real-time team performance analysis and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {teamStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="stat-card">
              <div className="stat-card-header">
                <span className="stat-card-title">{stat.label}</span>
                <div className="stat-card-icon">
                  <Icon size={20} />
                </div>
              </div>
              <div className="stat-card-value">{stat.value}</div>
              <div className="stat-card-footer">
                <span className={`stat-card-change ${stat.positive ? 'positive' : 'negative'}`}>
                  {stat.positive ? '↑' : '↓'} {stat.change}
                </span>
                <span>vs last match</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Matches */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Recent Matches</h2>
        </div>

        <div className="matches-table">
          <div className="table-header">
            <div className="table-col col-opponent">Opponent</div>
            <div className="table-col col-result">Result</div>
            <div className="table-col col-status">Status</div>
            <div className="table-col col-venue">Venue</div>
            <div className="table-col col-date">Date</div>
          </div>

          {recentMatches.map((match) => (
            <div key={match.id} className="table-row">
              <div className="table-col col-opponent">
                <span className="match-opponent">{match.opponent}</span>
              </div>
              <div className="table-col col-result">
                <span className="match-result">{match.result}</span>
              </div>
              <div className="table-col col-status">
                <span
                  className={`badge badge-${match.status.toLowerCase()} match-badge`}
                >
                  {match.status}
                </span>
              </div>
              <div className="table-col col-venue">
                <span className="match-venue">{match.venue}</span>
              </div>
              <div className="table-col col-date">
                <span className="match-date">{match.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Formation */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Current Formation</h2>
        </div>

        <div className="formation-container">
          <img
            src="/football-formation.jpg"
            alt="Team Formation"
            className="formation-image"
          />
          <div className="formation-details">
            <div className="formation-info">
              <h3>4-3-3 Formation</h3>
              <p>
                4 defenders, 3 midfielders, 3 forwards. Optimal balance for both defense and
                attack.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
