"""
Data Echo — Dataset Generator
Generates a synthetic social network with 2500 users, connections,
10 misinformation incidents, and propagation logs using DSA concepts.
"""
import csv
import os
import random
import math
from collections import deque

random.seed(42)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

# ────────────────────────────────────────────
# 1. INCIDENTS (10 records)
# ────────────────────────────────────────────
INCIDENTS = [
    {
        "incident_id": 1,
        "title": "COVID Vaccine Microchip",
        "category": "Health",
        "claim_text": "COVID-19 vaccines contain microchips designed to track people via 5G networks.",
        "source_platform": "WhatsApp",
        "fact_check_label": "false",
        "severity": "high",
        "origin_region": "Global",
        "virality_level": "viral",
        "sharing_probability": 0.35,
        "icon": "🦠",
    },
    {
        "incident_id": 2,
        "title": "College Closure Rumour",
        "category": "Education",
        "claim_text": "XYZ Engineering College will remain closed for the entire week due to a pest control emergency.",
        "source_platform": "WhatsApp",
        "fact_check_label": "false",
        "severity": "medium",
        "origin_region": "Local",
        "virality_level": "moderate",
        "sharing_probability": 0.50,
        "icon": "🏫",
    },
    {
        "incident_id": 3,
        "title": "Tsunami Warning Hoax",
        "category": "Disaster",
        "claim_text": "A massive tsunami is expected to hit the eastern coast within the next 6 hours. Evacuate immediately.",
        "source_platform": "Facebook",
        "fact_check_label": "false",
        "severity": "critical",
        "origin_region": "Coastal",
        "virality_level": "viral",
        "sharing_probability": 0.60,
        "icon": "🌊",
    },
    {
        "incident_id": 4,
        "title": "Miracle Turmeric Cure",
        "category": "Health",
        "claim_text": "Drinking warm lemon water with turmeric every morning can cure diabetes and prevent cancer.",
        "source_platform": "Instagram",
        "fact_check_label": "mixed",
        "severity": "medium",
        "origin_region": "National",
        "virality_level": "moderate",
        "sharing_probability": 0.40,
        "icon": "💊",
    },
    {
        "incident_id": 5,
        "title": "5G Health Conspiracy",
        "category": "Technology",
        "claim_text": "5G towers emit radiation that weakens the immune system and causes respiratory illness.",
        "source_platform": "Twitter",
        "fact_check_label": "false",
        "severity": "high",
        "origin_region": "Global",
        "virality_level": "viral",
        "sharing_probability": 0.30,
        "icon": "📱",
    },
    {
        "incident_id": 6,
        "title": "Election Rigging Claim",
        "category": "Politics",
        "claim_text": "EVMs were hacked to manipulate results in the recent state election.",
        "source_platform": "Twitter",
        "fact_check_label": "false",
        "severity": "critical",
        "origin_region": "National",
        "virality_level": "viral",
        "sharing_probability": 0.45,
        "icon": "🗳️",
    },
    {
        "incident_id": 7,
        "title": "Bank Account Freeze Alert",
        "category": "Finance",
        "claim_text": "RBI will freeze all savings accounts above 1 lakh from next Monday.",
        "source_platform": "WhatsApp",
        "fact_check_label": "false",
        "severity": "high",
        "origin_region": "National",
        "virality_level": "viral",
        "sharing_probability": 0.55,
        "icon": "🏦",
    },
    {
        "incident_id": 8,
        "title": "Drinking Water Contamination",
        "category": "Environment",
        "claim_text": "City water supply has been contaminated with toxic industrial chemicals since last week.",
        "source_platform": "Facebook",
        "fact_check_label": "mixed",
        "severity": "high",
        "origin_region": "Local",
        "virality_level": "moderate",
        "sharing_probability": 0.45,
        "icon": "💧",
    },
    {
        "incident_id": 9,
        "title": "Free Government Laptop Scheme",
        "category": "Government",
        "claim_text": "Government is giving free laptops to all college students via a registration link.",
        "source_platform": "Instagram",
        "fact_check_label": "false",
        "severity": "medium",
        "origin_region": "National",
        "virality_level": "high",
        "sharing_probability": 0.50,
        "icon": "💻",
    },
    {
        "incident_id": 10,
        "title": "Earthquake Prediction",
        "category": "Disaster",
        "claim_text": "Scientists predict an 8.5 magnitude earthquake in Delhi within 48 hours.",
        "source_platform": "Twitter",
        "fact_check_label": "false",
        "severity": "critical",
        "origin_region": "Regional",
        "virality_level": "viral",
        "sharing_probability": 0.55,
        "icon": "🌍",
    },
]

