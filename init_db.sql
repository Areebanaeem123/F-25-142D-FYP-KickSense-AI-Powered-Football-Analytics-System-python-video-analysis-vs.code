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
    team_id INT REFERENCES teams(team_id),
    class VARCHAR(20),
    max_speed_kmh DOUBLE PRECISION,
    avg_speed_kmh DOUBLE PRECISION,
    total_distance_m DOUBLE PRECISION,
    foul_risk DOUBLE PRECISION,
    yellow_likelihood DOUBLE PRECISION,
    red_likelihood DOUBLE PRECISION,
    card_prediction VARCHAR(20),
    contact_events INT,
    dribbles_attempted INT DEFAULT 0,
    dribbles_successful INT DEFAULT 0,
    dribble_success_rate DOUBLE PRECISION DEFAULT 0.0,
    dribble_distance_m DOUBLE PRECISION DEFAULT 0.0,
    progressive_dribbles INT DEFAULT 0,
    avg_dribble_distance_m DOUBLE PRECISION DEFAULT 0.0,
    avg_dribble_duration_s DOUBLE PRECISION DEFAULT 0.0,
    dribble_opponents_beaten INT DEFAULT 0,
    -- Shooting Stats
    shots_total INT DEFAULT 0,
    shots_on_target INT DEFAULT 0,
    goals INT DEFAULT 0,
    shot_accuracy DOUBLE PRECISION DEFAULT 0.0,
    avg_shot_distance_m DOUBLE PRECISION DEFAULT 0.0,
    max_shot_power_ms DOUBLE PRECISION DEFAULT 0.0,
    -- Passing Stats
    passes_attempted INT DEFAULT 0,
    passes_completed INT DEFAULT 0,
    pass_accuracy DOUBLE PRECISION DEFAULT 0.0,
    avg_pass_distance_m DOUBLE PRECISION DEFAULT 0.0,
    progressive_passes INT DEFAULT 0,
    sub_priority DOUBLE PRECISION DEFAULT 0.0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (match_id, track_id)
);

-- 5. Individual Shot Events
CREATE TABLE IF NOT EXISTS shot_events (
    shot_id SERIAL PRIMARY KEY,
    match_id INT REFERENCES matches(match_id),
    track_id INT,
    team_id INT REFERENCES teams(team_id),
    frame_idx INT,
    time TIMESTAMPTZ,
    distance_m DOUBLE PRECISION,
    angle_deg DOUBLE PRECISION,
    power_ms DOUBLE PRECISION,
    is_on_target BOOLEAN,
    is_goal BOOLEAN,
    x_origin DOUBLE PRECISION,
    y_origin DOUBLE PRECISION
);


-- 6. Individual Pass Events
CREATE TABLE IF NOT EXISTS pass_events (
    pass_id SERIAL PRIMARY KEY,
    match_id INT REFERENCES matches(match_id),
    passer_id INT,
    receiver_id INT,
    passer_team INT REFERENCES teams(team_id),
    receiver_team INT,
    frame_idx INT,
    time TIMESTAMPTZ,
    distance_m DOUBLE PRECISION,
    is_completed BOOLEAN,
    is_progressive BOOLEAN,
    x_origin DOUBLE PRECISION,
    y_origin DOUBLE PRECISION,
    x_target DOUBLE PRECISION,
    y_target DOUBLE PRECISION,
    trajectory JSONB
);

-- 7. Team Passing Stats (one row per team per match)
CREATE TABLE IF NOT EXISTS team_passing_stats (
    match_id INT REFERENCES matches(match_id),
    team_id INT REFERENCES teams(team_id),
    total_passes INT DEFAULT 0,
    completed_passes INT DEFAULT 0,
    pass_accuracy DOUBLE PRECISION DEFAULT 0.0,
    total_pass_distance_m DOUBLE PRECISION DEFAULT 0.0,
    progressive_passes INT DEFAULT 0,
    avg_pass_distance_m DOUBLE PRECISION DEFAULT 0.0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (match_id, team_id)
);

-- 8. Team Dribbling Stats (one row per team per match)
CREATE TABLE IF NOT EXISTS team_dribbling_stats (
    match_id INT REFERENCES matches(match_id),
    team_id INT REFERENCES teams(team_id),
    total_dribbles INT DEFAULT 0,
    successful_dribbles INT DEFAULT 0,
    success_rate DOUBLE PRECISION DEFAULT 0.0,
    total_distance_m DOUBLE PRECISION DEFAULT 0.0,
    progressive_dribbles INT DEFAULT 0,
    avg_dribble_distance_m DOUBLE PRECISION DEFAULT 0.0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (match_id, team_id)
);
