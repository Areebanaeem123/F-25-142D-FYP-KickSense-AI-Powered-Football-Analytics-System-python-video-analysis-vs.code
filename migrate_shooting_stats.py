import psycopg2
import os

def migrate():
    db_config = {
        "host": "127.0.0.1",
        "port": 5432,
        "database": "kicksense",
        "user": "postgres",
        "password": "password123"
    }
    
    conn = None
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        print("🔍 Checking and updating schema...")
        
        # SQL to add columns if they don't exist
        alter_queries = [
            "ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS shots_total INT DEFAULT 0;",
            "ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS shots_on_target INT DEFAULT 0;",
            "ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS goals INT DEFAULT 0;",
            "ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS shot_accuracy DOUBLE PRECISION DEFAULT 0.0;",
            "ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS avg_shot_distance_m DOUBLE PRECISION DEFAULT 0.0;",
            "ALTER TABLE player_match_stats ADD COLUMN IF NOT EXISTS max_shot_power_ms DOUBLE PRECISION DEFAULT 0.0;"
        ]
        
        for query in alter_queries:
            cursor.execute(query)
            
        conn.commit()
        print("✅ Schema updated successfully with shooting columns.")
        
    except Exception as e:
        print(f"❌ Migration Failed: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    migrate()
