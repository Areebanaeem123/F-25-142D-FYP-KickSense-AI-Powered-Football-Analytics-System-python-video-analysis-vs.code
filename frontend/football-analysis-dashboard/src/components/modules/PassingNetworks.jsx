import { Network } from 'lucide-react'
import '../../styles/modules.css'

export default function PassingNetworks() {
  const passingStats = [
    { id: 1, player: 'David Miller', passes: 412, accuracy: 87, keyPasses: 8 },
    { id: 2, player: 'John Anderson', passes: 234, accuracy: 82, keyPasses: 12 },
    { id: 3, player: 'James Wilson', passes: 178, accuracy: 79, keyPasses: 5 },
    { id: 4, player: 'Marcus Johnson', passes: 356, accuracy: 84, keyPasses: 2 },
    { id: 5, player: 'Alex Wilson', passes: 145, accuracy: 80, keyPasses: 8 },
  ]

  const connectionData = [
    { from: 'David Miller', to: 'John Anderson', passes: 34 },
    { from: 'David Miller', to: 'James Wilson', passes: 28 },
    { from: 'John Anderson', to: 'Alex Wilson', passes: 22 },
    { from: 'Marcus Johnson', to: 'David Miller', passes: 26 },
    { from: 'James Wilson', to: 'Alex Wilson', passes: 18 },
  ]

  return (
    <div className="module-container">
      <div className="page-header">
        <h1>
          <span className="header-icon">
            <Network size={24} />
          </span>
          Passing Networks
        </h1>
        <p>Analyze player connections and passing patterns</p>
      </div>

      {/* Network Stats */}
      <div className="grid-4">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Passes</span>
          </div>
          <div className="stat-card-value">1,325</div>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            This match
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Pass Accuracy</span>
          </div>
          <div className="stat-card-value">83%</div>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Team average
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Key Passes</span>
          </div>
          <div className="stat-card-value">35</div>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Creating chances
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Possession</span>
          </div>
          <div className="stat-card-value">58%</div>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Ball control
          </p>
        </div>
      </div>

      {/* Network Visualization */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Passing Network Visualization</h2>
        </div>

        <div className="network-container">
          <svg style={{ width: '100%', height: '400px' }} viewBox="0 0 800 400">
            {/* Connection lines */}
            {connectionData.map((conn, idx) => (
              <line
                key={`line-${idx}`}
                x1={`${50 + idx * 120}`}
                y1="100"
                x2={`${150 + idx * 120}`}
                y2="300"
                stroke="rgba(26, 77, 46, 0.3)"
                strokeWidth="2"
              />
            ))}

            {/* Player nodes - Top row */}
            {[1, 2, 3, 4, 5].map((i) => (
              <circle
                key={`node-top-${i}`}
                cx={`${50 + (i - 1) * 150}`}
                cy="100"
                r="30"
                fill="linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)"
                style={{ fill: 'url(#gradient)' }}
              />
            ))}

            {/* Add gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'var(--primary)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'var(--primary-light)', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
          </svg>

          <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--gray-600)' }}>
            Network showing key player connections and passing patterns
          </div>
        </div>
      </div>

      {/* Player Passing Stats */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Player Passing Statistics</h2>
        </div>

        <div className="player-list">
          {passingStats.map((player) => (
            <div key={player.id} className="player-item">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                }}
              >
                P
              </div>

              <div className="player-info">
                <div className="player-name">{player.player}</div>
                <div className="player-position">{player.passes} passes • {player.keyPasses} key passes</div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>Accuracy</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                    {player.accuracy}%
                  </div>
                </div>

                <div
                  style={{
                    width: '120px',
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
                      width: `${player.accuracy}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Strengths */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Key Player Connections</h2>
        </div>

        <div className="grid-2">
          {connectionData.map((conn, idx) => (
            <div
              key={idx}
              style={{
                padding: '1rem',
                background: 'rgba(26, 77, 46, 0.05)',
                borderRadius: '8px',
                borderLeft: '4px solid var(--primary)',
              }}
            >
              <div style={{ fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
                {conn.from} → {conn.to}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: 'var(--gray-600)', fontSize: '0.9rem' }}>
                  Passes
                </span>
                <span
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: 'var(--primary)',
                  }}
                >
                  {conn.passes}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
