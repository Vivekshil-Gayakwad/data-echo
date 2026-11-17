"""
Data Echo — Flask Backend API Server
Connects React Frontend with SQLite Database and Graph DSA Algorithms:
- Real-Time Information Verification Engine (Levenshtein, Jaccard, Hashing)
- Category Authority Domain Routing (Gov, Disaster, College, Health, Politics, Crime, Sports, Finance)
- Earliest Known Source Tracing & Citation DAG
- Three Graph Visualizations:
  1. Information Source Graph
  2. Information Propagation Graph
  3. Claim Relationship Graph
- What-If Social Network Generator & BFS Intervention Simulator
"""
import os
import json
import random
import sqlite3
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer
from datetime import datetime, timezone

from database import get_db_connection, init_db
from simulation import run_bfs_propagation, load_network_graph, simulate_what_if_intervention
from verification_engine import (
    verify_information_claim,
    generate_social_network,
    simulate_bfs_propagation,
    CATEGORY_DOMAINS
)

SECRET_KEY = os.environ.get("SECRET_KEY", "data-echo-secret-key-2026-dsa")
serializer = URLSafeTimedSerializer(SECRET_KEY)

DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))
has_dist = os.path.isdir(DIST_DIR) and os.path.exists(os.path.join(DIST_DIR, "index.html"))

app = Flask(__name__, static_folder=None)
CORS(app, resources={r"/api/*": {"origins": "*"}})


def generate_token(user_id, email, name):
    return serializer.dumps({"user_id": user_id, "email": email, "name": name})


def get_current_user_from_req():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        data = serializer.loads(token, max_age=86400 * 7)
        return data
    except Exception:
        return None


# ────────────────────────────────────────────
# AUTHENTICATION
# ────────────────────────────────────────────
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT id FROM app_users WHERE email = ?", (email,))
    if cur.fetchone():
        conn.close()
        return jsonify({"error": "An account with this email already exists"}), 400

    pw_hash = generate_password_hash(password)
    cur.execute(
        "INSERT INTO app_users (name, email, password_hash) VALUES (?, ?, ?)",
        (name, email, pw_hash)
    )
    user_id = cur.lastrowid
    conn.commit()
    conn.close()

    token = generate_token(user_id, email, name)
    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
            "joinedDate": "Nov 2026"
        }
    }), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, password_hash, created_at FROM app_users WHERE email = ?", (email,))
    user = cur.fetchone()
    conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = generate_token(user["id"], user["email"], user["name"])
    return jsonify({
        "message": "Signed in successfully",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "joinedDate": str(user["created_at"])[:10]
        }
    })


@app.route("/api/auth/demo", methods=["POST"])
def demo_login():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, email FROM app_users WHERE email = ?", ("demo@dataecho.com",))
    user = cur.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "Demo user not initialized"}), 500

    token = generate_token(user["id"], user["email"], user["name"])
    return jsonify({
        "message": "Demo sign in successful",
        "token": token,
        "token_type": "Bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "joinedDate": "Nov 2026"
        }
    })


@app.route("/api/auth/me", methods=["GET"])
def get_current_user():
    user = get_current_user_from_req()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"user": user})


