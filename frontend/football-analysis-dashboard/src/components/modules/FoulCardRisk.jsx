import { AlertCircle } from 'lucide-react'
import '../../styles/modules.css'

export default function FoulCardRisk() {
  const riskPlayers = [
    { id: 1, name: 'Marcus Johnson', position: 'CB', fouls: 8, risk: 'High', color: '#ef4444' },
    { id: 2, name: 'Samuel Davis', position: 'LB', fouls: 5, risk: 'Medium', color: '#eab308' },
    { id: 3, name: 'James Wilson', position: 'LM', fouls: 3, risk: 'Low', color: '#22c55e' },
    { id: 4, name: 'David Miller', position: 'CM', fouls: 6, risk: 'Medium', color: '#eab308' },
    { id: 5, name: 'Thomas Brown', position: 'CB', fouls: 7, risk: 'High', color: '#ef4444' },
    { id: 6, name: 'Lucas Martinez', position: 'RB', fouls: 4, risk: 'Low', color: '#22c55e' },
  ]

  const matchStatistics = [
    { label: 'Total Fouls This Season', value: 127 },
    { label: 'Yellow Cards', value: 23 },
    { label: 'Red Cards', value: 1 },
    { label: 'Average Fouls Per Game', value: 6.3 },
  ]

  return (
    <div className="module-container">
      <div className="page-header">
        <h1>
          <span className="header-icon">
            <AlertCircle size={24} />
          </span>
          Foul Card Risk
        </h1>
        <p>Player discipline analysis and suspension risk</p>
      </div>

      {/* Season Stats */}
      <div className="grid-4">
        {matchStatistics.map((stat, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">{stat.label}</span>
            </div>
            <div className="stat-card-value">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Risk Players */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Player Foul & Card Risk Analysis</h2>
        </div>

        <div className="player-list">
          {riskPlayers.map((player) => (
            <div key={player.id} className="player-item">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: player.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  opacity: 0.2,
                }}
              >
                ⚠
              </div>

              <div className="player-info">
                <div className="player-name">{player.name}</div>
                <div className="player-position">{player.position}</div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>
                    Fouls
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>
                    {player.fouls}
                  </div>
                </div>
                <span
                  className="badge"
                  style={{
                    background: `rgba(${player.color === '#ef4444' ? '239, 68, 68' : player.color === '#eab308' ? '234, 179, 8' : '34, 197, 94'}, 0.15)`,
                    color: player.color,
                    fontWeight: '700',
                  }}
                >
                  {player.risk}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Risk Mitigation Strategies</h2>
        </div>

        <div className="grid-2">
          <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
            <h4 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>High Risk Players</h4>
            <ul style={{ paddingLeft: '1.5rem', color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: '1.8' }}>
              <li>Marcus Johnson & Thomas Brown need coaching</li>
              <li>Consider rotation in aggressive matchups</li>
              <li>One more foul could result in suspension</li>
            </ul>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #22c55e' }}>
            <h4 style={{ color: '#22c55e', marginBottom: '0.5rem' }}>Preventive Measures</h4>
            <ul style={{ paddingLeft: '1.5rem', color: 'var(--gray-600)', fontSize: '0.9rem', lineHeight: '1.8' }}>
              <li>Defensive discipline training sessions</li>
              <li>Video analysis of tactical fouls</li>
              <li>Updated referee positioning awareness</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
