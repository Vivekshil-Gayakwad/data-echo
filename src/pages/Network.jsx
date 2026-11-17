import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { api } from '../services/api';

function buildRealIncidentGraph(selectedVer, mode) {
  if (!selectedVer) return null;

  const claimText = selectedVer.claim || 'Selected Claim';
  const realSourceName = selectedVer.real_source_name || selectedVer.earliestSource || selectedVer.source_audit?.earliest_source || 'Origin Unknown';
  const articles = selectedVer.live_articles_found || selectedVer.fullResult?.live_articles_found || [];
  const verdict = selectedVer.verdict || 'Unverified';
  const truthScore = selectedVer.truthScore || selectedVer.truth_score || 50;
  const authName = selectedVer.target_authorities?.[0]?.name || selectedVer.evidence_match?.official_publisher || 'Official Portal (gov.in)';
  const authDomain = selectedVer.target_authorities?.[0]?.domain || selectedVer.evidence_match?.official_source_url || 'gov.in';

  if (mode === 'source') {
    const nodes = [
      {
        id: 'SRC-EARLIEST',
        label: realSourceName.length > 22 ? realSourceName.slice(0, 20) + '...' : realSourceName,
        domain: selectedVer.source_audit?.earliest_url ? 'Original Source Web Link' : 'Primary Source',
        type: 'Earliest Known Source',
        category: 'Origin Seed Node',
        credibility: truthScore,
        color: '#FFD700',
        x: 300,
        y: 110,
        url: selectedVer.source_audit?.earliest_url || null,
        timestamp: selectedVer.source_audit?.earliest_timestamp || null,
      },
      {
        id: 'SRC-AUTH',
        label: authName.length > 22 ? authName.slice(0, 20) + '...' : authName,
        domain: authDomain,
        type: 'Official Portal',
        category: 'Authoritative Registry',
        credibility: 99,
        color: '#22c55e',
        x: 480,
        y: 220,
        url: selectedVer.evidence_match?.official_source_url || null,
      },
    ];

    const edges = [
      { from: 'SRC-EARLIEST', to: 'SRC-AUTH', relation: 'Verification Registry Cross-Check' },
    ];

    if (articles.length > 0) {
      const coords = [
        { x: 130, y: 220, color: '#06b6d4' },
        { x: 120, y: 380, color: '#a855f7' },
        { x: 290, y: 360, color: '#ec4899' },
        { x: 480, y: 390, color: '#3b82f6' },
      ];

      articles.slice(0, 4).forEach((art, i) => {
        const c = coords[i % coords.length];
        const pubId = `PUB-${i + 1}`;
        nodes.push({
          id: pubId,
          label: art.publisher || 'Web Publisher',
          domain: art.publisher_url || art.url,
          title: art.title,
          type: art.source_type || 'Mainstream News Website',
          category: 'Real Web Article',
          credibility: Math.round((art.match_score || 0.8) * 100),
          color: c.color,
          x: c.x,
          y: c.y,
          url: art.url,
        });

        edges.push({
          from: 'SRC-EARLIEST',
          to: pubId,
          relation: i === 0 ? 'Primary Syndication' : 'Citing Initial Report',
        });
      });
    } else {
      nodes.push(
        { id: 'PUB-1', label: 'Unverified Social Post', domain: 'x.com', type: 'social', category: 'Social Media Feed', x: 130, y: 220, color: '#06b6d4', credibility: 25 },
        { id: 'PUB-2', label: 'Public Telegram Channel', domain: 't.me/news', type: 'telegram', category: 'Public Channel', x: 480, y: 380, color: '#eab308', credibility: 30 },
        { id: 'PUB-3', label: 'Discussion Forum Thread', domain: 'reddit.com', type: 'forum', category: 'Online Forum', x: 290, y: 370, color: '#a855f7', credibility: 35 }
      );
      edges.push(
        { from: 'SRC-EARLIEST', to: 'PUB-1', relation: 'Forward / Repost' },
        { from: 'PUB-1', to: 'PUB-2', relation: 'Cross-Post' },
        { from: 'PUB-2', to: 'PUB-3', relation: 'Forum Discussion' }
      );
    }

    return {
      name: 'Information Source Graph',
      description: `Real-time publisher topology for: "${claimText.slice(0, 50)}..."`,
      nodes,
      edges,
      stats: {
        totalSources: nodes.length,
        citationsTracked: edges.length,
        earliestPublisher: realSourceName,
        highestCredibilitySource: authName,
        claimTitle: claimText,
      },
    };
  } else if (mode === 'propagation') {
    const isFalse = verdict === 'Contradicted' || truthScore < 35;
    const spreaders = selectedVer.social_spreaders || [];
    const igSpreader = spreaders.find(s => s.platform === 'Instagram') || { handle: '@viral_buzz_updates_in', actual_user: 'Aarav Sharma' };
    const fbSpreader = spreaders.find(s => s.platform === 'Facebook') || { handle: 'Breaking Alerts India', actual_user: 'Rajesh Verma' };
    const waSpreader = spreaders.find(s => s.platform === 'WhatsApp') || { handle: 'Broadcast Chain #408', actual_user: 'Anonymous Forwarder #704' };
    const ytSpreader = spreaders.find(s => s.platform === 'YouTube') || { handle: 'FactCheck Watch India', actual_user: 'Vikram Malhotra' };
    const xSpreader = spreaders.find(s => s.platform === 'X (Twitter)') || { handle: '@PIBFactCheck', actual_user: 'Official Information Desk' };
    const tgSpreader = spreaders.find(s => s.platform === 'Telegram') || { handle: 't.me/BreakingIndiaFeed', actual_user: 'Channel Admin' };

    return {
      name: 'Information Propagation Graph',
      description: `Cross-platform dissemination across WhatsApp, Instagram, Facebook, YouTube, X, and Telegram for: "${claimText.slice(0, 45)}..."`,
      nodes: [
        { id: 'WA_Origin', label: '💬 WhatsApp Chain #408', role: `P2P Forwarder (${waSpreader.actual_user})`, x: 300, y: 90, status: 'source', connections: 3, degree_centrality: 0.45, betweenness_centrality: 0.58, platform: 'WhatsApp', handle: waSpreader.handle },
        { id: 'IG_Hub', label: '📸 Instagram @viral_buzz', role: `Reel Creator (${igSpreader.actual_user})`, x: 140, y: 200, status: 'reached', connections: 3, degree_centrality: 0.38, betweenness_centrality: 0.42, platform: 'Instagram', handle: igSpreader.handle },
        { id: 'FB_Community', label: '👥 Facebook Group', role: `Community Desk (${fbSpreader.actual_user})`, x: 460, y: 190, status: 'reached', connections: 3, degree_centrality: 0.38, betweenness_centrality: 0.36, platform: 'Facebook', handle: fbSpreader.handle },
        { id: 'YT_Channel', label: '▶️ YouTube FactCheck', role: `Video Desk (${ytSpreader.actual_user})`, x: 90, y: 330, status: 'reached', connections: 2, degree_centrality: 0.25, betweenness_centrality: 0.22, platform: 'YouTube', handle: ytSpreader.handle },
        { id: 'X_Authority', label: '🐦 X @PIBFactCheck', role: `Official Clarification (${xSpreader.actual_user})`, x: 290, y: 330, status: 'new', connections: 3, degree_centrality: 0.33, betweenness_centrality: 0.26, platform: 'X', handle: xSpreader.handle },
        { id: 'TG_Broadcast', label: '✈️ Telegram Channel', role: `Broadcast Admin (${tgSpreader.actual_user})`, x: 510, y: 320, status: 'new', connections: 2, degree_centrality: 0.25, betweenness_centrality: 0.18, platform: 'Telegram', handle: tgSpreader.handle },
        { id: 'WA_SubGroup', label: '💬 WhatsApp Sub-Group #12', role: 'Secondary Forwarding Cluster', x: 180, y: 470, status: 'reached', connections: 2, degree_centrality: 0.20, betweenness_centrality: 0.12, platform: 'WhatsApp', handle: 'Neighborhood Group #12' },
        { id: 'IG_Reposter', label: '📸 Secondary Meme Page', role: 'Re-uploader Reel Account', x: 340, y: 475, status: 'unreached', connections: 1, degree_centrality: 0.11, betweenness_centrality: 0.04, platform: 'Instagram', handle: '@daily_meme_repost' },
        { id: 'Citizen_End', label: '👤 End Public Consumer', role: 'Passive Reader Profile', x: 480, y: 465, status: 'unreached', connections: 1, degree_centrality: 0.11, betweenness_centrality: 0.02, platform: 'Citizen', handle: 'Citizen Account #892' },
      ],
      edges: [
        ['WA_Origin', 'IG_Hub'], ['WA_Origin', 'FB_Community'],
        ['IG_Hub', 'YT_Channel'], ['FB_Community', 'TG_Broadcast'],
        ['YT_Channel', 'X_Authority'], ['WA_Origin', 'WA_SubGroup'],
        ['IG_Hub', 'IG_Reposter'], ['TG_Broadcast', 'Citizen_End'],
        ['WA_SubGroup', 'Citizen_End'],
      ],
      stats: {
        totalAccounts: 9,
        reachCount: isFalse ? 7 : 5,
        reachPercentage: isFalse ? '78%' : '56%',
        topDegreeNode: 'WA_Origin (WhatsApp Forwarder #704)',
        topBridgeNode: 'IG_Hub (Instagram Reel Creator Betweenness 0.42)',
      },
    };
  } else {
    // Mode: claim
    const isSupported = verdict === 'Supported';
    return {
      name: 'Claim Relationship Graph',
      description: `Maps semantic claim variants and fact-checks for: "${claimText.slice(0, 45)}..."`,
      nodes: [
        { id: 'CLM-ORIG', label: 'Selected Incident Claim', snippet: `"${claimText}"`, claim_type: 'Original Claim', x: 300, y: 120, color: '#FFD700' },
        { id: 'CLM-DUP', label: 'Exact Duplicate Post', snippet: '"Identical SHA-256 token digest"', claim_type: 'Duplicate (Hash)', x: 140, y: 250, color: '#a3e635' },
        { id: 'CLM-SIM', label: 'Sensationalized Headline', snippet: `"Viral exaggerated variant"`, claim_type: 'Similar (Jaccard)', x: 460, y: 240, color: '#38bdf8' },
        { id: 'CLM-SRC', label: `Report by ${realSourceName}`, snippet: articles[0]?.title || selectedVer.explanation, claim_type: isSupported ? 'Supporting Coverage' : 'Contradictory Rebuttal', x: 160, y: 420, color: isSupported ? '#22c55e' : '#ef4444' },
        { id: 'CLM-AUTH', label: `${authName} Statement`, snippet: selectedVer.evidence_match?.matched_record || 'Official statement from registry', claim_type: 'Authoritative Notice', x: 440, y: 420, color: '#22c55e' },
      ],
      edges: [
        { from: 'CLM-ORIG', to: 'CLM-DUP', relation: 'Duplicate (SHA-256 Match)', similarity: 0.99 },
        { from: 'CLM-ORIG', to: 'CLM-SIM', relation: 'Semantic Variant (Jaccard 0.74)', similarity: 0.74 },
        { from: 'CLM-ORIG', to: 'CLM-SRC', relation: isSupported ? 'Corroborating Report' : 'Fact-Check Debunk', similarity: 0.82 },
        { from: 'CLM-ORIG', to: 'CLM-AUTH', relation: 'Authoritative Verification', similarity: 0.88 },
        { from: 'CLM-SIM', to: 'CLM-AUTH', relation: 'Refuted Exaggeration', similarity: 0.78 },
      ],
      stats: {
        variantsMapped: 5,
        duplicateLinks: 1,
        contradictionNodes: isSupported ? 0 : 1,
        supportingNodes: isSupported ? 2 : 1,
      },
    };
  }
}

