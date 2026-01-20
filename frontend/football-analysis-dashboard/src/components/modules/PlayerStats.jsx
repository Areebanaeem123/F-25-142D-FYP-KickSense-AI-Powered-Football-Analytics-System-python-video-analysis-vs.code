import { Users, Filter } from 'lucide-react'
import '../../styles/modules.css'

export default function PlayerStats() {
  const players = [
    {
      id: 1,
      name: 'John Anderson',
      number: 7,
      position: 'Forward',
      goals: 12,
      assists: 5,
      passes: 234,
      tackles: 8,
      rating: 8.2,
    },
    {
      id: 2,
      name: 'David Miller',
      number: 10,
      position: 'Midfielder',
      goals: 4,
      assists: 8,
      passes: 412,
      tackles: 15,
      rating: 7.8,
    },
    {
      id: 3,
      name: 'Marcus Johnson',
      number: 5,
      position: 'Defender',
      goals: 1,
      assists: 2,
      passes: 356,
      tackles: 34,
      rating: 7.5,
    },
    {
      id: 4,
      name: 'Ryan Thompson',
      number: 1,
      position: 'Goalkeeper',
      goals: 0,
      assists: 0,
      passes: 89,
      tackles: 2,
      rating: 8.4,
    },
    {
      id: 5,
      name: 'Alex Wilson',
      number: 11,
      position: 'Forward',
      goals: 8,
      assists: 3,
      passes: 178,
      tackles: 12,
      rating: 7.9,
    },
  ]

  return (
    <div className="module-container">
      <div className="page-header">
        <h1>
          <span className="header-icon">
            <Users size={24} />
          </span>
          Player Statistics
        </h1>
        <p>Individual player performance and key metrics</p>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Team Players</h2>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} />
            Filter
          </button>
        </div>

        <div className="player-list">
          {players.map((player) => (
            <div key={player.id} className="player-item">
              <div className="player-avatar">{player.number}</div>
              <div className="player-info">
                <div className="player-name">{player.name}</div>
                <div className="player-position">{player.position}</div>
              </div>
              <div className="player-stats-mini">
                <div className="player-stat-mini">
                  <span className="player-stat-mini-label">Goals</span>
                  <span className="player-stat-mini-value">{player.goals}</span>
                </div>
                <div className="player-stat-mini">
                  <span className="player-stat-mini-label">Assists</span>
                  <span className="player-stat-mini-value">{player.assists}</span>
                </div>
                <div className="player-stat-mini">
                  <span className="player-stat-mini-label">Passes</span>
                  <span className="player-stat-mini-value">{player.passes}</span>
                </div>
                <div className="player-stat-mini">
                  <span className="player-stat-mini-label">Tackles</span>
                  <span className="player-stat-mini-value">{player.tackles}</span>
                </div>
                <div className="player-stat-mini">
                  <span className="player-stat-mini-label">Rating</span>
                  <span
                    className="player-stat-mini-value"
                    style={{
                      color: player.rating >= 8 ? '#22c55e' : player.rating >= 7.5 ? 'var(--primary)' : '#ff6b35',
                    }}
                  >
                    {player.rating}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
