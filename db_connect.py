import psycopg2
from psycopg2.extras import execute_values
from typing import Dict
import json
import math

class KicksenseDB:
    def __init__(self, db_config):
        try:
            self.conn = psycopg2.connect(**db_config)
            self.cursor = self.conn.cursor()
            print("✅ Connected to TimescaleDB")
        except Exception as e:
            print(f"❌ Connection Failed: {e}")
            self.conn = None
            
        self.buffer = []
        self.BATCH_SIZE = 500  # Write 500 rows at a time
    
    def ensure_tables(self):
        """
        Ensure runtime analytics tables exist.
        This complements init_db.sql and also supports existing DB volumes.
        """
        if not self.conn:
            return
        query = """
            CREATE EXTENSION IF NOT EXISTS timescaledb;

            CREATE TABLE IF NOT EXISTS teams (
                team_id INT PRIMARY KEY,
                name VARCHAR(50)
            );

            CREATE TABLE IF NOT EXISTS matches (
                match_id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                date TIMESTAMPTZ DEFAULT NOW(),
                fps INT DEFAULT 30
            );

            INSERT INTO teams (team_id, name) VALUES (0, 'Team A')
            ON CONFLICT (team_id) DO NOTHING;

            INSERT INTO teams (team_id, name) VALUES (1, 'Team B')
            ON CONFLICT (team_id) DO NOTHING;

            INSERT INTO matches (match_id, name, fps) VALUES (1, 'Test Match', 30)
            ON CONFLICT (match_id) DO NOTHING;

            CREATE TABLE IF NOT EXISTS tracking_data (
                time TIMESTAMPTZ NOT NULL,
                match_id INT REFERENCES matches(match_id),
                track_id INT,
                team_id INT REFERENCES teams(team_id),
                x_coord DOUBLE PRECISION,
                y_coord DOUBLE PRECISION,
                speed DOUBLE PRECISION,
                is_sprinting BOOLEAN
            );

            SELECT create_hypertable('tracking_data', 'time', if_not_exists => TRUE);

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
                sub_priority DOUBLE PRECISION DEFAULT 0.0,
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (match_id, track_id)
            );

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
                xg DOUBLE PRECISION DEFAULT 0.0,
                is_on_target BOOLEAN,
                is_goal BOOLEAN,
                is_big_chance BOOLEAN DEFAULT FALSE,
                x_origin DOUBLE PRECISION,
                y_origin DOUBLE PRECISION,
                trajectory JSONB
            );

            -- Ensure columns exist in player_match_stats (for schema evolution)
            ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS shots_total INT DEFAULT 0;
            ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS shots_on_target INT DEFAULT 0;
            ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS goals INT DEFAULT 0;
            ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS shot_accuracy DOUBLE PRECISION DEFAULT 0.0;
            ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS avg_shot_distance_m DOUBLE PRECISION DEFAULT 0.0;
            ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS max_shot_power_ms DOUBLE PRECISION DEFAULT 0.0;
            ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS sub_priority DOUBLE PRECISION DEFAULT 0.0;
            ALTER TABLE shot_events ADD COLUMN IF NOT EXISTS xg DOUBLE PRECISION DEFAULT 0.0;
            ALTER TABLE shot_events ADD COLUMN IF NOT EXISTS is_big_chance BOOLEAN DEFAULT FALSE;
            ALTER TABLE shot_events ADD COLUMN IF NOT EXISTS trajectory JSONB;


            -- Passing Stats columns (schema evolution for existing volumes)
            ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS passes_attempted INT DEFAULT 0;
            ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS passes_completed INT DEFAULT 0;
            ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS pass_accuracy DOUBLE PRECISION DEFAULT 0.0;
            ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS avg_pass_distance_m DOUBLE PRECISION DEFAULT 0.0;
            ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS progressive_passes INT DEFAULT 0;

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

            CREATE TABLE IF NOT EXISTS team_passing_stats (
                match_id INT REFERENCES matches(match_id),
                team_id INT REFERENCES teams(team_id),
                total_passes INT DEFAULT 0,
                completed_passes INT DEFAULT 0,
                pass_accuracy DOUBLE PRECISION DEFAULT 0.0,
                total_pass_distance_m DOUBLE PRECISION DEFAULT 0.0,
                progressive_passes INT DEFAULT 0,
                avg_pass_distance_m DOUBLE PRECISION DEFAULT 0.0,
                interceptions INT DEFAULT 0,
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (match_id, team_id)
            );

            CREATE TABLE IF NOT EXISTS team_possession_stats (
                match_id INT REFERENCES matches(match_id),
                team_id INT REFERENCES teams(team_id),
                possession_percentage DOUBLE PRECISION DEFAULT 0.0,
                possession_frames INT DEFAULT 0,
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (match_id, team_id)
            );

            CREATE TABLE IF NOT EXISTS team_formation_stats (
                match_id INT REFERENCES matches(match_id),
                team_id INT REFERENCES teams(team_id),
                formation VARCHAR(20),
                status VARCHAR(50),
                avg_area DOUBLE PRECISION DEFAULT 0.0,
                area_per_player DOUBLE PRECISION DEFAULT 0.0,
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (match_id, team_id)
            );

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

            -- Jersey number recognition columns
            ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS jersey_number INT;
            ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS player_name VARCHAR(100);
        """
        try:
            self.cursor.execute(query)
            self.conn.commit()
        except Exception as e:
            print(f"❌ Failed to ensure player_match_stats table: {e}")
            self.conn.rollback()

    def clear_match_data(self, match_id=1):
        """Clear existing rows for a match so reruns don't duplicate data."""
        if not self.conn:
            return
        try:
            self.cursor.execute("DELETE FROM tracking_data WHERE match_id = %s", (match_id,))
            self.cursor.execute("DELETE FROM pass_events WHERE match_id = %s", (match_id,))
            self.cursor.execute("DELETE FROM team_passing_stats WHERE match_id = %s", (match_id,))
            self.cursor.execute("DELETE FROM team_dribbling_stats WHERE match_id = %s", (match_id,))
            self.cursor.execute("DELETE FROM team_possession_stats WHERE match_id = %s", (match_id,))
            self.cursor.execute("DELETE FROM team_formation_stats WHERE match_id = %s", (match_id,))
            self.cursor.execute("DELETE FROM shot_events WHERE match_id = %s", (match_id,))
            self.cursor.execute("DELETE FROM player_match_stats WHERE match_id = %s", (match_id,))
            self.conn.commit()

        except Exception as e:
            print(f"❌ Failed clearing match data: {e}")
            self.conn.rollback()

    def add_frame_data(self, timestamp, detections, match_id=1):
        """
        detections = list of tuples:
        (track_id, team_id, x, y, speed_ms, is_sprinting)
        """
        if not self.conn: return

        for det in detections:
            track_id, team_id, x, y, speed, is_sprinting = det
            
            # Map standard track info to DB columns
            # Ensure team_id is valid (0 or 1), default to 0
            safe_team_id = team_id if team_id in [0, 1] else 0

            self.buffer.append((
                timestamp, 
                match_id, 
                track_id, 
                safe_team_id, 
                x, 
                y, 
                speed, 
                is_sprinting
            ))

        # Flush if buffer is full
        if len(self.buffer) >= self.BATCH_SIZE:
            self.flush()

    def flush(self):
        if not self.buffer or not self.conn: return
        
        query = """
            INSERT INTO tracking_data 
            (time, match_id, track_id, team_id, x_coord, y_coord, speed, is_sprinting)
            VALUES %s
        """
        try:
            execute_values(self.cursor, query, self.buffer)
            self.conn.commit()
            self.buffer = [] 
        except Exception as e:
            print(f"❌ Database Insert Error: {e}")
            self.conn.rollback()

    def upsert_player_stats(self, player_stats, foul_risk_map=None, match_id=1):
        """
        Upsert aggregated per-player metrics.
        player_stats items are expected from export_stats_to_csv return payload.
        """
        if not self.conn or not player_stats:
            return
        rows = []
        for item in player_stats:
            tid = int(item["track_id"])
            team_id = item.get("team_id", 0)
            foul = (foul_risk_map or {}).get(tid, {})
            rows.append((
                match_id,
                tid,
                team_id,
                item.get("class"),
                float(item.get("max_speed_kmh", 0.0)),
                float(item.get("avg_speed_kmh", 0.0)),
                float(item.get("total_distance_m", 0.0)),
                float(foul.get("foul_risk")) if foul.get("foul_risk") is not None else None,
                float(foul.get("yellow_likelihood")) if foul.get("yellow_likelihood") is not None else None,
                float(foul.get("red_likelihood")) if foul.get("red_likelihood") is not None else None,
                foul.get("card_prediction"),
                int(foul.get("contact_events", 0)) if foul else 0,
                float(item.get("sub_priority", 0.0))
            ))
        query = """
            INSERT INTO player_match_stats
            (
                match_id, track_id, team_id, class, max_speed_kmh, avg_speed_kmh, total_distance_m,
                foul_risk, yellow_likelihood, red_likelihood, card_prediction, contact_events, sub_priority
            )
            VALUES %s
            ON CONFLICT (match_id, track_id)
            DO UPDATE SET
                team_id = EXCLUDED.team_id,
                class = EXCLUDED.class,
                max_speed_kmh = EXCLUDED.max_speed_kmh,
                avg_speed_kmh = EXCLUDED.avg_speed_kmh,
                total_distance_m = EXCLUDED.total_distance_m,
                foul_risk = EXCLUDED.foul_risk,
                yellow_likelihood = EXCLUDED.yellow_likelihood,
                red_likelihood = EXCLUDED.red_likelihood,
                card_prediction = EXCLUDED.card_prediction,
                contact_events = EXCLUDED.contact_events,
                sub_priority = EXCLUDED.sub_priority,
                updated_at = NOW()
        """
        try:
            execute_values(self.cursor, query, rows)
            self.conn.commit()
        except Exception as e:
            print(f"❌ Failed to upsert player stats: {e}")
            self.conn.rollback()

    def upsert_dribbling_stats(self, dribbling_data: Dict, match_id=1):
        """
        Upsert dribbling statistics for players and teams.
        
        Args:
            dribbling_data: Output from DribblingAnalyzer.analyze_tracks()
            match_id: Match ID
        """
        if not self.conn or not dribbling_data:
            return
        
        # Upsert player dribbling stats
        player_stats = dribbling_data.get("player_dribbling_stats", {})
        if player_stats:
            player_query = """
                UPDATE player_match_stats
                SET
                    dribbles_attempted = %s,
                    dribbles_successful = %s,
                    dribble_success_rate = %s,
                    dribble_distance_m = %s,
                    progressive_dribbles = %s,
                    avg_dribble_distance_m = %s,
                    avg_dribble_duration_s = %s,
                    dribble_opponents_beaten = %s,
                    updated_at = NOW()
                WHERE match_id = %s AND track_id = %s
            """
            try:
                for player_id, stats in player_stats.items():
                    self.cursor.execute(player_query, (
                        stats.get("total_dribbles", 0),
                        stats.get("successful_dribbles", 0),
                        stats.get("success_rate", 0.0),
                        stats.get("distance_covered_m", 0.0),
                        stats.get("progressive_dribbles", 0),
                        stats.get("avg_dribble_distance_m", 0.0),
                        stats.get("avg_dribble_duration_s", 0.0),
                        stats.get("opponents_beaten", 0),
                        match_id,
                        player_id
                    ))
                self.conn.commit()
                print(f"✅ Player dribbling stats upserted successfully ({len(player_stats)} players)")
            except Exception as e:
                print(f"❌ Failed to upsert player dribbling stats: {e}")
                self.conn.rollback()
        
        # Upsert team dribbling stats
        team_stats = dribbling_data.get("team_dribbling_stats", {})
        if team_stats:
            team_query = """
                INSERT INTO team_dribbling_stats
                (match_id, team_id, total_dribbles, successful_dribbles, success_rate, 
                 total_distance_m, progressive_dribbles, avg_dribble_distance_m)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (match_id, team_id)
                DO UPDATE SET
                    total_dribbles = EXCLUDED.total_dribbles,
                    successful_dribbles = EXCLUDED.successful_dribbles,
                    success_rate = EXCLUDED.success_rate,
                    total_distance_m = EXCLUDED.total_distance_m,
                    progressive_dribbles = EXCLUDED.progressive_dribbles,
                    avg_dribble_distance_m = EXCLUDED.avg_dribble_distance_m,
                    updated_at = NOW()
            """
            try:
                for team_id, stats in team_stats.items():
                    self.cursor.execute(team_query, (
                        match_id,
                        team_id,
                        stats.get("total_dribbles", 0),
                        stats.get("successful_dribbles", 0),
                        stats.get("success_rate", 0.0),
                        stats.get("total_distance_m", 0.0),
                        stats.get("progressive_dribbles", 0),
                        stats.get("avg_dribble_distance_m", 0.0),
                    ))
                self.conn.commit()
                print("✅ Team dribbling stats upserted successfully")
            except Exception as e:
                print(f"❌ Failed to upsert team dribbling stats: {e}")
                self.conn.rollback()

    def upsert_shooting_stats(self, shooting_data: Dict, fps: int, match_id=1):
        """
        Upsert shooting events and update aggregate player stats.
        """
        if not self.conn or not shooting_data:
            return
            
        from datetime import datetime, timedelta, timezone
        start_ts = datetime.now(timezone.utc) # Anchor for event timestamps
        
        # 1. Insert Individual Shot Events
        shot_events = shooting_data.get("shot_events", [])
        if shot_events:
            event_query = """
                INSERT INTO shot_events
                (match_id, track_id, team_id, frame_idx, time, distance_m, angle_deg, power_ms, xg, is_on_target, is_goal, is_big_chance, x_origin, y_origin, trajectory)
                VALUES %s
            """
            rows = []
            for shot in shot_events:
                timestamp = start_ts + timedelta(seconds=shot.frame_idx / fps)
                rows.append((
                    match_id,
                    shot.player_id,
                    shot.team_id,
                    shot.frame_idx,
                    timestamp,
                    shot.distance_to_goal_m,
                    shot.angle_to_goal_deg,
                    shot.max_velocity_ms,
                    shot.xg,
                    shot.is_on_target,
                    shot.is_goal,
                    getattr(shot, 'is_big_chance', False),
                    shot.origin_pos[0],
                    shot.origin_pos[1],
                    json.dumps(getattr(shot, 'trajectory', []))
                ))
            try:
                execute_values(self.cursor, event_query, rows)
                self.conn.commit()
                print(f"✅ Shot events upserted successfully ({len(shot_events)} events)")
            except Exception as e:
                print(f"❌ Failed to upsert shot events: {e}")
                self.conn.rollback()

        # 2. Update Player Match Stats Aggregates
        player_stats = shooting_data.get("player_shooting_stats", {})
        if player_stats:
            player_query = """
                UPDATE player_match_stats
                SET
                    shots_total = %s,
                    shots_on_target = %s,
                    goals = %s,
                    shot_accuracy = %s,
                    avg_shot_distance_m = %s,
                    max_shot_power_ms = %s,
                    updated_at = NOW()
                WHERE match_id = %s AND track_id = %s
            """
            try:
                for pid, s in player_stats.items():
                    self.cursor.execute(player_query, (
                        s.get("shots_total", 0),
                        s.get("shots_on_target", 0),
                        s.get("goals", 0),
                        s.get("shot_accuracy", 0.0),
                        s.get("avg_shot_distance", 0.0),
                        s.get("max_power", 0.0),
                        match_id,
                        pid
                    ))
                self.conn.commit()
                print(f"✅ Player shooting stats updated ({len(player_stats)} players)")
            except Exception as e:
                print(f"❌ Failed to update player shooting stats: {e}")
                self.conn.rollback()


    def upsert_jersey_numbers(self, assignments: Dict, player_names: Dict = None,
                              match_id: int = 1):
        """
        Update jersey_number and player_name for assigned tracks.

        Args:
            assignments: {stable_id: jersey_number}
            player_names: {stable_id: player_name}
            match_id: Match ID
        """
        if not self.conn or not assignments:
            return

        player_names = player_names or {}
        query = """
            UPDATE player_match_stats
            SET jersey_number = %s,
                player_name = %s,
                updated_at = NOW()
            WHERE match_id = %s AND track_id = %s
        """
        try:
            for sid, jnum in assignments.items():
                name = player_names.get(sid, "")
                self.cursor.execute(query, (jnum, name, match_id, sid))
            self.conn.commit()
            print(f"✅ Jersey numbers persisted ({len(assignments)} players)")
        except Exception as e:
            print(f"❌ Failed to upsert jersey numbers: {e}")
            self.conn.rollback()

    def close(self):
        self.flush() # Save whatever is left
        if self.conn:
            self.conn.close()
            print("🔌 Database Disconnected")
