
import sqlite3
import os

DB_PATH = "crm.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print("Database not found, skipping migration.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if columns exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "telegram_chat_id" not in columns:
            print("Adding telegram_chat_id to users...")
            cursor.execute("ALTER TABLE users ADD COLUMN telegram_chat_id TEXT")
            
        if "connect_token" not in columns:
            print("Adding connect_token to users...")
            cursor.execute("ALTER TABLE users ADD COLUMN connect_token TEXT")
            
        conn.commit()
        print("Migration completed.")
    except Exception as e:
        print(f"Error migrating: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