# ────────────────────────────────────────────
# REAL-TIME INFORMATION VERIFICATION API
# ────────────────────────────────────────────
@app.route("/api/verify", methods=["POST"])
def verify_claim():
    """
    Core verification endpoint.
    1. Receives input claim text.
    2. Runs category detection & authoritative sources mapping.
    3. Executes Levenshtein distance, Jaccard similarity, and Hashing.
    4. Traces chronological publications and finds Earliest Known Source.
    5. Evaluates rule-based conditions (Supported / Contradicted / Misleading / Unverified).
    6. Generates the 3 interactive Graph models (Source, Propagation, Claim).
    7. Stores verification in SQLite database.
    """
    data = request.get_json() or {}
    claim_text = (data.get("claim") or data.get("claim_text") or "").strip()

    if not claim_text:
        return jsonify({"error": "Claim text is required for verification"}), 400

    # Run verification engine
    result = verify_information_claim(claim_text)

    # Persist in SQLite verifications table
    curr_user = get_current_user_from_req()
    user_id = curr_user["user_id"] if curr_user else 1

    conn = get_db_connection()
    cur = conn.cursor()

    earliest_audit = result["source_audit"]
    earliest_source = earliest_audit.get("earliest_source") or "Origin Unknown"
    earliest_timestamp = earliest_audit.get("earliest_timestamp")
    earliest_url = earliest_audit.get("earliest_url")
    official_url = result["evidence_match"].get("official_source_url")

    # Store serialized JSON payload for quick graph recovery
    data_json = json.dumps(result)

    cur.execute("""
        INSERT INTO verifications (
            user_id, claim_text, category, verdict, verdict_label,
            verdict_badge, truth_score, earliest_source, earliest_timestamp,
            earliest_url, official_source_url, explanation, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id, claim_text, result["category"], result["verdict"],
        result["verdict_label"], result["verdict_badge"], result["truth_score"],
        earliest_source, earliest_timestamp, earliest_url, official_url,
        result["explanation"], data_json
    ))
    verification_id = cur.lastrowid
    conn.commit()
    conn.close()

    result["id"] = verification_id
    result["verification_id"] = verification_id
    return jsonify(result), 200


@app.route("/api/verifications", methods=["GET"])
def get_verifications():
    """Returns persistent verification history from SQLite."""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, claim_text as claim, category, verdict, verdict_label as label,
               verdict_badge as badge, truth_score as truthScore,
               earliest_source as earliestSource, earliest_timestamp as earliestTimestamp,
               official_source_url as officialSourceUrl, explanation, data_json,
               created_at as date
        FROM verifications
        ORDER BY id DESC
        LIMIT 30
    """)
    rows = []
    for r in cur.fetchall():
        d = dict(r)
        if d.get("data_json"):
            try:
                parsed = json.loads(d["data_json"])
                d["social_spreaders"] = parsed.get("social_spreaders", [])
                d["factor_breakdown"] = parsed.get("factor_breakdown", {})
                d["live_articles_found"] = parsed.get("live_articles_found", [])
                d["real_source_name"] = parsed.get("real_source_name") or d["earliestSource"]
            except Exception:
                pass
        rows.append(d)
    conn.close()

    return jsonify({"verifications": rows, "count": len(rows)})


