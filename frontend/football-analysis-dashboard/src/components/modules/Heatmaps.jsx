'use client';

import { useState } from 'react'
import { Layers } from 'lucide-react'
import '../../styles/modules.css'

export default function Heatmaps() {
  const [selectedHeatmap, setSelectedHeatmap] = useState('possession')

  const heatmapTypes = [
    { id: 'possession', label: 'Possession', description: 'Ball touch frequency map' },
    { id: 'passes', label: 'Passing', description: 'Pass completion areas' },
    { id: 'shots', label: 'Shots', description: 'Shot attempt locations' },
    { id: 'defensive', label: 'Defensive', description: 'Tackle and interception zones' },
  ]

  const generateHeatmapPoints = () => {
    const points = []
    const intensityZones = [
      { x: 400, y: 150, intensity: 0.9, size: 80 },
      { x: 300, y: 200, intensity: 0.7, size: 60 },
      { x: 500, y: 250, intensity: 0.8, size: 70 },
      { x: 200, y: 300, intensity: 0.5, size: 50 },
      { x: 600, y: 350, intensity: 0.6, size: 55 },
    ]

    return intensityZones.map((zone, idx) => ({
      ...zone,
      color: `rgba(26, 77, 46, ${zone.intensity})`,
    }))
  }

  return (
    <div className="module-container">
      <div className="page-header">
        <h1>
          <span className="header-icon">
            <Layers size={24} />
          </span>
          Heatmaps
        </h1>
        <p>Visualize team and player activity patterns on the field</p>
      </div>

      {/* Heatmap Selection */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">Select Heatmap Type</h2>
        </div>

        <div className="heatmap-option">
          {heatmapTypes.map((type) => (
            <button
              key={type.id}
              className={`heatmap-button ${selectedHeatmap === type.id ? 'active' : ''}`}
              onClick={() => setSelectedHeatmap(type.id)}
              title={type.description}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Visualization */}
      <div className="content-card">
        <div className="content-card-header">
          <h2 className="content-card-title">
            {heatmapTypes.find((h) => h.id === selectedHeatmap)?.label} Heatmap
          </h2>
        </div>

        <div className="heatmap-field">
          {generateHeatmapPoints().map((point, idx) => (
            <div
              key={idx}
              className="heatmap-point"
              style={{
                left: `${point.x - point.size / 2}px`,
                top: `${point.y - point.size / 2}px`,
                width: `${point.size}px`,
                height: `${point.size}px`,
                backgroundColor: point.color,
              }}
            />
          ))}

          {/* Field markings */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
            viewBox="0 0 800 500"
          >
            {/* Center line */}
            <line
              x1="400"
              y1="0"
              x2="400"
              y2="500"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="2"
            />
            {/* Center circle */}
            <circle
              cx="400"
              cy="250"
              r="50"
              fill="none"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="2"
            />
            {/* Goal areas */}
            <rect
              x="0"
              y="175"
              width="50"
              height="150"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
            />
            <rect
              x="750"
              y="175"
              width="50"
              height="150"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
            />
          </svg>
        </div>

        <div className="heatmap-legend">
          <span style={{ fontWeight: '600', marginRight: '1rem' }}>Intensity:</span>
          <div className="heatmap-legend-item">
            <div
              className="heatmap-legend-color"
              style={{ background: 'rgba(26, 77, 46, 0.3)' }}
            ></div>
            <span>Low</span>
          </div>
          <div className="heatmap-legend-item">
            <div
              className="heatmap-legend-color"
              style={{ background: 'rgba(26, 77, 46, 0.6)' }}
            ></div>
            <span>Medium</span>
          </div>
          <div className="heatmap-legend-item">
            <div
              className="heatmap-legend-color"
              style={{ background: 'rgba(26, 77, 46, 0.9)' }}
            ></div>
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Heatmap Analysis */}
      <div className="grid-2">
        <div className="content-card">
          <div className="content-card-header">
            <h2 className="content-card-title">Key Insights</h2>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                padding: '1rem',
                background: 'rgba(26, 77, 46, 0.1)',
                borderRadius: '8px',
                borderLeft: '4px solid var(--primary)',
              }}
            >
              <h5 style={{ color: 'var(--primary)', marginBottom: '0.25rem', fontWeight: '600' }}>
                High Activity Zone
              </h5>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                Center midfield dominates with 89% activity concentration.
              </p>
            </div>

            <div
              style={{
                padding: '1rem',
                background: 'rgba(255, 107, 53, 0.1)',
                borderRadius: '8px',
                borderLeft: '4px solid var(--accent)',
              }}
            >
              <h5 style={{ color: 'var(--accent)', marginBottom: '0.25rem', fontWeight: '600' }}>
                Tactical Note
              </h5>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                Wide areas underutilized - consider wing play strategy.
              </p>
            </div>

            <div
              style={{
                padding: '1rem',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '8px',
                borderLeft: '4px solid #22c55e',
              }}
            >
              <h5 style={{ color: '#22c55e', marginBottom: '0.25rem', fontWeight: '600' }}>
                Strength
              </h5>
              <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                Defensive shape solid across all zones.
              </p>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <h2 className="content-card-title">Player Heatmaps</h2>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { name: 'David Miller', coverage: 94 },
              { name: 'John Anderson', coverage: 78 },
              { name: 'Marcus Johnson', coverage: 88 },
              { name: 'Ryan Thompson', coverage: 65 },
            ].map((player, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(26, 77, 46, 0.1)',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                    {player.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      color: 'var(--primary)',
                    }}
                  >
                    {player.coverage}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '4px',
                    background: 'var(--gray-200)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%)`,
                      width: `${player.coverage}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
