-- 1. Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 2. Metadata Tables
CREATE TABLE IF NOT EXISTS teams (
    team_id INT PRIMARY KEY, -- We will map 0=TeamA, 1=TeamB manually
    name VARCHAR(50)
);
-- Insert default teams so Foreign Keys don't fail
INSERT INTO teams (team_id, name) VALUES (0, 'Team A') ON CONFLICT DO NOTHING;
INSERT INTO teams (team_id, name) VALUES (1, 'Team B') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS matches (
    match_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    date TIMESTAMPTZ DEFAULT NOW(),
    fps INT DEFAULT 30
);
INSERT INTO matches (match_id, name, fps) VALUES (1, 'Test Match', 30) ON CONFLICT DO NOTHING;

-- 3. The Tracking Hypertable (Massive Data)
CREATE TABLE IF NOT EXISTS tracking_data (
    time TIMESTAMPTZ NOT NULL,
    match_id INT REFERENCES matches(match_id),
    track_id INT, -- Original ID from tracker
    team_id INT REFERENCES teams(team_id), 
    x_coord DOUBLE PRECISION, -- Real-world Meters
    y_coord DOUBLE PRECISION, -- Real-world Meters
    speed DOUBLE PRECISION,   -- m/s
    is_sprinting BOOLEAN
);

-- Convert to Hypertable for performance
SELECT create_hypertable('tracking_data', 'time', if_not_exists => TRUE);

-- 4. Aggregated Player Stats (one row per player per match)
CREATE TABLE IF NOT EXISTS player_match_stats (
    match_id INT REFERENCES matches(match_id),
    track_id INT NOT NULL,
    class VARCHAR(20),
    max_speed_kmh DOUBLE PRECISION,
    avg_speed_kmh DOUBLE PRECISION,
    total_distance_m DOUBLE PRECISION,
    foul_risk DOUBLE PRECISION,
    yellow_likelihood DOUBLE PRECISION,
    red_likelihood DOUBLE PRECISION,
    card_prediction VARCHAR(20),
    contact_events INT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (match_id, track_id)
);
