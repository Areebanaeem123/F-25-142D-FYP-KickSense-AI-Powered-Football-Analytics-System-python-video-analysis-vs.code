#!/usr/bin/env python3
"""
Migration script to add dribbling columns to the database schema
"""
import psycopg2
import os

def run_migration():
    # Get DB config from environment or use defaults
    db_config = {
        "host": os.getenv("DB_HOST", "127.0.0.1"),
        "port": int(os.getenv("DB_PORT", "5432")),
        "database": os.getenv("DB_NAME", "kicksense"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "password123"),
    }
    
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        print("✅ Connected to database")
        
        # Migration statements
        migrations = [
            # Add team_id column
            """
            ALTER TABLE player_match_stats
            ADD COLUMN IF NOT EXISTS team_id INT REFERENCES teams(team_id);
            """,
            
            # Add dribbling columns
            """
            ALTER TABLE player_match_stats
            ADD COLUMN IF NOT EXISTS dribbles_attempted INT DEFAULT 0;
            """,
            
            """
            ALTER TABLE player_match_stats
            ADD COLUMN IF NOT EXISTS dribbles_successful INT DEFAULT 0;
            """,
            
            """
            ALTER TABLE player_match_stats
            ADD COLUMN IF NOT EXISTS dribble_success_rate DOUBLE PRECISION DEFAULT 0.0;
            """,
            
            """
            ALTER TABLE player_match_stats
            ADD COLUMN IF NOT EXISTS dribble_distance_m DOUBLE PRECISION DEFAULT 0.0;
            """,
            
            """
            ALTER TABLE player_match_stats
            ADD COLUMN IF NOT EXISTS progressive_dribbles INT DEFAULT 0;
            """,
            
            """
            ALTER TABLE player_match_stats
            ADD COLUMN IF NOT EXISTS avg_dribble_distance_m DOUBLE PRECISION DEFAULT 0.0;
            """,
            
            """
            ALTER TABLE player_match_stats
            ADD COLUMN IF NOT EXISTS avg_dribble_duration_s DOUBLE PRECISION DEFAULT 0.0;
            """,
            
            """
            ALTER TABLE player_match_stats
            ADD COLUMN IF NOT EXISTS dribble_opponents_beaten INT DEFAULT 0;
            """,
            
            # Create team_dribbling_stats table
            """
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
            """,
        ]
        
        # Execute migrations
        for i, migration in enumerate(migrations, 1):
            try:
                cursor.execute(migration)
                conn.commit()
                print(f"✅ Migration {i}/{len(migrations)} applied successfully")
            except Exception as e:
                print(f"⚠️  Migration {i}/{len(migrations)} warning: {e}")
                conn.rollback()
        
        # Verify schema
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'player_match_stats'
            ORDER BY ordinal_position;
        """)
        
        print("\n✅ Current player_match_stats columns:")
        for column_name, data_type in cursor.fetchall():
            print(f"   - {column_name}: {data_type}")
        
        # Check team_dribbling_stats table
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'team_dribbling_stats'
            );
        """)
        
        team_table_exists = cursor.fetchone()[0]
        if team_table_exists:
            print("\n✅ team_dribbling_stats table created successfully")
            cursor.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'team_dribbling_stats'
                ORDER BY ordinal_position;
            """)
            print("✅ Current team_dribbling_stats columns:")
            for column_name, data_type in cursor.fetchall():
                print(f"   - {column_name}: {data_type}")
        
        cursor.close()
        conn.close()
        print("\n🎉 Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = run_migration()
    exit(0 if success else 1)