# ────────────────────────────────────────────
# 2. USERS (2500 records) — Scale-Free Network
# ────────────────────────────────────────────
NUM_USERS = 2500
COMMUNITIES = ["Students", "Parents", "Professionals", "News_Enthusiasts", "Local_Community"]
PLATFORMS = ["WhatsApp", "Twitter", "Facebook", "Instagram", "Telegram"]
AGE_GROUPS = ["18-24", "25-34", "35-44", "45-54", "55+"]

def generate_users():
    users = []
    for i in range(1, NUM_USERS + 1):
        uid = f"U{i:04d}"
        community = random.choice(COMMUNITIES)
        age = random.choices(AGE_GROUPS, weights=[30, 25, 20, 15, 10])[0]
        platform = random.choice(PLATFORMS)
        sharing = round(random.betavariate(2, 5), 2)  # most users share rarely
        activity = random.choices(["low", "medium", "high"], weights=[40, 40, 20])[0]
        verified = random.random() < 0.05  # 5% verified
        acct_age = random.randint(1, 120)
        users.append({
            "user_id": uid,
            "username": f"user_{i}",
            "age_group": age,
            "community_id": community,
            "platform": platform,
            "sharing_tendency": sharing,
            "is_verified": verified,
            "account_age_months": acct_age,
            "activity_level": activity,
        })
    return users


# ────────────────────────────────────────────
# 3. CONNECTIONS — Barabási-Albert preferential attachment
# ────────────────────────────────────────────
def generate_connections(users, m=3):
    """
    Generate a scale-free network using simplified Barabási-Albert model.
    m = number of edges each new node attaches to existing nodes.
    DSA: Adjacency list, random weighted selection (like priority queue concept).
    """
    n = len(users)
    adj = {u["user_id"]: set() for u in users}
    degree = {u["user_id"]: 0 for u in users}
    edges = []
    uids = [u["user_id"] for u in users]

    # Start with a small fully-connected seed of m+1 nodes
    seed = uids[:m + 1]
    for i in range(len(seed)):
        for j in range(i + 1, len(seed)):
            adj[seed[i]].add(seed[j])
            adj[seed[j]].add(seed[i])
            degree[seed[i]] += 1
            degree[seed[j]] += 1

    # Attach remaining nodes using preferential attachment
    for idx in range(m + 1, n):
        new_node = uids[idx]
        existing = uids[:idx]
        total_deg = sum(degree[e] for e in existing) or 1
        probs = [degree[e] / total_deg for e in existing]

        # Pick m distinct targets weighted by degree
        targets = set()
        attempts = 0
        while len(targets) < m and attempts < m * 10:
            r = random.random()
            cumulative = 0
            for k, p in enumerate(probs):
                cumulative += p
                if r <= cumulative:
                    targets.add(existing[k])
                    break
            attempts += 1

        for t in targets:
            adj[new_node].add(t)
            adj[t].add(new_node)
            degree[new_node] += 1
            degree[t] += 1

    # Add some intra-community edges for clustering
    community_map = {}
    for u in users:
        community_map.setdefault(u["community_id"], []).append(u["user_id"])

    for comm, members in community_map.items():
        extra = int(len(members) * 0.15)
        for _ in range(extra):
            a, b = random.sample(members, 2)
            if b not in adj[a]:
                adj[a].add(b)
                adj[b].add(a)
                degree[a] += 1
                degree[b] += 1

    # Build edge list
    seen = set()
    for u, neighbors in adj.items():
        for v in neighbors:
            key = tuple(sorted([u, v]))
            if key not in seen:
                seen.add(key)
                u_comm = next(x["community_id"] for x in users if x["user_id"] == u) if len(users) < 100 else ""
                v_comm = next(x["community_id"] for x in users if x["user_id"] == v) if len(users) < 100 else ""
                edges.append({
                    "user_id_1": key[0],
                    "user_id_2": key[1],
                    "connection_strength": round(random.uniform(0.1, 1.0), 2),
                    "interaction_frequency": random.choice(["daily", "weekly", "monthly", "rare"]),
                })

    return adj, degree, edges


