"""
Data Echo — Database Management
Handles SQLite database schema creation, CSV importing, and DB connection helpers.
"""
import sqlite3
import csv
import os
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), "data_echo.db")
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    print("📦 Initializing SQLite Database...")
    conn = get_db_connection()
    cur = conn.cursor()

    # 1. App Users (Authentication)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS app_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. Network Users (2500 social network nodes)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS network_users (
            user_id TEXT PRIMARY KEY,
            username TEXT,
            age_group TEXT,
            community_id TEXT,
            platform TEXT,
            connections_count INTEGER,
            sharing_tendency REAL,
            is_verified INTEGER,
            account_age_months INTEGER,
            activity_level TEXT,
            degree_centrality REAL,
            betweenness_centrality REAL
        )
    """)

    # 3. Connections (Edges)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS connections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id_1 TEXT,
            user_id_2 TEXT,
            connection_strength REAL,
            interaction_frequency TEXT
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_conn_u1 ON connections(user_id_1)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_conn_u2 ON connections(user_id_2)")

    # 4. Incidents
    cur.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            incident_id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT,
            claim_text TEXT NOT NULL,
            source_platform TEXT,
            fact_check_label TEXT,
            severity TEXT,
            origin_region TEXT,
            virality_level TEXT,
            sharing_probability REAL,
            icon TEXT,
            origin_user_id TEXT,
            total_reached INTEGER DEFAULT 0,
            reach_percentage REAL DEFAULT 0.0,
            propagation_steps INTEGER DEFAULT 0,
            communities_affected INTEGER DEFAULT 0,
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 5. Propagation Logs
    cur.execute("""
        CREATE TABLE IF NOT EXISTS propagation_logs (
            log_id INTEGER PRIMARY KEY,
            incident_id INTEGER,
            from_user_id TEXT,
            to_user_id TEXT,
            timestamp_step INTEGER,
            was_shared INTEGER,
            sharing_probability_used REAL,
            propagation_depth INTEGER,
            community_id TEXT,
            FOREIGN KEY (incident_id) REFERENCES incidents(incident_id)
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_prop_inc ON propagation_logs(incident_id)")

    # 6. User Analyses History
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            incident_id INTEGER,
            title TEXT,
            icon TEXT,
            label TEXT,
            source TEXT,
            users INTEGER,
            reached INTEGER,
            reach_pct REAL,
            steps INTEGER,
            analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES app_users(id),
            FOREIGN KEY (incident_id) REFERENCES incidents(incident_id)
        )
    """)

    # 7. Real-Time Verified Claims History
    cur.execute("""
        CREATE TABLE IF NOT EXISTS verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            claim_text TEXT NOT NULL,
            category TEXT,
            verdict TEXT,
            verdict_label TEXT,
            verdict_badge TEXT,
            truth_score REAL,
            earliest_source TEXT,
            earliest_timestamp TEXT,
            earliest_url TEXT,
            official_source_url TEXT,
            explanation TEXT,
            data_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES app_users(id)
        )
    """)

    # Create default demo user if not exists
    cur.execute("SELECT id FROM app_users WHERE email = ?", ("demo@dataecho.com",))
    if not cur.fetchone():
        demo_pw = generate_password_hash("demo123")
        cur.execute(
            "INSERT INTO app_users (name, email, password_hash) VALUES (?, ?, ?)",
            ("Demo User", "demo@dataecho.com", demo_pw)
        )
        print("   👤 Created default demo user (demo@dataecho.com / demo123)")

    # Import network_users if empty
    cur.execute("SELECT COUNT(*) FROM network_users")
    if cur.fetchone()[0] == 0:
        users_csv = os.path.join(DATA_DIR, "users.csv")
        if os.path.exists(users_csv):
            print("   📥 Importing network_users from CSV...")
            with open(users_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                rows = [
                    (
                        r["user_id"], r["username"], r["age_group"], r["community_id"],
                        r["platform"], int(r["connections_count"]), float(r["sharing_tendency"]),
                        1 if r["is_verified"] in ("True", "1") else 0,
                        int(r["account_age_months"]), r["activity_level"],
                        float(r["degree_centrality"]), float(r["betweenness_centrality"])
                    )
                    for r in reader
                ]
                cur.executemany("""
                    INSERT INTO network_users (
                        user_id, username, age_group, community_id, platform,
                        connections_count, sharing_tendency, is_verified,
                        account_age_months, activity_level, degree_centrality,
                        betweenness_centrality
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, rows)
            print(f"      Imported {len(rows)} users.")

    # Import connections if empty
    cur.execute("SELECT COUNT(*) FROM connections")
    if cur.fetchone()[0] == 0:
        conns_csv = os.path.join(DATA_DIR, "connections.csv")
        if os.path.exists(conns_csv):
            print("   📥 Importing connections from CSV...")
            with open(conns_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                rows = [
                    (r["user_id_1"], r["user_id_2"], float(r["connection_strength"]), r["interaction_frequency"])
                    for r in reader
                ]
                cur.executemany("""
                    INSERT INTO connections (user_id_1, user_id_2, connection_strength, interaction_frequency)
                    VALUES (?, ?, ?, ?)
                """, rows)
            print(f"      Imported {len(rows)} connections.")

    # Import incidents if empty
    cur.execute("SELECT COUNT(*) FROM incidents")
    if cur.fetchone()[0] == 0:
        inc_csv = os.path.join(DATA_DIR, "incidents.csv")
        if os.path.exists(inc_csv):
            print("   📥 Importing incidents from CSV...")
            with open(inc_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                rows = [
                    (
                        int(r["incident_id"]), r["title"], r["category"], r["claim_text"],
                        r["source_platform"], r["fact_check_label"], r["severity"],
                        r["origin_region"], r["virality_level"], float(r["sharing_probability"]),
                        r["icon"], r["origin_user_id"], int(r["total_reached"]),
                        float(r["reach_percentage"]), int(r["propagation_steps"]),
                        int(r["communities_affected"])
                    )
                    for r in reader
                ]
                cur.executemany("""
                    INSERT INTO incidents (
                        incident_id, title, category, claim_text, source_platform,
                        fact_check_label, severity, origin_region, virality_level,
                        sharing_probability, icon, origin_user_id, total_reached,
                        reach_percentage, propagation_steps, communities_affected
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, rows)
            print(f"      Imported {len(rows)} incidents.")

    # Import propagation_logs if empty
    cur.execute("SELECT COUNT(*) FROM propagation_logs")
    if cur.fetchone()[0] == 0:
        prop_csv = os.path.join(DATA_DIR, "propagation_log.csv")
        if os.path.exists(prop_csv):
            print("   📥 Importing propagation_logs from CSV...")
            with open(prop_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                rows = [
                    (
                        int(r["log_id"]), int(r["incident_id"]), r["from_user_id"],
                        r["to_user_id"], int(r["timestamp_step"]),
                        1 if r["was_shared"] in ("True", "1") else 0,
                        float(r["sharing_probability_used"]),
                        int(r["propagation_depth"]), r["community_id"]
                    )
                    for r in reader
                ]
                cur.executemany("""
                    INSERT INTO propagation_logs (
                        log_id, incident_id, from_user_id, to_user_id,
                        timestamp_step, was_shared, sharing_probability_used,
                        propagation_depth, community_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, rows)
            print(f"      Imported {len(rows)} propagation logs.")

    conn.commit()
    conn.close()
    print("✅ SQLite Database ready at:", DB_PATH)


if __name__ == "__main__":
    init_db()
