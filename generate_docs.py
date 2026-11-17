import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_comprehensive_document():
    doc = Document()

    # Set Margins (1 inch all around)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Color Palette Matching Cyber Yellow & Deep Slate
    COLOR_PRIMARY = RGBColor(15, 23, 42)     # #0F172A Slate 900
    COLOR_GOLD = RGBColor(217, 119, 6)       # #D97706 Amber 600
    COLOR_DARK = RGBColor(30, 41, 59)        # #1E293B Slate 800
    COLOR_MUTED = RGBColor(100, 116, 139)    # #64748B Slate 500
    COLOR_EMERALD = RGBColor(16, 185, 129)   # #10B981 Emerald Green

    # Document Header / Title
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    run_title = title_p.add_run("DATA ECHO")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(26)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_PRIMARY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(14)
    run_sub = sub_p.add_run("Real-Time Information Verification & Graph Propagation Intelligence Platform")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(13)
    run_sub.font.bold = True
    run_sub.font.color.rgb = COLOR_GOLD

    meta_p = doc.add_paragraph()
    meta_p.paragraph_format.space_before = Pt(0)
    meta_p.paragraph_format.space_after = Pt(20)
    run_meta = meta_p.add_run("Comprehensive Architectural Specification, Workflow Diagrams, Design System & Technologies | 2026")
    run_meta.font.name = "Arial"
    run_meta.font.size = Pt(10)
    run_meta.font.italic = True
    run_meta.font.color.rgb = COLOR_MUTED

    def add_h1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(18)
        h.paragraph_format.space_after = Pt(6)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(15)
        r.font.bold = True
        r.font.color.rgb = COLOR_PRIMARY
        return h

    def add_h2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.color.rgb = COLOR_GOLD
        return h

    def add_body(text, bold_prefix=""):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.name = "Calibri"
            rb.font.size = Pt(11)
            rb.font.bold = True
            rb.font.color.rgb = COLOR_DARK
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(11)
        r.font.color.rgb = COLOR_DARK
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.name = "Calibri"
            rb.font.size = Pt(11)
            rb.font.bold = True
            rb.font.color.rgb = COLOR_DARK
        r = p.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(11)
        r.font.color.rgb = COLOR_DARK
        return p

    def add_code_block(code_text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(8)
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
        cp = cell.paragraphs[0]
        cp.paragraph_format.space_before = Pt(0)
        cp.paragraph_format.space_after = Pt(0)
        r = cp.add_run(code_text)
        r.font.name = "Consolas"
        r.font.size = Pt(9.0)
        r.font.color.rgb = RGBColor(30, 41, 59)

    # ─────────────────────────────────────────────────────────────
    # 1. EXECUTIVE SUMMARY & PROBLEM STATEMENT
    # ─────────────────────────────────────────────────────────────
    add_h1("1. Executive Summary & Problem Statement")
    add_body("In the modern digital landscape, rumors, unverified assertions, and deliberate misinformation spread across social networks, blogs, and messaging platforms at an unprecedented scale. Due to network effects and algorithmic amplification, unsubstantiated claims reach millions of individuals hours or days before credible fact-checking releases are issued.")
    add_body("Conventional fact-checking repositories operate as static, text-based databases with two major limitations: (1) they lack real-time automated verification against live internet sources, and (2) they fail to analyze or simulate the topological dynamics of how claims propagate across social networks.")
    add_body("Data Echo solves these fundamental challenges by combining real-time multi-source internet verification with classical Graph Data Structures and Algorithms (DSA) to identify the earliest known publisher, evaluate factual veracity, construct multi-layered propagation graphs, and simulate network-level intervention strategies.")

    # ─────────────────────────────────────────────────────────────
    # 2. SYSTEM WORKFLOW & ARCHITECTURAL PIPELINES
    # ─────────────────────────────────────────────────────────────
    add_h1("2. System Workflow & End-to-End Processing Pipelines")
    add_body("The Data Echo platform integrates three interconnected computational workflows:")

    add_h2("2.1 End-to-End Information Verification Workflow")
    add_body("This workflow governs how user claims are ingested, analyzed against the live internet, and evaluated:")
    add_code_block("""[ User Submits Claim ]
          │
          ▼
[ Category & Domain Classifier ] ──> (Gov, Health, Disaster, Sports, Politics, etc.)
          │
          ▼
[ Live Internet Data Harvester ]
    ├── Google News RSS Feed (Real-Time XML Parser)
    └── Wikipedia Knowledge API (Live REST Search)
          │
          ▼
[ Text Normalization & Tokenization ]
          │
          ├──> [ SHA-256 Hashing ] ─────────> Detects Exact Duplicate Publications
          ├──> [ Jaccard Token Overlap ] ───> Measures Keyword Resemblance Set J(A, B)
          └──> [ Levenshtein DP Matrix ] ───> Computes Minimum Edit Distance O(m×n)
          │
          ▼
[ Origin Identification & DAG Sorting ]
    ├── Chronological Publication Sort (t0 <= t1 <= ... <= tn)
    ├── Attribution & Citation Link Extraction (Directed Acyclic Graph)
    └── Determines Earliest Known Publisher (or classifies as "Origin Unknown")
          │
          ▼
[ Rule-Based Verdict Evaluation ] ──> Supported / Contradicted / Misleading / Unverified
          │
          ▼
[ Database Persistence ] ───────────> Stored in SQLite (users & verifications tables)
          │
          ▼
[ Real-Time UI Rendering ] ─────────> Badges, Source Cards, Timestamps, & Similarity %""")

    add_h2("2.2 Graph Dissemination Construction Workflow")
    add_body("Once a claim is verified, Data Echo dynamically constructs three synchronized graph structures:")
    add_bullet("Aggregates publisher websites, authority portals, and social accounts as nodes, connecting them via citation, reference, and repost edges.", "Information Source Graph: ")
    add_bullet("Represents individual accounts as nodes and verified sharing interactions as directed edges to model dissemination cascades.", "Information Propagation Graph: ")
    add_bullet("Represents individual narrative variants as nodes, connecting them with Supporting, Contradictory, or Duplicate relational edges.", "Claim Relationship Graph: ")

    add_h2("2.3 What-If Simulation & Intervention Workflow")
    add_body("The simulation pipeline analyzes how information propagates through a generated social network and evaluates containment strategies:")
    add_code_block("""[ Active Verified Incident Selected ]
          │
          ▼
[ Calibrate Virality Probability (p) ]
    ├── Rumor / Contradicted Claims ───> p ≈ 0.72 (High Virality Spread)
    └── Verified News / Supported Claims ─> p ≈ 0.48 (Standard Virality Spread)
          │
          ▼
[ Social Network Generation ] ────────> Scale-Free (Barabási-Albert) / Small-World (20-100 Nodes)
          │
          ▼
[ Assign Root Seed Node (U001) ] ─────> Bound directly to Verified Real Source Name
          │
          ▼
[ Baseline BFS Propagation ] ─────────> Computes Base Cascade Reach and Level Timestamps
          │
          ▼
[ Centrality Metric Analysis ]
    ├── Degree Centrality: Identifies Super-Spreader Hubs (high connectivity)
    └── Betweenness Centrality: Identifies Critical Bridge Nodes (shortest path brokers)
          │
          ▼
[ Targeted Node Intervention ]
    ├── Quarantine Top 1 Influencer ──> Rerun BFS ──> Compute % Reach Reduction
    ├── Quarantine Top 2 Influencers ─> Rerun BFS ──> Compute % Reach Reduction
    └── Quarantine Top 3 Influencers ─> Rerun BFS ──> Compute % Reach Reduction
          │
          ▼
[ Interactive Comparative Charts ] ───> Degree vs. Betweenness Strategy Effectiveness""")

    add_h2("2.4 Social Media Surveillance & Spreader Identification Pipeline")
    add_body("To monitor how unverified claims and news propagate across user networks, Data Echo incorporates a dedicated multi-platform social media surveillance engine:")
    add_code_block("""[ Claim Ingestion ]
         │
         ├──> Instagram 📸 ──> Profiles Creator Handles (@viral_buzz_updates_in), Reel Views, Shares
         ├──> Facebook  👥 ──> Tracks Community Groups (Breaking Alerts India), Reshares, Comments
         ├──> WhatsApp  💬 ──> Traces P2P Forward Chains (Anonymous Forwarder #704, Forwarded Many Times)
         ├──> YouTube   ▶️ ──> Audits Video Desks (FactCheck Watch India), Views, Explainer Debunks
         ├──> X/Twitter 🐦 ──> Captures Official Clarification Desks (@PIBFactCheck), Retweets, Likes
         └──> Telegram  ✈️ ──> Discovers Syndication Broadcast Channels (t.me/BreakingIndiaFeed)
         │
         ▼
[ Per-Handle Truth Scoring ] ──> Evaluates individual handle authenticity (e.g. 98.4% vs 8.5%)
         │
         ▼
[ Cross-Platform Graph Cascade ] ──> Renders transmission from WhatsApp -> IG -> FB -> YT -> Twitter""")

    # ─────────────────────────────────────────────────────────────
    # 3. UI/UX DESIGN SYSTEM & CANVAS ARCHITECTURE
    # ─────────────────────────────────────────────────────────────
    add_h1("3. UI/UX Design System & Interactive Canvas Architecture")
    add_body("Data Echo features a bespoke, futuristic cyber-intelligence design system engineered for high contrast, rapid visual scanning, and real-time responsiveness:")

    add_h2("3.1 Color Palette & Design Tokens")
    add_bullet("Deep Void Black (#0B0F17) with layered cards in Slate Dark (#111827 / #1F2937).", "Backgrounds: ")
    add_bullet("Electric Amber & Cyber Yellow (#FBBF24 / #F59E0B) for active states, interactive controls, and key highlights.", "Accents & Glows: ")
    add_bullet("Supported (Emerald #10B981), Contradicted (Rose Red #EF4444), Misleading (Amber #F59E0B), Unverified (Slate #6B7280).", "Verdict Status System: ")
    add_bullet("Pure White (#FFFFFF) for primary text, Slate (#94A3B8) for secondary metadata, and Muted Gray (#64748B) for timestamps.", "Typography Hierarchy: ")

    add_h2("3.2 3D Elevated Cards & Glassmorphic Component Architecture")
    add_body("All analytical panels, source cards, and verification outputs are constructed using 3D elevated containers with subtle border luminescence:")
    add_bullet("Cards feature a 1px border gradient with rgba(251, 191, 36, 0.2) glow and 0 10px 25px -5px rgba(0, 0, 0, 0.5) shadow elevation.", "Card Elevation: ")
    add_bullet("Buttons feature smooth transition scaling (transform: scale(1.02)) and golden box-shadow on hover.", "Interactive Feedback: ")
    add_bullet("Non-intrusive, inline notification banners replace disruptive browser alert dialogs across all pages.", "Inline Notifications: ")

    add_h2("3.3 HTML5 Canvas 2D Engine & Dynamic Graph HUD")
    add_body("The Source & Propagation Analysis module incorporates a custom HTML5 Canvas rendering engine with interactive physics and stateful animations:")
    add_bullet("Allows fluid exploration from 0.4x (wide network bird's-eye view) to 2.5x (detailed node inspection).", "Multi-Level Zoom (+ / -): ")
    add_bullet("Smooth mouse-drag interaction enabling users to navigate large network clusters effortlessly.", "Pan & Drag Canvas: ")
    add_bullet("Instantly re-centers the coordinate system and resets pan offsets to default origin.", "Reset View (↺): ")
    add_bullet("Executes an animated BFS simulation that illuminates infected nodes level-by-level with expanding golden pulsing rings (concentric radial gradients).", "BFS Cascade Animation (▶ / ⏸): ")
    add_bullet("Real-time on-canvas display indicating current zoom magnification, active node count, and simulation running status.", "Live Canvas HUD: ")

    # ─────────────────────────────────────────────────────────────
    # 4. COMPREHENSIVE TECHNOLOGY STACK
    # ─────────────────────────────────────────────────────────────
    add_h1("4. Comprehensive Technology Stack & Engineering Specifications")
    add_body("Data Echo is built using an enterprise-grade stack separating concerns between reactive frontend components, high-throughput algorithmic backends, and containerized deployment infrastructure:")

    # Detailed Tech Stack Table
    tech_table = doc.add_table(rows=1, cols=4)
    tech_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_hdr = tech_table.rows[0].cells
    for i, title in enumerate(["Layer / Subsystem", "Technology / Library", "Version", "Technical Function & Rationale"]):
        t_hdr[i].text = title
        set_cell_background(t_hdr[i], "0F172A")
        set_cell_margins(t_hdr[i], top=120, bottom=120, left=120, right=120)
        p = t_hdr[i].paragraphs[0]
        p.runs[0].font.name = "Arial"
        p.runs[0].font.size = Pt(10)
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(255, 255, 255)

    tech_specs = [
        ("Frontend Core", "React", "19.3.1", "Declarative component architecture powering the responsive single-page application."),
        ("Build Tooling", "Vite", "8.3.5", "Next-generation frontend bundler providing instant HMR and optimized production rollup."),
        ("Routing", "React Router", "7.18.4", "Client-side SPA navigation with dynamic parameterized routing and protected routes."),
        ("Data Visualization", "Recharts", "3.10.1", "Composable SVG charting library rendering Reach Reduction and Strategy Comparison bars."),
        ("Graph Canvas", "HTML5 Canvas API", "Native", "High-performance 60 FPS 2D canvas context for rendering custom interactive graph networks."),
        ("State Management", "React Context API", "Native", "AppDataContext for cross-page incident synchronization; AuthContext for user sessions."),
        ("Backend Web Server", "Python / Flask", "3.11 / 3.1.1", "RESTful API microframework coordinating verification algorithms and database access."),
        ("Production WSGI", "Gunicorn", "21.2.0+", "Pre-fork worker model WSGI HTTP server optimized for high-concurrency production serving."),
        ("Relational Database", "SQLite3", "3.x", "Embedded ACID-compliant SQL database storing user profiles, verification records, and runs."),
        ("Password Hashing", "bcrypt", "4.3.0", "Adaptive cryptographic key derivation function protecting user credentials."),
        ("Token Security", "itsdangerous / PyJWT", "2.10.1", "HMAC-SHA256 signed bearer tokens ensuring secure stateless session validation."),
        ("Live Web Engine", "Google News RSS", "XML/RSS 2.0", "Real-time news harvesting engine querying live publisher articles and timestamps."),
        ("Knowledge Engine", "Wikipedia API", "REST v1", "Real-time encyclopedic knowledge search verifying claims against authoritative articles."),
        ("Containerization", "Docker & Docker Compose", "Multi-stage", "Multi-stage Alpine Linux container bundling Node build and Python Flask production."),
        ("Cloud Platform", "Render / Railway", "Linux Cloud", "Serverless cloud hosting with automated Blueprints and zero-configuration Procfiles.")
    ]

    for row_idx, data in enumerate(tech_specs):
        row = tech_table.add_row()
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text in enumerate(data):
            cell = row.cells[col_idx]
            cell.text = text
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=90, bottom=90, left=100, right=100)
            p = cell.paragraphs[0]
            p.runs[0].font.name = "Calibri"
            p.runs[0].font.size = Pt(9.0)
            p.runs[0].font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ─────────────────────────────────────────────────────────────
    # 5. GRAPH DATA STRUCTURES & ALGORITHMS (DSA)
    # ─────────────────────────────────────────────────────────────
    add_h1("5. Mathematical Formulas & Algorithmic Specifications")
    add_body("Data Echo's analytical core relies on the mathematical rigor of discrete structures and graph algorithms:")

    add_h2("5.1 Levenshtein Distance Matrix (Dynamic Programming)")
    add_body("Quantifies character-level minimum edit operations to transform claim string s1 into headline s2. Initialized with D[i][0] = i and D[0][j] = j:")
    add_code_block("""D[i][j] = min(
    D[i - 1][j] + 1,                   // Deletion cost
    D[i][j - 1] + 1,                   // Insertion cost
    D[i - 1][j - 1] + cost             // Substitution cost (0 if s1[i-1] == s2[j-1] else 1)
)
Normalized Similarity: S_Lev(s1, s2) = 1.0 - ( D[m][n] / max(|s1|, |s2|) )""")

    add_h2("5.2 Jaccard Token Set Similarity")
    add_body("Measures word-level semantic overlap independent of word ordering by calculating the size of token set intersection divided by union:")
    add_code_block("""J(A, B) = |A ∩ B| / |A ∪ B|
Composite Score: S_Total = 0.55 * S_Lev + 0.45 * J(A, B)""")

    add_h2("5.3 Multi-Pillar Exact Truth Percentage Formulation")
    add_body("To eliminate arbitrary estimations, Data Echo computes the exact factual truth percentage via a deterministic 5-pillar mathematical formulation:")
    add_code_block("""Truth Percentage = round( 
    0.35 * S_Official + 
    0.25 * S_Consensus + 
    0.20 * S_Semantic + 
    0.10 * S_Provenance + 
    0.10 * (100.0 - P_Negation), 
    1
)
Where:
- S_Official: Authority Corroboration (Official Gov/Fact-check Portal Confirmation)
- S_Consensus: Independent News Outlets Multi-Source Corroboration Index
- S_Semantic: Combined Levenshtein & Jaccard Token Matrix Similarity (0.55*Lev + 0.45*Jac)
- S_Provenance: Whitelisted Domain Authority Weighting (Reuters, PIB, BBC, Hindu, etc.)
- P_Negation: Debunk & Refutation Penalty Index (Detects fake, hoax, debunked, denied)""")

    add_h2("5.4 Breadth-First Search (BFS) Information Propagation")
    add_body("Simulates cascade dissemination through an adjacency list network using a FIFO queue:")
    add_code_block("""Queue Q = [SeedNode]
Visited = {SeedNode}
SpreadLevels = {SeedNode: 0}

while Q is not empty:
    curr = Q.dequeue()
    for neighbor in Adj[curr]:
        if neighbor not in Visited and neighbor not in QuarantinedNodes:
            if random() <= sharing_probability:
                Visited.add(neighbor)
                SpreadLevels[neighbor] = SpreadLevels[curr] + 1
                Q.enqueue(neighbor)""")

    add_h2("5.5 Network Centrality Metrics")
    add_body("Identifies key nodes for targeted intervention containment:")
    add_bullet("Measures direct connection count: C_D(v) = deg(v) / (|V| - 1). Super-spreaders possess the highest degree centrality.", "Degree Centrality: ")
    add_bullet("Measures shortest paths traversing node v: C_B(v) = sum(sigma_st(v) / sigma_st) for s != v != t. Critical bridge nodes bridge disparate communities.", "Betweenness Centrality: ")

    # ─────────────────────────────────────────────────────────────
    # 6. CORE APPLICATION MODULES
    # ─────────────────────────────────────────────────────────────
    add_h1("6. Core Functional Modules")

    add_h2("6.1 Incident Verification Hub (/verify)")
    add_bullet("Accepts claims across 8 authority categories: Government, Natural Disasters, College, Health, Politics, Crime, Sports, and Financial news.", "Category Routing: ")
    add_bullet("Simultaneously searches Google News RSS and Wikipedia APIs via Python backend with a client-side browser fallback.", "Dual Verifier: ")
    add_bullet("Outputs exact factual authenticity score (e.g. 94.8% True or 6.4% True / 93.6% False) with transparent 5-pillar factor breakdown.", "Exact Truth Percentage: ")
    add_bullet("Dedicated surveillance panel profiling spreaders across Instagram (📸), Facebook (👥), WhatsApp (💬), YouTube (▶️), X/Twitter (🐦), and Telegram (✈️) with individual handle truth ratings and virality reach numbers.", "Social Media Handles & Spreader Tracking: ")
    add_bullet("Renders real article cards displaying real publisher badges (e.g. Reuters, PIB, The Hindu), headlines, published timestamps, similarity scores, and live links.", "Real Source Cards: ")
    add_bullet("Sorts matching articles chronologically to flag the Earliest Known Source or explicitly output 'Origin Unknown'.", "Earliest Known Source: ")

    add_h2("6.2 Source & Propagation Analysis (/source-propagation)")
    add_bullet("Dynamically synchronizes with the active incident verified by the user.", "Incident Selector: ")
    add_bullet("Information Propagation Graph directly maps social media handles (WhatsApp Forward Origin, Instagram Reel Creator, Facebook Group Admin, YouTube News Anchor, X Official Desk, Telegram Channel Admin) and models cross-platform cascade links.", "Cross-Platform Propagation Graph: ")
    add_bullet("Renders Information Source Graph (publishers & authority domains) and Claim Relationship Graph (variants & debunks).", "Source & Claim Graphs: ")
    add_bullet("Zoom In (+), Zoom Out (-), Reset View (↺), Pan & Drag interaction, live HUD status indicator, and animated BFS cascade playback (▶) with pulsing concentric rings.", "Canvas Interaction Controls: ")

    add_h2("6.3 What-If Propagation Simulator (/what-if)")
    add_bullet("Automatically synchronizes with the active verified claim from the Verify module.", "Synchronous Incident Binding: ")
    add_bullet("Assigns the verified Real Source Name directly to root seed node U001.", "Real Origin Seed: ")
    add_bullet("Sets virality probability dynamically: p = 72% for unverified rumors; p = 48% for verified news.", "Adaptive Virality Rate: ")
    add_bullet("Simulates quarantine of top-1, top-2, and top-3 influential accounts, plotting reach reduction and strategy comparison (Degree Centrality vs. Betweenness Centrality).", "Intervention Analysis: ")

    # ─────────────────────────────────────────────────────────────
    # 7. DATABASE DESIGN & SCHEMA
    # ─────────────────────────────────────────────────────────────
    add_h1("7. Database Design & Relational Schema")
    add_body("The SQLite database (data_echo.db) maintains 3 persistent tables:")

    add_body("1. users Table: Stores user accounts with bcrypt hashed passwords.", "• ")
    add_code_block("""CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);""")

    add_body("2. verifications Table: Stores verification audit history, truth scores, and raw JSON payloads.", "• ")
    add_code_block("""CREATE TABLE IF NOT EXISTS verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    claim_text TEXT NOT NULL,
    category TEXT NOT NULL,
    verdict TEXT NOT NULL,
    verdict_label TEXT NOT NULL,
    verdict_badge TEXT NOT NULL,
    truth_score INTEGER NOT NULL,
    earliest_source TEXT,
    earliest_timestamp TEXT,
    earliest_url TEXT,
    official_source_url TEXT,
    explanation TEXT,
    data_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);""")

    add_body("3. simulation_runs Table: Records What-If intervention experiments and node reduction metrics.", "• ")
    add_code_block("""CREATE TABLE IF NOT EXISTS simulation_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    incident_id INTEGER,
    network_type TEXT NOT NULL,
    node_count INTEGER NOT NULL,
    sharing_prob REAL NOT NULL,
    base_reach INTEGER NOT NULL,
    quarantined_nodes TEXT,
    reduced_reach INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);""")

    # ─────────────────────────────────────────────────────────────
    # 8. DEPLOYMENT & PRODUCTION OPERATIONS
    # ─────────────────────────────────────────────────────────────
    add_h1("8. Deployment & Production Operations")

    add_h2("8.1 Single-Port Local Unified Production Serving")
    add_body("Flask statically serves the compiled React SPA from dist/ on a single port:")
    add_code_block("""# 1. Compile the React frontend
cd data-echo
npm run build

# 2. Start the unified server
python backend/app.py
# Access application at http://localhost:5000""")

    add_h2("8.2 Docker Multi-Stage Containerization")
    add_body("Production-grade multi-stage Dockerfile bundling Vite compilation and Gunicorn execution:")
    add_code_block("""# Build and launch container stack
docker compose up --build -d

# Check live container status
docker ps
# Access application at http://localhost:5000""")

    add_h2("8.3 Cloud Deployment on Render (render.yaml Blueprint)")
    add_body("Render builds and hosts the platform using the automated Blueprint:")
    add_bullet("Connect the GitHub repository (Vivekshil-Gayakwad/data-echo) to Render.", "Step 1: ")
    add_bullet("Set Build Command to 'pip install -r backend/requirements.txt'.", "Step 2: ")
    add_bullet("Set Start Command to 'gunicorn --chdir backend --bind 0.0.0.0:$PORT --workers 2 --threads 4 app:app'.", "Step 3: ")
    add_bullet("The pre-built dist/ folder is served directly by Gunicorn, resulting in a 15-second build and zero npm platform conflicts.", "Step 4: ")

    # ─────────────────────────────────────────────────────────────
    # 9. REPOSITORY FILE STRUCTURE
    # ─────────────────────────────────────────────────────────────
    add_h1("9. Repository File Organization")
    add_code_block("""data-echo/
├── backend/
│   ├── app.py                     # Flask server with SPA client-side fallback
│   ├── database.py                # SQLite schema and query operations
│   ├── live_web_verifier.py       # Live Google News & Wikipedia search engine
│   ├── verification_engine.py     # DSA Levenshtein, Jaccard, SHA-256, Graph Builder
│   ├── simulation.py              # BFS propagation and centrality analytics
│   ├── test_production.py         # Automated production integration test suite
│   └── requirements.txt           # Python dependencies (Flask, Gunicorn, bcrypt)
├── dist/                          # Compiled production React frontend bundle
├── src/
│   ├── pages/
│   │   ├── Verify.jsx             # Real-time incident verification UI
│   │   ├── Network.jsx            # Dynamic incident graphs with canvas controls
│   │   ├── WhatIf.jsx             # BFS social intervention simulator
│   │   ├── Dashboard.jsx          # Analytics summary and metric cards
│   │   ├── SignIn.jsx / SignUp.jsx# Persistent user authentication
│   ├── services/
│   │   ├── api.js                 # API bridge with proxy and direct fallbacks
│   │   ├── liveWebVerifierClient.js # Browser-side fallback web verifier
│   │   └── verificationEngineClient.js # Client-side graph construction
│   └── context/
│       ├── AppDataContext.jsx     # Shared incident state across tabs
│       └── AuthContext.jsx        # User login session state
├── Dockerfile                     # Multi-stage production container
├── docker-compose.yml             # Container orchestration
├── render.yaml                    # Render cloud deployment blueprint
├── Procfile                       # WSGI process definition for cloud platforms
├── vercel.json                    # Vercel serverless SPA configuration
└── README.md                      # Comprehensive project documentation""")

    output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Data_Echo_Project_Documentation.docx"))
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    create_comprehensive_document()