# ────────────────────────────────────────────
# 4. GRAPH ALGORITHMS — BFS Propagation
# ────────────────────────────────────────────
def bfs_propagation(adj, users_dict, source_id, sharing_prob, max_steps=15):
    """
    BFS-based misinformation propagation simulation.
    DSA: Queue (deque), BFS, Hash Set, Hash Map.
    """
    visited = {source_id}
    queue = deque([(source_id, 0)])  # (user_id, step)
    log = []
    step_counts = {0: 1}
    total = 1

    while queue:
        user, step = queue.popleft()
        if step >= max_steps:
            continue
        next_step = step + 1

        neighbors = list(adj.get(user, []))
        random.shuffle(neighbors)

        for nb in neighbors:
            if nb in visited:
                continue
            # Probability-based sharing
            user_tendency = users_dict[nb]["sharing_tendency"]
            prob = sharing_prob * (0.5 + user_tendency)
            prob = min(prob, 0.95)

            if random.random() < prob:
                visited.add(nb)
                queue.append((nb, next_step))
                total += 1
                step_counts[next_step] = step_counts.get(next_step, 0) + 1
                log.append({
                    "from_user_id": user,
                    "to_user_id": nb,
                    "timestamp_step": next_step,
                    "was_shared": True,
                    "sharing_probability_used": round(prob, 3),
                    "propagation_depth": next_step,
                    "community_id": users_dict[nb]["community_id"],
                })

    return visited, step_counts, log


# ────────────────────────────────────────────
# 5. DEGREE CENTRALITY & BETWEENNESS (simplified)
# ────────────────────────────────────────────
def compute_degree_centrality(adj, n):
    """DSA: Hash map iteration."""
    return {uid: len(neighbors) / (n - 1) for uid, neighbors in adj.items()}


def compute_betweenness_sample(adj, sample_size=80):
    """
    Approximate betweenness centrality using BFS from a sample of nodes.
    DSA: BFS, Queue, shortest-path counting.
    """
    all_nodes = list(adj.keys())
    betweenness = {n: 0.0 for n in all_nodes}
    sources = random.sample(all_nodes, min(sample_size, len(all_nodes)))

    for s in sources:
        # BFS
        stack = []
        pred = {n: [] for n in all_nodes}
        sigma = {n: 0 for n in all_nodes}
        sigma[s] = 1
        dist = {n: -1 for n in all_nodes}
        dist[s] = 0
        queue = deque([s])

        while queue:
            v = queue.popleft()
            stack.append(v)
            for w in adj.get(v, []):
                if dist[w] < 0:
                    dist[w] = dist[v] + 1
                    queue.append(w)
                if dist[w] == dist[v] + 1:
                    sigma[w] += sigma[v]
                    pred[w].append(v)

        delta = {n: 0.0 for n in all_nodes}
        while stack:
            w = stack.pop()
            for v in pred[w]:
                if sigma[w] > 0:
                    delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w])
            if w != s:
                betweenness[w] += delta[w]

    # Normalize
    n = len(all_nodes)
    factor = 1.0 / (sample_size * (n - 1) * (n - 2)) if n > 2 else 1.0
    for node in betweenness:
        betweenness[node] *= factor
        betweenness[node] = round(betweenness[node], 6)

    return betweenness


