import { Zap } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import '../../styles/modules.css'

export default function PlayerSpeedAnalytics() {
  const speedData = [
    { player: 'John Anderson', maxSpeed: 34.2, avgSpeed: 18.5, sprints: 28 },
    { player: 'Alex Wilson', maxSpeed: 33.8, avgSpeed: 17.9, sprints: 25 },
    { player: 'James Wilson', maxSpeed: 32.1, avgSpeed: 16.4, sprints: 22 },
    { player: 'David Miller', maxSpeed: 29.5, avgSpeed: 15.2, sprints: 18 },
    { player: 'Marcus Johnson', maxSpeed: 28.3, avgSpeed: 14.1, sprints: 14 },
  ]

  const speedCategories = [
    { label: 'Elite (32+ km/h)', count: 2, color: '#22c55e' },
    { label: 'High (28-31 km/h)', count: 3, color: 'var(--primary)' },
    { label: 'Average (24-27 km/h)', count: 4, color: 'var(--accent)' },
    { label: 'Lower (< 24 km/h)', count: 2, color: '#6b7280' },
  ]

  return (
    <div className="module-container">
      <div className="page-header">
        <h1>
          <span className="header-icon">
            <Zap size={24} />
          </span>
          Player Speed Analytics
        </h1>
        <p>Maximum speed, average velocity, and sprint analysis</p>
      </div>

      {/* Speed Stats */}
      <div className="grid-4">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Fastest Player</span>
          </div>
          <div className="stat-card-value">34.2 km/h</div>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            John Anderson
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Average Team Speed</span>
          </div>
          <div className="stat-card-value">16.4 km/h</div>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Match average
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Sprints</span>
          </div>
          <div className="stat-card-value">107</div>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            This match
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">High Intensity</span>
          </div>
          <div className="stat-card-value">78%</div>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Match time
          </p>
        </div>
      </div>

      {/* Speed Chart */}
      <div className="chart-container">
        <h3 className="chart-title">Player Speed Metrics</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={speedData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis dataKey="player" angle={-45} textAnchor="end" height={100} />
            <YAxis label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => `${value.toFixed(1)} km/h`} />
            <Legend />
            <Bar dataKey="maxSpeed" fill="var(--primary)" name="Max Speed" />
            <Bar dataKey="avgSpeed" fill="var(--accent)" name="Avg Speed" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Speed Categories */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Player Speed Classification</h2>
        </div>

        <div className="grid-2">
          {speedCategories.map((cat, idx) => (
            <div
              key={idx}
              style={{
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.9)',
                border: `2px solid ${cat.color}`,
                borderRadius: '10px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: `${cat.color}20`,
                  margin: '0 auto 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: cat.color,
                  fontWeight: '700',
                  fontSize: '1.2rem',
                }}
              >
                ⚡
              </div>
              <h4 style={{ color: cat.color, marginBottom: '0.5rem' }}>{cat.label}</h4>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: cat.color }}>
                {cat.count}
              </div>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                players
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Player Speeds */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Detailed Speed Analysis</h2>
        </div>

        <div className="player-list">
          {speedData.map((player, idx) => (
            <div key={idx} className="player-item">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                }}
              >
                {idx + 1}
              </div>

              <div className="player-info" style={{ flex: 1 }}>
                <div className="player-name">{player.player}</div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                    Max: {player.maxSpeed} km/h
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                    Avg: {player.avgSpeed} km/h
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                    Sprints: {player.sprints}
                  </span>
                </div>
              </div>

              <div
                style={{
                  width: '100px',
                  height: '6px',
                  background: 'var(--gray-200)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: `linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%)`,
                    width: `${(player.maxSpeed / 35) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