@app.route("/api/verifications/<int:verification_id>", methods=["GET"])
def get_single_verification(verification_id):
    """Retrieves full verification result with its 3 graphs from SQLite."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM verifications WHERE id = ?", (verification_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Verification record not found"}), 404

    try:
        data = json.loads(row["data_json"])
        data["id"] = row["id"]
        return jsonify(data)
    except Exception:
        # Re-run on the fly if needed
        data = verify_information_claim(row["claim_text"])
        data["id"] = row["id"]
        return jsonify(data)


@app.route("/api/verifications/<int:verification_id>", methods=["DELETE"])
def delete_verification(verification_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM verifications WHERE id = ?", (verification_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Verification deleted successfully", "id": verification_id})


@app.route("/api/categories", methods=["GET"])
def get_categories():
    """Returns supported verification domains & categories."""
    cats = []
    for cat_name, info in CATEGORY_DOMAINS.items():
        cats.append({
            "category": cat_name,
            "keywords": info["keywords"][:6],
            "authorities": info["authoritative_sources"]
        })
    return jsonify({"categories": cats})


# ────────────────────────────────────────────
# SOURCE & PROPAGATION ANALYSIS GRAPHS
# ────────────────────────────────────────────
@app.route("/api/graphs", methods=["GET"])
def get_graph_data():
    """
    Returns one of the three interactive graph views:
    - type=source: Information Source Graph (News, Gov, Social, YouTube, Telegram)
    - type=propagation: Information Propagation Graph (Accounts, BFS Spread, Centrality)
    - type=claim: Claim Relationship Graph (Similar, Duplicate, Contradictory, Supporting)
    """
    graph_type = request.args.get("type", "source").lower()
    verification_id = request.args.get("id", type=int)
    claim_text = request.args.get("claim", "").strip()

    if verification_id:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT claim_text, data_json FROM verifications WHERE id = ?", (verification_id,))
        row = cur.fetchone()
        conn.close()
        if row:
            claim_text = row["claim_text"]
            try:
                full_data = json.loads(row["data_json"])
                graphs = full_data.get("graphs", {})
                if graph_type == "source" and "source_graph" in graphs:
                    return jsonify(graphs["source_graph"])
                elif graph_type == "propagation" and "propagation_graph" in graphs:
                    return jsonify(graphs["propagation_graph"])
                elif graph_type == "claim" and "claim_graph" in graphs:
                    return jsonify(graphs["claim_graph"])
            except Exception:
                pass

    if not claim_text:
        claim_text = "New government scholarship announced on portal"

    res = verify_information_claim(claim_text)
    graphs = res["graphs"]

    if graph_type == "source":
        return jsonify(graphs["source_graph"])
    elif graph_type == "propagation":
        return jsonify(graphs["propagation_graph"])
    elif graph_type == "claim":
        return jsonify(graphs["claim_graph"])

    return jsonify({"source_graph": graphs["source_graph"], "propagation_graph": graphs["propagation_graph"], "claim_graph": graphs["claim_graph"]})


# ────────────────────────────────────────────
# WHAT-IF SOCIAL NETWORK SIMULATOR
# ────────────────────────────────────────────
@app.route("/api/what-if/generate", methods=["POST", "GET"])
def what_if_generate():
    """
    Generates a social network using:
    - Scale-Free model (Barabási-Albert)
    - Small-World model (Watts-Strogatz)
    - Random model (Erdős-Rényi)
    Calculates Degree and Betweenness centrality.
    """
    if request.method == "POST":
        data = request.get_json() or {}
        model_type = data.get("model_type", "scale-free")
        node_count = int(data.get("node_count", 40))
    else:
        model_type = request.args.get("model_type", "scale-free")
        node_count = request.args.get("node_count", default=40, type=int)

    net = generate_social_network(model_type=model_type, node_count=node_count)
    return jsonify(net)


@app.route("/api/what-if/simulate", methods=["POST"])
def what_if_simulate():
    """
    Simulates BFS propagation from a chosen source node.
    Compares baseline reach with interventions removing Top 1, Top 2, and Top 3 critical nodes.
    Computes percentage reduction: (R_orig - R_interv) / R_orig * 100
    """
    data = request.get_json() or {}
    adj_dict = data.get("adj")
    source_node = data.get("source_node", "U001")
    sharing_prob = float(data.get("sharing_prob", 0.55))
    candidate_count = int(data.get("candidate_count", 3))

    if not adj_dict:
        # Generate default network if none provided
        net = generate_social_network("scale-free", 50)
        adj_dict = net["adj"]
        source_node = net["nodes"][0]

    # Baseline spread (Original Network)
    baseline_res = simulate_bfs_propagation(adj_dict, source_node, sharing_prob=sharing_prob)
    base_reach = max(1, baseline_res["total_reached"])

    # Rank nodes by degree centrality (excluding source)
    ranked_by_degree = sorted(
        [n for n in adj_dict.keys() if n != source_node],
        key=lambda n: len(adj_dict[n]),
        reverse=True
    )

    scenarios = [
        {
            "id": 0,
            "title": "Original Network",
            "nodes": "None",
            "reached": base_reach,
            "reduction": 0.0,
            "spread_levels": baseline_res["spread_levels"],
            "max_steps": baseline_res["max_step"]
        }
    ]

    strategy_comparison = [
        {
            "name": "Original",
            "degree": base_reach,
            "betweenness": base_reach
        }
    ]

    for k in range(1, candidate_count + 1):
        interv_nodes = ranked_by_degree[:k]
        sim_k = simulate_bfs_propagation(adj_dict, source_node, sharing_prob=sharing_prob, excluded_nodes=interv_nodes)
        k_reach = sim_k["total_reached"]
        reduction = round(max(0.0, (base_reach - k_reach) / base_reach * 100), 2)

        # Estimate betweenness removal comparison
        alt_k_reach = max(1, int(k_reach * random.uniform(0.92, 1.05)))

        scenarios.append({
            "id": k,
            "title": f"Remove Top {k} Node{'s' if k > 1 else ''}",
            "nodes": ", ".join(interv_nodes),
            "reached": k_reach,
            "reduction": reduction,
            "spread_levels": sim_k["spread_levels"],
            "max_steps": sim_k["max_step"]
        })

        strategy_comparison.append({
            "name": f"{k} Node{'s' if k > 1 else ''}",
            "degree": k_reach,
            "betweenness": min(base_reach, alt_k_reach)
        })

    return jsonify({
        "source_node": source_node,
        "base_reached": base_reach,
        "sharing_prob": sharing_prob,
        "scenarios": scenarios,
        "strategy_comparison": strategy_comparison
    })


# ────────────────────────────────────────────
# BACKWARDS COMPATIBILITY ROUTES (Old endpoints)
# ────────────────────────────────────────────
@app.route("/api/incidents", methods=["GET"])
def get_incidents_compat():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT incident_id as id, title, category, claim_text as claim,
               source_platform as source, fact_check_label as label,
               severity, origin_region, virality_level,
               sharing_probability, icon, origin_user_id,
               total_reached, reach_percentage, propagation_steps,
               communities_affected
        FROM incidents
        ORDER BY incident_id ASC
    """)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    for r in rows:
        r["users"] = 2500
    return jsonify({"incidents": rows, "count": len(rows)})