# ────────────────────────────────────────────
# 6. MAIN GENERATION
# ────────────────────────────────────────────
def main():
    print("📡 Data Echo — Generating Dataset...")
    print(f"   Users: {NUM_USERS}")

    # Generate users
    print("   [1/6] Generating users...")
    users = generate_users()
    users_dict = {u["user_id"]: u for u in users}

    # Generate connections
    print("   [2/6] Building scale-free network (Barabási-Albert)...")
    adj, degree, edges = generate_connections(users)
    print(f"         {len(edges)} connections created")

    # Update user connection counts
    for u in users:
        u["connections_count"] = degree.get(u["user_id"], 0)

    # Compute centrality
    print("   [3/6] Computing degree centrality...")
    deg_cent = compute_degree_centrality(adj, NUM_USERS)

    print("   [4/6] Computing betweenness centrality (sampled BFS)...")
    betw_cent = compute_betweenness_sample(adj, sample_size=60)

    for u in users:
        u["degree_centrality"] = round(deg_cent.get(u["user_id"], 0), 6)
        u["betweenness_centrality"] = betw_cent.get(u["user_id"], 0)

    # Run propagation for each incident
    print("   [5/6] Simulating propagation for 10 incidents (BFS)...")
    all_propagation = []
    for inc in INCIDENTS:
        iid = inc["incident_id"]
        # Pick a high-degree source node
        sorted_users = sorted(users, key=lambda u: u["connections_count"], reverse=True)
        source = sorted_users[iid - 1]["user_id"]  # different source per incident
        inc["origin_user_id"] = source

        reached, step_counts, logs = bfs_propagation(
            adj, users_dict, source, inc["sharing_probability"]
        )
        inc["total_reached"] = len(reached)
        inc["reach_percentage"] = round(len(reached) / NUM_USERS * 100, 1)
        inc["propagation_steps"] = max(step_counts.keys()) if step_counts else 0

        # Count communities affected
        comms = set()
        for uid in reached:
            comms.add(users_dict[uid]["community_id"])
        inc["communities_affected"] = len(comms)

        for log_entry in logs:
            log_entry["incident_id"] = iid
            log_entry["log_id"] = len(all_propagation) + 1
            all_propagation.append(log_entry)

        print(f"         Incident {iid}: {inc['title']} → {inc['total_reached']} users reached ({inc['reach_percentage']}%)")

    # ── Save CSVs ──
    print("   [6/6] Writing CSV files...")

    # users.csv
    user_fields = [
        "user_id", "username", "age_group", "community_id", "platform",
        "connections_count", "sharing_tendency", "is_verified",
        "account_age_months", "activity_level", "degree_centrality",
        "betweenness_centrality",
    ]
    with open(os.path.join(DATA_DIR, "users.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=user_fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(users)

    # connections.csv
    conn_fields = ["user_id_1", "user_id_2", "connection_strength", "interaction_frequency"]
    with open(os.path.join(DATA_DIR, "connections.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=conn_fields)
        w.writeheader()
        w.writerows(edges)

    # incidents.csv
    inc_fields = [
        "incident_id", "title", "category", "claim_text", "source_platform",
        "fact_check_label", "severity", "origin_region", "virality_level",
        "sharing_probability", "icon", "origin_user_id", "total_reached",
        "reach_percentage", "propagation_steps", "communities_affected",
    ]
    with open(os.path.join(DATA_DIR, "incidents.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=inc_fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(INCIDENTS)

    # propagation_log.csv
    prop_fields = [
        "log_id", "incident_id", "from_user_id", "to_user_id",
        "timestamp_step", "was_shared", "sharing_probability_used",
        "propagation_depth", "community_id",
    ]
    with open(os.path.join(DATA_DIR, "propagation_log.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=prop_fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(all_propagation)

    print(f"\n✅ Dataset generated successfully!")
    print(f"   📄 users.csv          → {len(users)} records")
    print(f"   📄 connections.csv     → {len(edges)} records")
    print(f"   📄 incidents.csv       → {len(INCIDENTS)} records")
    print(f"   📄 propagation_log.csv → {len(all_propagation)} records")
    print(f"   📁 Location: {DATA_DIR}")


if __name__ == "__main__":
    main()