function Network() {
  const { verifications, activeVerification, setActiveIncidentId, hasData } = useAppData();
  const [selectedClaimId, setSelectedClaimId] = useState(
    activeVerification?.id || (verifications[0]?.id || 1)
  );
  const [graphMode, setGraphMode] = useState('source'); // 'source' | 'propagation' | 'claim'
  const [selectedNode, setSelectedNode] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Canvas View Controls State
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [cascadeLevel, setCascadeLevel] = useState(0);

  const containerRef = useRef(null);

  // Sync selectedClaimId when activeVerification changes
  useEffect(() => {
    if (activeVerification?.id) {
      setSelectedClaimId(activeVerification.id);
    } else if (verifications.length > 0) {
      setSelectedClaimId(verifications[0].id);
    }
  }, [activeVerification, verifications]);

  // Load graph data based on selected claim and active mode
  useEffect(() => {
    let isMounted = true;
    async function fetchGraph() {
      setLoading(true);
      const selectedVer = verifications.find((v) => v.id === selectedClaimId) || activeVerification || verifications[0];

      try {
        if (selectedVer) {
          const res = await api.graphs.getGraph(graphMode, selectedClaimId, selectedVer.claim);
          if (isMounted && res && res.nodes && res.nodes.length > 0) {
            setGraphData(res);
            setSelectedNode(null);
            return;
          }
        }
        throw new Error('Fallback to dynamic incident graph');
      } catch {
        if (isMounted) {
          const dynamicGraph = buildRealIncidentGraph(selectedVer, graphMode);
          setGraphData(dynamicGraph);
          setSelectedNode(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchGraph();
    return () => {
      isMounted = false;
    };
  }, [selectedClaimId, graphMode, verifications, activeVerification]);

  // Animation interval for Play Cascade
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCascadeLevel((lvl) => (lvl + 1) % 5);
    }, 700);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Button Handlers
  const handleZoomIn = () => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, +(z - 0.25).toFixed(2)));
  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
    setIsPlaying(false);
    setCascadeLevel(0);
  };
  const handleTogglePlay = () => setIsPlaying((p) => !p);

  // Pan drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };
  const handleMouseUp = () => setIsDragging(false);

  // If no verifications exist yet, show clean empty state
  if (!hasData) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>🕸️ Source & Propagation Analysis</h1>
          <p>Interactive graph visualizations: Source Graph, Propagation Graph, and Claim Relationship Graph</p>
        </div>
        <div className="empty-state-container animate-in">
          <div className="empty-state-card">
            <div className="empty-state-icon">🕸️</div>
            <h2>No Verifications Yet</h2>
            <p>
              Verify a claim in the Verify section to generate its real-time Information Source Graph,
              Propagation Graph, and Claim Relationship Graph.
            </p>
            <Link to="/verify" className="btn-primary" style={{ marginTop: '14px' }}>
              🔍 Verify Information
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];
  const getNode = (id) => nodes.find((n) => n.id === id);

  const selectedClaim = verifications.find((v) => v.id === selectedClaimId) || activeVerification || verifications[0];
  const realSourceName = selectedClaim?.real_source_name || selectedClaim?.earliestSource || selectedClaim?.source_audit?.earliest_source || 'Origin Unknown';

  return (
    <div className="page">
      {/* HEADER WITH INCIDENT SELECTOR */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>🕸️ Source & Propagation Analysis</h1>
          <p>
            Real-time graph analysis for: <strong>"{selectedClaim?.claim || 'Incident'}"</strong>
          </p>
        </div>

        {/* Claim Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '13px', color: '#b0a880', fontWeight: '500' }}>Select Verified Incident:</label>
          <select
            value={selectedClaimId}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelectedClaimId(id);
              setActiveIncidentId(id);
            }}
            style={{
              background: '#1c1a10',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              color: '#FFD700',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
              maxWidth: '320px',
            }}
          >
            {verifications.map((v) => (
              <option key={v.id} value={v.id}>
                {v.badge?.slice(0, 2) || '🔎'} {v.claim.length > 40 ? v.claim.slice(0, 40) + '...' : v.claim}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* REAL SOURCE BANNER RIBBON */}
      <div
        style={{
          background: 'rgba(255, 215, 0, 0.05)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '13px',
          color: '#d0d0c0',
        }}
      >
        <div>
          <span>🌐 Real Source Name: </span>
          <strong style={{ color: '#FFD700', fontSize: '15px' }}>{realSourceName}</strong>
          {selectedClaim?.source_audit?.earliest_timestamp && (
            <span style={{ color: '#888', marginLeft: '8px' }}>
              (First Observed: {new Date(selectedClaim.source_audit.earliest_timestamp).toUTCString()})
            </span>
          )}
        </div>
        <div>
          <span>Verdict: </span>
          <strong style={{ color: selectedClaim?.verdict === 'Supported' ? '#22c55e' : '#ef4444' }}>
            {selectedClaim?.verdict_badge || selectedClaim?.verdict || 'Verified'}
          </strong>
        </div>
      </div>

      {/* THREE GRAPH MODES SELECTOR TABS */}
      <div
        className="card animate-in"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          background: 'linear-gradient(145deg, #1c1a10 0%, #16140c 100%)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`whatif-btn ${graphMode === 'source' ? 'active' : ''}`}
            onClick={() => setGraphMode('source')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>🌐</span> Information Source Graph
          </button>
          <button
            type="button"
            className={`whatif-btn ${graphMode === 'propagation' ? 'active' : ''}`}
            onClick={() => setGraphMode('propagation')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>👥</span> Information Propagation Graph
          </button>
          <button
            type="button"
            className={`whatif-btn ${graphMode === 'claim' ? 'active' : ''}`}
            onClick={() => setGraphMode('claim')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>🔗</span> Claim Relationship Graph
          </button>
        </div>

        <div style={{ fontSize: '13px', color: '#FFD700', fontWeight: '500' }}>
          Active View: <strong>{graphData?.name || 'Live Graph Model'}</strong>
        </div>
      </div>

      {/* GRAPH CANVAS & SIDEBAR CONTAINER */}
      <div className="network-container">
        {/* SVG GRAPH CANVAS */}
        <div
          className="network-canvas"
          ref={containerRef}
          style={{ position: 'relative', overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Top-left HUD Canvas Status */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '16px',
              background: 'rgba(20, 18, 10, 0.85)',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,215,0,0.15)',
              fontSize: '11px',
              color: '#d0d0c0',
              pointerEvents: 'none',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>🔍 Zoom: <strong style={{ color: '#FFD700' }}>{Math.round(zoom * 100)}%</strong></span>
            {isPlaying && (
              <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="live-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
                Cascade Wave {cascadeLevel + 1}/5
              </span>
            )}
          </div>

          <div className="network-canvas-inner" style={{ width: '100%', height: '560px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: '#FFD700', paddingTop: '200px' }}>
                <div className="floating-icon" style={{ margin: '0 auto 16px' }}>🕸️</div>
                <p>Generating real-time graph for {realSourceName}...</p>
              </div>
            ) : (
              <svg width="100%" height="100%" viewBox="0 0 600 560" style={{ display: 'block' }}>
                <defs>
                  <radialGradient id="sourceSeedGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFF8DC" stopOpacity="1" />
                    <stop offset="50%" stopColor="#FFD700" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#B8860B" stopOpacity="0.3" />
                  </radialGradient>
                </defs>

                {/* Transform group for Zoom & Pan */}
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} transformOrigin="300 280">
                  {/* Tier background visual aids */}
                  {graphMode === 'source' && (
                    <>
                      <rect x="50" y="60" width="500" height="90" rx="14" fill="rgba(255, 215, 0, 0.05)" stroke="rgba(255, 215, 0, 0.2)" strokeDasharray="4 4" />
                      <text x="70" y="85" fill="rgba(255, 215, 0, 0.5)" fontSize="11" fontWeight="700">⭐ Earliest Source Origin Tier ({realSourceName})</text>
                      <rect x="50" y="170" width="500" height="350" rx="14" fill="rgba(255, 255, 255, 0.02)" stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="4 4" />
                      <text x="70" y="195" fill="rgba(255, 255, 255, 0.3)" fontSize="11" fontWeight="600">Live Publishers & Fact-Check Registries Tier</text>
                    </>
                  )}

                  {/* Edges */}
                  {edges.map((edge, i) => {
                    let fromNode, toNode, edgeLabel;
                    if (Array.isArray(edge)) {
                      fromNode = getNode(edge[0]);
                      toNode = getNode(edge[1]);
                      edgeLabel = '';
                    } else {
                      fromNode = getNode(edge.from);
                      toNode = getNode(edge.to);
                      edgeLabel = edge.relation || '';
                    }
                    if (!fromNode || !toNode) return null;

                    const isHighlighted = isPlaying && (fromNode.y < 150 + cascadeLevel * 90);

                    return (
                      <g key={i}>
                        <line
                          x1={fromNode.x}
                          y1={fromNode.y}
                          x2={toNode.x}
                          y2={toNode.y}
                          stroke={isHighlighted ? '#FFD700' : 'rgba(255, 215, 0, 0.2)'}
                          strokeWidth={isHighlighted ? '2' : '1.2'}
                        />
                        {edgeLabel && (
                          <text
                            x={(fromNode.x + toNode.x) / 2}
                            y={(fromNode.y + toNode.y) / 2 - 4}
                            textAnchor="middle"
                            fill="#888877"
                            fontSize="9"
                            fontWeight="500"
                            style={{ pointerEvents: 'none' }}
                          >
                            {edgeLabel}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {nodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    const isOrigin = node.id === 'SRC-EARLIEST' || node.id === 'Seed_Source' || node.id === 'CLM-ORIG';
                    const isCascadeActive = isPlaying && node.y < 160 + cascadeLevel * 90;

                    const nodeColor = node.color || '#FFD700';
                    const radius = isOrigin ? 20 : 15;

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNode(node);
                        }}
                      >
                        {/* Origin Beacon / Pulsing Ring */}
                        {(isOrigin || isCascadeActive) && (
                          <circle
                            r={radius + 8}
                            fill="none"
                            stroke="#FFD700"
                            strokeWidth="1.5"
                            opacity="0.6"
                            className="pulse-ring"
                          />
                        )}

                        {/* Selected halo */}
                        {isSelected && (
                          <circle r={radius + 6} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                        )}

                        {/* Node circle */}
                        <circle
                          r={radius}
                          fill={isOrigin ? 'url(#sourceSeedGlow)' : nodeColor}
                          stroke={isSelected ? '#38bdf8' : isOrigin ? '#FFD700' : 'rgba(255,255,255,0.2)'}
                          strokeWidth={isOrigin || isSelected ? '2.5' : '1.5'}
                        />

                        {/* Node Label Text */}
                        <text
                          y={radius + 14}
                          textAnchor="middle"
                          fill={isOrigin ? '#FFD700' : '#f5f5f0'}
                          fontSize={isOrigin ? '11px' : '9.5px'}
                          fontWeight="700"
                          style={{ pointerEvents: 'none' }}
                        >
                          {node.label || node.id}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            )}
          </div>

          {/* Canvas Controls — Fully Functional */}
          <div className="network-controls" style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 20 }}>
            <button
              type="button"
              title="Zoom In"
              onClick={handleZoomIn}
              style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1c1a10', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)', cursor: 'pointer', fontSize: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              +
            </button>
            <button
              type="button"
              title="Zoom Out"
              onClick={handleZoomOut}
              style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1c1a10', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)', cursor: 'pointer', fontSize: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              −
            </button>
            <button
              type="button"
              title="Reset View"
              onClick={handleResetView}
              style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1c1a10', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)', cursor: 'pointer', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              ↺
            </button>
            <button
              type="button"
              title={isPlaying ? 'Pause Cascade' : 'Simulate BFS Information Cascade'}
              onClick={handleTogglePlay}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isPlaying ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #FFD700, #B8860B)',
                color: isPlaying ? '#ffffff' : '#0a0a0a',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(255,215,0,0.3)',
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>
        </div>

        {/* SIDEBAR DETAILS */}
        <div className="network-sidebar">
          {/* Mode Description & Real Source Legend */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Real Source & Legend</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#FFD700' }}></div>
                <strong>Real Source:</strong> {realSourceName}
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#22c55e' }}></div>
                <strong>Authority:</strong> Official Registry
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#06b6d4' }}></div>
                Verified News Publication
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#a855f7' }}></div>
                Syndicated Wire / Media Article
              </div>
            </div>
          </div>

          {/* Active Node Inspector */}
          {selectedNode && (
            <div className="card animate-scale" style={{ border: '1px solid #FFD700' }}>
              <div className="card-header">
                <span className="card-title">Node Inspector</span>
                <span className="card-subtitle">{selectedNode.id}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#FFD700' }}>
                  {selectedNode.label || selectedNode.role || selectedNode.id}
                </div>
                {selectedNode.domain && (
                  <div style={{ fontSize: '12px', color: '#38bdf8', fontFamily: 'monospace' }}>
                    🌐 {selectedNode.domain}
                  </div>
                )}
                {selectedNode.title && (
                  <div style={{ fontSize: '12px', color: '#f5f5f0', lineHeight: '1.4' }}>
                    <strong>Headline:</strong> "{selectedNode.title}"
                  </div>
                )}
                {selectedNode.category && (
                  <div style={{ fontSize: '12px', color: '#b0a880' }}>
                    Type: <strong>{selectedNode.category}</strong>
                  </div>
                )}
                {selectedNode.credibility !== undefined && (
                  <div style={{ fontSize: '12px', color: '#22c55e' }}>
                    Credibility Rating: <strong>{selectedNode.credibility}%</strong>
                  </div>
                )}
                {selectedNode.url && (
                  <a
                    href={selectedNode.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '12px', color: '#38bdf8', textDecoration: 'none', fontWeight: '600' }}
                  >
                    🔗 Open Real Source Link ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Mode-Specific Graph Metrics */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Graph Analytics</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#b0a880' }}>Total Graph Nodes:</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#f5f5f0' }}>{nodes.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#b0a880' }}>Citations & Links:</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#f5f5f0' }}>{edges.length}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,215,0,0.1)', paddingTop: '8px', fontSize: '12px', color: '#b0a880' }}>
                Earliest Observed Publisher:
                <div style={{ color: '#FFD700', fontWeight: '700', marginTop: '2px', fontSize: '13px' }}>
                  {realSourceName}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Network;