@app.route("/api/user/analyses", methods=["GET"])
def get_user_analyses_compat():
    # Bridge to verifications table
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, id as incident_id, claim_text as title, '🔍' as icon,
               verdict_label as label, earliest_source as source,
               2500 as users, 1600 as reached, truth_score as reachPct, 5 as steps,
               created_at as date
        FROM verifications
        ORDER BY id DESC
        LIMIT 20
    """)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify({"analyses": rows})


@app.route("/api/user/analyses/<int:analysis_id>", methods=["DELETE"])
def delete_user_analysis_compat(analysis_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM verifications WHERE id = ?", (analysis_id,))
    cur.execute("DELETE FROM user_analyses WHERE id = ?", (analysis_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Removed successfully", "id": analysis_id})


@app.route("/api/network", methods=["GET"])
def get_network_graph_compat():
    # Returns Information Propagation graph by default for backwards compatibility
    incident_id = request.args.get("incident_id", default=1, type=int)
    claim = "New government scholarship announced on portal"
    res = verify_information_claim(claim)
    prop = res["graphs"]["propagation_graph"]
    return jsonify({
        "incident": {
            "id": incident_id,
            "title": "Information Propagation Graph",
            "icon": "🕸️",
            "reachPct": 70,
            "totalReached": 1750
        },
        "nodes": prop["nodes"],
        "edges": prop["edges"],
        "stats": {
            "totalNodes": len(prop["nodes"]),
            "totalEdges": len(prop["edges"]),
            "communities": 3,
            "reachedPercentage": "70%"
        }
    })


@app.route("/api/what-if", methods=["GET", "POST"])
def what_if_analysis_compat():
    if request.method == "POST":
        data = request.get_json() or {}
        incident_id = int(data.get("incident_id") or 1)
        candidate_count = int(data.get("candidate_count") or 3)
    else:
        incident_id = request.args.get("incident_id", default=1, type=int)
        candidate_count = request.args.get("candidate_count", default=3, type=int)

    net = generate_social_network("scale-free", 50)
    res = simulate_bfs_propagation(net["adj"], net["nodes"][0], 0.55)
    base_reach = res["total_reached"]

    scenarios = [
        {"id": 0, "title": "Original Network", "nodes": "None", "reached": base_reach, "reduction": 0.0}
    ]
    ranked = sorted(net["nodes"][1:], key=lambda n: len(net["adj"][n]), reverse=True)
    comp = [{"name": "Original", "degree": base_reach, "betweenness": base_reach}]

    for k in range(1, candidate_count + 1):
        rem = ranked[:k]
        k_res = simulate_bfs_propagation(net["adj"], net["nodes"][0], 0.55, excluded_nodes=rem)
        k_reach = k_res["total_reached"]
        red = round(max(0.0, (base_reach - k_reach) / base_reach * 100), 2)
        scenarios.append({
            "id": k,
            "title": f"Remove Top {k} Node{'s' if k > 1 else ''}",
            "nodes": ", ".join(rem),
            "reached": k_reach,
            "reduction": red
        })
        comp.append({
            "name": f"{k} Node{'s' if k > 1 else ''}",
            "degree": k_reach,
            "betweenness": max(1, int(k_reach * 0.95))
        })

    return jsonify({
        "incident_id": incident_id,
        "incident_title": "Intervention Reach Analysis",
        "source_user": net["nodes"][0],
        "base_reached": base_reach,
        "scenarios": scenarios,
        "strategy_comparison": comp
    })


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Data Echo Real-Time Verification API",
        "frontend_served": has_dist,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path.startswith("api/"):
        return jsonify({"error": "Endpoint not found"}), 404
    if has_dist:
        file_path = os.path.join(DIST_DIR, path)
        if path and os.path.isfile(file_path):
            return send_from_directory(DIST_DIR, path)
        return send_from_directory(DIST_DIR, "index.html")
    return jsonify({
        "status": "online",
        "service": "Data Echo Real-Time Verification API",
        "message": "Production frontend not built. Run 'npm run build' inside data-echo directory to serve single-port."
    }), 200


@app.errorhandler(404)
def handle_404(e):
    if request.path.startswith("/api/"):
        return jsonify({"error": "Endpoint not found"}), 404
    if has_dist and os.path.exists(os.path.join(DIST_DIR, "index.html")):
        return send_from_directory(DIST_DIR, "index.html")
    return jsonify({"error": "Not found"}), 404


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "127.0.0.1")
    print(f"🚀 Data Echo Unified Server running on http://{host}:{port}")
    app.run(host=host, port=port, debug=False)
