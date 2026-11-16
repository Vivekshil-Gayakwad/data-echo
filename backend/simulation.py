"""
Data Echo — Simulation & Graph DSA Engine
Implements graph algorithms: BFS propagation, Degree Centrality, Betweenness,
and What-If intervention analysis with node removal.
"""
from collections import deque
import random
from database import get_db_connection

def load_network_graph(excluded_nodes=None):
    """
    Loads network adjacency list from SQLite connections table,
    excluding specified nodes (for What-If intervention simulation).
    DSA: Adjacency List (Hash Map of Sets).
    """
    excluded = set(excluded_nodes) if excluded_nodes else set()
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT user_id_1, user_id_2 FROM connections")
    rows = cur.fetchall()
    conn.close()

    adj = {}
    for r in rows:
        u, v = r["user_id_1"], r["user_id_2"]
        if u in excluded or v in excluded:
            continue
        if u not in adj:
            adj[u] = set()
        if v not in adj:
            adj[v] = set()
        adj[u].add(v)
        adj[v].add(u)

    return adj


def run_bfs_propagation(adj, source_id, sharing_prob=0.45, max_steps=12, user_tendencies=None):
    """
    Simulates information spread using BFS on graph adjacency list.
    DSA: BFS traversal, Queue (deque), Visited Set, Hash Map for levels.
    """
    if source_id not in adj:
        return {source_id}, {0: 1}, []

    visited = {source_id}
    queue = deque([(source_id, 0)])
    step_counts = {0: 1}
    logs = []

    while queue:
        curr, step = queue.popleft()
        if step >= max_steps:
            continue
        next_step = step + 1

        neighbors = list(adj.get(curr, []))
        for nb in neighbors:
            if nb in visited:
                continue

            tendency = user_tendencies.get(nb, 0.4) if user_tendencies else 0.4
            prob = min(0.95, sharing_prob * (0.6 + tendency))

            if random.random() < prob:
                visited.add(nb)
                queue.append((nb, next_step))
                step_counts[next_step] = step_counts.get(next_step, 0) + 1
                logs.append((curr, nb, next_step))

    return visited, step_counts, logs


def simulate_what_if_intervention(incident_id, candidate_count=3):
    """
    Simulates What-If scenario on a specific incident:
    1. Finds origin source user for the incident.
    2. Identifies top candidate nodes by Degree and Betweenness centrality.
    3. Simulates spread on original network.
    4. Simulates spread after removing top 1, top 2, and top 3 candidate nodes.
    5. Calculates reach reduction percentage: (R_orig - R_interv) / R_orig * 100.
    """
    conn = get_db_connection()
    cur = conn.cursor()

    # Get incident metadata
    cur.execute("SELECT * FROM incidents WHERE incident_id = ?", (incident_id,))
    inc = cur.fetchone()
    if not inc:
        conn.close()
        return None

    source_id = inc["origin_user_id"]
    sharing_prob = float(inc["sharing_probability"] or 0.45)
    orig_total_reached = int(inc["total_reached"] or 1500)

    # Get top users by degree centrality
    cur.execute("""
        SELECT user_id, connections_count, degree_centrality
        FROM network_users
        WHERE user_id != ?
        ORDER BY degree_centrality DESC
        LIMIT 10
    """, (source_id,))
    top_degree_users = [r["user_id"] for r in cur.fetchall()]

    # Get top users by betweenness centrality
    cur.execute("""
        SELECT user_id, betweenness_centrality
        FROM network_users
        WHERE user_id != ?
        ORDER BY betweenness_centrality DESC
        LIMIT 10
    """, (source_id,))
    top_betweenness_users = [r["user_id"] for r in cur.fetchall()]

    # Get user sharing tendencies
    cur.execute("SELECT user_id, sharing_tendency FROM network_users")
    user_tendencies = {r["user_id"]: float(r["sharing_tendency"]) for r in cur.fetchall()}
    conn.close()

    # Load baseline network
    adj_base = load_network_graph()

    # Original spread
    visited_base, _, _ = run_bfs_propagation(adj_base, source_id, sharing_prob, user_tendencies=user_tendencies)
    base_reach = max(orig_total_reached, len(visited_base))

    scenarios = [
        {
            "id": 0,
            "title": "Original Network",
            "nodes": "None",
            "nodes_list": [],
            "reached": base_reach,
            "reduction": 0.0,
        }
    ]

    strategy_comparison = [
        {
            "name": "Original",
            "degree": base_reach,
            "betweenness": base_reach,
        }
    ]

    # Run for 1, 2, ... candidate_count removals
    for k in range(1, candidate_count + 1):
        deg_nodes = top_degree_users[:k]
        betw_nodes = top_betweenness_users[:k]

        # Simulate Degree strategy
        adj_deg = load_network_graph(excluded_nodes=deg_nodes)
        v_deg, _, _ = run_bfs_propagation(adj_deg, source_id, sharing_prob, user_tendencies=user_tendencies)
        reach_deg = len(v_deg)

        # Simulate Betweenness strategy
        adj_betw = load_network_graph(excluded_nodes=betw_nodes)
        v_betw, _, _ = run_bfs_propagation(adj_betw, source_id, sharing_prob, user_tendencies=user_tendencies)
        reach_betw = len(v_betw)

        # Calculate reduction based on degree strategy
        reduction = round(max(0.0, (base_reach - reach_deg) / base_reach * 100), 2)

        scenarios.append({
            "id": k,
            "title": f"Remove Top {k} Node{'s' if k > 1 else ''}",
            "nodes": ", ".join(deg_nodes),
            "nodes_list": deg_nodes,
            "reached": reach_deg,
            "reduction": reduction,
        })

        strategy_comparison.append({
            "name": f"{k} Node{'s' if k > 1 else ''}",
            "degree": reach_deg,
            "betweenness": reach_betw,
        })

    return {
        "incident_id": incident_id,
        "incident_title": inc["title"],
        "source_user": source_id,
        "base_reached": base_reach,
        "scenarios": scenarios,
        "strategy_comparison": strategy_comparison,
    }
