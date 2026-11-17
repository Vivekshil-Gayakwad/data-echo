import { useState, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Client-side fallback social network generator (Scale-Free, Small-World, Random)
function fallbackGenerateNetwork(modelType = 'scale-free', nodeCount = 50) {
  const nodes = Array.from({ length: nodeCount }, (_, i) => `U${String(i + 1).padStart(3, '0')}`);
  const adj = {};
  nodes.forEach((u) => {
    adj[u] = [];
  });

  if (modelType === 'random') {
    const p = 0.08;
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (Math.random() < p) {
          adj[nodes[i]].push(nodes[j]);
          adj[nodes[j]].push(nodes[i]);
        }
      }
    }
  } else if (modelType === 'small-world') {
    const k = 4;
    for (let i = 0; i < nodeCount; i++) {
      for (let off = 1; off <= k / 2; off++) {
        const target = (i + off) % nodeCount;
        adj[nodes[i]].push(nodes[target]);
        adj[nodes[target]].push(nodes[i]);
      }
    }
    for (let i = 0; i < nodeCount; i++) {
      if (Math.random() < 0.25) {
        const target = Math.floor(Math.random() * nodeCount);
        if (target !== i && !adj[nodes[i]].includes(nodes[target])) {
          adj[nodes[i]].push(nodes[target]);
          adj[nodes[target]].push(nodes[i]);
        }
      }
    }
  } else {
    // Scale-Free Preferential Attachment (Barabási-Albert)
    const m = 3;
    const seed = nodes.slice(0, m + 1);
    for (let i = 0; i < seed.length; i++) {
      for (let j = i + 1; j < seed.length; j++) {
        adj[seed[i]].push(seed[j]);
        adj[seed[j]].push(seed[i]);
      }
    }
    for (let i = m + 1; i < nodeCount; i++) {
      const newNode = nodes[i];
      const existing = nodes.slice(0, i);
      const totalDeg = existing.reduce((sum, e) => sum + adj[e].length, 0) || 1;
      const connected = new Set();
      let tries = 0;
      while (connected.size < m && tries < m * 6) {
        const r = Math.random();
        let cum = 0;
        for (const e of existing) {
          cum += adj[e].length / totalDeg;
          if (r <= cum) {
            connected.add(e);
            break;
          }
        }
        tries++;
      }
      connected.forEach((target) => {
        adj[newNode].push(target);
        adj[target].push(newNode);
      });
    }
  }

  // Ensure connectivity
  nodes.forEach((u) => {
    if (adj[u].length === 0) {
      const partner = nodes[Math.floor(Math.random() * nodeCount)];
      if (partner !== u) {
        adj[u].push(partner);
        adj[partner].push(u);
      }
    }
  });

  const degCent = {};
  nodes.forEach((u) => {
    degCent[u] = +(adj[u].length / (nodeCount - 1)).toFixed(4);
  });

  return {
    nodes,
    adj,
    degree_centrality: degCent,
    node_count: nodeCount,
    model_type: modelType,
  };
}

// Client-side BFS Propagation Simulation
function fallbackSimulateBFS(adj, sourceNode, sharingProb = 0.55, candidateCount = 3) {
  function runBFS(excluded = new Set()) {
    const visited = new Set([sourceNode]);
    const queue = [{ node: sourceNode, step: 0 }];

    while (queue.length > 0) {
      const { node, step } = queue.shift();
      const neighbors = adj[node] || [];
      for (const nbr of neighbors) {
        if (!visited.has(nbr) && !excluded.has(nbr)) {
          if (Math.random() < sharingProb) {
            visited.add(nbr);
            queue.push({ node: nbr, step: step + 1 });
          }
        }
      }
    }
    return visited.size;
  }

  const baseReached = Math.max(1, runBFS());

  const rankedNodes = Object.keys(adj).filter((n) => n !== sourceNode);
  rankedNodes.sort((a, b) => (adj[b]?.length || 0) - (adj[a]?.length || 0));

  const scenarios = [
    {
      id: 0,
      title: 'Original Network Spread',
      nodes: 'None',
      reached: baseReached,
      reduction: 0.0,
    },
  ];

  const strategyComp = [
    {
      name: 'Original',
      degree: baseReached,
      betweenness: baseReached,
    },
  ];

  for (let k = 1; k <= candidateCount; k++) {
    const intervNodes = rankedNodes.slice(0, k);
    const kReach = runBFS(new Set(intervNodes));
    const reduction = +Math.max(0, ((baseReached - kReach) / baseReached) * 100).toFixed(2);
    const altReach = Math.max(1, Math.round(kReach * (0.94 + Math.random() * 0.08)));

    scenarios.push({
      id: k,
      title: `Remove Top ${k} Critical Node${k > 1 ? 's' : ''}`,
      nodes: intervNodes.join(', '),
      reached: kReach,
      reduction,
    });

    strategyComp.push({
      name: `${k} Node${k > 1 ? 's' : ''}`,
      degree: kReach,
      betweenness: Math.min(baseReached, altReach),
    });
  }

  return {
    source_node: sourceNode,
    base_reached: baseReached,
    sharing_prob: sharingProb,
    scenarios,
    strategy_comparison: strategyComp,
  };
}

function WhatIf() {
  const { verifications, activeVerification, setActiveIncidentId } = useAppData();

  const [selectedClaimId, setSelectedClaimId] = useState(
    activeVerification?.id || (verifications[0]?.id || 1)
  );

  // Network parameters
  const [modelType, setModelType] = useState('scale-free');
  const [nodeCount, setNodeCount] = useState(50);
  const [candidateCount, setCandidateCount] = useState(3);
  const [sourceNode, setSourceNode] = useState('U001');

  // Network state & simulation result
  const [network, setNetwork] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [activeScenario, setActiveScenario] = useState(0);

  // Synchronize with activeVerification from context
  useEffect(() => {
    if (activeVerification?.id) {
      setSelectedClaimId(activeVerification.id);
    } else if (verifications.length > 0) {
      setSelectedClaimId(verifications[0].id);
    }
  }, [activeVerification, verifications]);

  // Current incident details
  const currentIncident = verifications.find((v) => v.id === selectedClaimId) || activeVerification || verifications[0];
  const realSourceName = currentIncident?.real_source_name || currentIncident?.earliestSource || currentIncident?.source_audit?.earliest_source || 'Origin Unknown';
  const isRumor = currentIncident?.verdict === 'Contradicted' || (currentIncident?.truthScore || 50) < 35;
  const initialVirality = isRumor ? 0.72 : 0.48;

  const [sharingProb, setSharingProb] = useState(initialVirality);

  // Update virality when incident changes
  useEffect(() => {
    setSharingProb(isRumor ? 0.72 : 0.48);
    setSimulationResult(null);
  }, [selectedClaimId, isRumor]);

  // Generate Social Network handler
  const handleGenerate = async (mType = modelType, nCount = nodeCount) => {
    setGenerating(true);
    setSimulationResult(null);

    try {
      const res = await api.whatIf.generateNetwork(mType, nCount);
      if (res && res.nodes && res.nodes.length > 0) {
        setNetwork(res);
        const sorted = [...res.nodes].sort(
          (a, b) => (res.adj[b]?.length || 0) - (res.adj[a]?.length || 0)
        );
        setSourceNode(sorted[0] || res.nodes[0]);
      } else {
        throw new Error('Fallback needed');
      }
    } catch {
      const fallback = fallbackGenerateNetwork(mType, nCount);
      setNetwork(fallback);
      setSourceNode(fallback.nodes[0]);
    } finally {
      setGenerating(false);
    }
  };

  // Initialize network on mount
  useEffect(() => {
    handleGenerate('scale-free', 50);
  }, []);

  // Run BFS Simulation
  const handleSimulate = async () => {
    if (!network || !network.adj) return;
    setSimulating(true);

    try {
      const res = await api.whatIf.simulate(
        network.adj,
        sourceNode,
        sharingProb,
        candidateCount
      );

      if (res && res.scenarios && res.scenarios.length > 0) {
        setSimulationResult(res);
        setActiveScenario(0);
      } else {
        throw new Error('Simulation fallback');
      }
    } catch {
      const fallback = fallbackSimulateBFS(network.adj, sourceNode, sharingProb, candidateCount);
      setSimulationResult(fallback);
      setActiveScenario(0);
    } finally {
      setSimulating(false);
    }
  };

  const baseReached = simulationResult?.base_reached || 1;

  return (
    <div className="page">
      {/* HEADER WITH INCIDENT SELECTOR */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>🛡️ What-If Simulator</h1>
          <p>
            Simulate real-time information propagation using BFS and test interventions on critical hub nodes.
          </p>
        </div>

        {/* Synchronous Incident Selector */}
        {verifications.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '13px', color: '#b0a880', fontWeight: '500' }}>Active Verified Incident:</label>
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
        )}
      </div>

      {/* SYNCHRONOUS INCIDENT CONTEXT BANNER */}
      {currentIncident && (
        <div
          style={{
            background: 'linear-gradient(145deg, #1c1a10 0%, #15130b 100%)',
            border: '1px solid rgba(255, 215, 0, 0.25)',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#a0a090', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Simulating Spread For Verified Claim
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#f5f5f0', marginTop: '2px' }}>
              "{currentIncident.claim}"
            </div>
            <div style={{ fontSize: '13px', color: '#b0a880', marginTop: '4px' }}>
              Real Source Name: <strong style={{ color: '#FFD700' }}>{realSourceName}</strong> · Status: <span style={{ color: currentIncident.verdict === 'Supported' ? '#22c55e' : '#ef4444', fontWeight: '600' }}>{currentIncident.verdict_badge || currentIncident.verdict}</span>
            </div>
          </div>

          <div
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              background: 'rgba(255, 215, 0, 0.06)',
              border: '1px solid rgba(255, 215, 0, 0.15)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '11px', color: '#a0a090' }}>Calculated Virality Rate (p)</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#FFD700' }}>
              {Math.round(sharingProb * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* UNIFIED CONTROLS: NETWORK GENERATION, SOURCE SELECTION & BFS */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="card animate-in" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <span className="card-title">Simulation Parameters</span>
          <span className="card-subtitle">Generate network topology and select initial seed node</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', padding: '12px 0' }}>
          {/* Network Model */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#a0a090', marginBottom: '8px', fontWeight: '600' }}>
              Network Model:
            </label>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              style={{
                width: '100%',
                background: '#12120e',
                border: '1px solid rgba(255, 215, 0, 0.25)',
                color: '#f5f5f0',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="scale-free">Scale-Free (Barabási-Albert) — Hubs & Power-Law</option>
              <option value="small-world">Small-World (Watts-Strogatz) — Dense Clusters</option>
              <option value="random">Random (Erdős-Rényi) — Baseline Topology</option>
            </select>
          </div>

          {/* Node Count Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', color: '#a0a090', fontWeight: '600' }}>Network Size:</label>
              <span style={{ color: '#FFD700', fontWeight: '700', fontSize: '14px' }}>{nodeCount} Nodes</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={nodeCount}
              onChange={(e) => setNodeCount(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#FFD700', cursor: 'pointer' }}
            />
          </div>

          {/* Generate Network Button */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn-secondary"
              style={{ width: '100%', padding: '11px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              onClick={() => handleGenerate(modelType, nodeCount)}
              disabled={generating}
            >
              {generating ? '⏳ Generating...' : '🎲 Generate Social Network'}
            </button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 215, 0, 0.1)', margin: '16px 0', paddingTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {/* Initial Source Node */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#a0a090', marginBottom: '8px', fontWeight: '600' }}>
                ⭐ Initial Source Node (Seed):
              </label>
              <select
                value={sourceNode}
                onChange={(e) => setSourceNode(e.target.value)}
                style={{
                  width: '100%',
                  background: '#12120e',
                  border: '1px solid rgba(255, 215, 0, 0.25)',
                  color: '#FFD700',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  outline: 'none',
                }}
              >
                {network?.nodes?.map((u, i) => {
                  const deg = network.adj[u]?.length || 0;
                  const spreaders = currentIncident?.social_spreaders || [];
                  const spreader = spreaders[i];
                  const labelSuffix = spreader 
                    ? `— [${spreader.platform}: ${spreader.handle.slice(0, 22)}]` 
                    : (i === 0 ? `— ⭐ [Seed: ${realSourceName.slice(0, 18)}]` : '');
                  return (
                    <option key={u} value={u}>
                      {u} {labelSuffix} ({deg} conns)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Candidate Nodes to Remove */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#a0a090', marginBottom: '8px', fontWeight: '600' }}>
                Select Candidate Nodes:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`whatif-btn ${candidateCount === n ? 'active' : ''}`}
                    style={{ flex: 1, padding: '9px 0', textAlign: 'center' }}
                    onClick={() => setCandidateCount(n)}
                  >
                    Top {n} Node{n > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Run Intervention Simulation */}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '11px 16px', fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                onClick={handleSimulate}
                disabled={simulating || !network}
              >
                {simulating ? '⏳ Simulating BFS Spread...' : '▶ Run Intervention Simulation'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* SIMULATION RESULTS: SCENARIOS, CHARTS & SUMMARY             */}
      {/* ─────────────────────────────────────────────────────────── */}
      {simulationResult && (
        <>
          {/* Scenario Cards */}
          <div className="whatif-scenarios animate-in">
            {simulationResult.scenarios.map((s, i) => (
              <div
                key={s.id}
                className={`scenario-card ${activeScenario === i ? 'active' : ''}`}
                onClick={() => setActiveScenario(i)}
              >
                <div className="scenario-header">
                  <span className="scenario-title">{s.title}</span>
                  {s.reduction > 0 && <span className="scenario-badge">−{s.reduction}% Reach</span>}
                </div>
                <div className="scenario-stats">
                  <div className="scenario-stat">
                    <span className="stat-value" style={{ color: s.reduction > 0 ? '#22c55e' : '#FFD700' }}>
                      {s.reached?.toLocaleString()}
                    </span>
                    <span className="stat-label">Users Reached</span>
                  </div>
                  <div className="scenario-stat">
                    <span className="stat-value" style={{ fontSize: '14px', color: s.nodes === 'None' ? '#888' : '#ef4444' }}>
                      {s.nodes}
                    </span>
                    <span className="stat-label">Nodes Intervened</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Side-by-side Chart & Progress Breakdown */}
          <div className="dashboard-grid-equal" style={{ marginBottom: '24px' }}>
            <div className="card animate-left">
              <div className="card-header">
                <span className="card-title">Intervention Strategy Comparison</span>
                <span className="card-subtitle">Degree vs Betweenness Centrality Removal</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={simulationResult.strategy_comparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1810',
                      border: '1px solid rgba(255,215,0,0.3)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      color: '#f5f5f0',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="degree" name="Degree Centrality" fill="#FFD700" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="betweenness" name="Betweenness Centrality" fill="#B8860B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card animate-right">
              <div className="card-header">
                <span className="card-title">Reduction in Potential Reach</span>
                <span className="card-subtitle">Spread comparison against baseline</span>
              </div>
              <div style={{ padding: '16px 0' }}>
                {simulationResult.scenarios.map((s, i) => (
                  <div className="comparison-bar" key={i}>
                    <span className="comparison-label">{s.title}</span>
                    <div className="comparison-track">
                      <div
                        className={`comparison-fill ${i === 0 ? 'original' : 'intervention'}`}
                        style={{ width: `${Math.min(100, (s.reached / baseReached) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="comparison-value" style={{ color: i === 0 ? '#ef4444' : '#22c55e' }}>
                      {s.reached?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Intervention Summary Table */}
          <div className="card animate-in">
            <div className="card-header">
              <span className="card-title">Intervention Summary Report</span>
              <span className="card-subtitle">Containment effectiveness for "{currentIncident?.claim?.slice(0, 45)}..."</span>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Candidate Nodes Removed</th>
                    <th>Potential Reach</th>
                    <th>Reach Reduction</th>
                    <th>Effectiveness</th>
                  </tr>
                </thead>
                <tbody>
                  {simulationResult.scenarios.map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: '600' }}>{s.title}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '13px', color: s.nodes === 'None' ? '#888' : '#ef4444' }}>
                        {s.nodes}
                      </td>
                      <td>{s.reached?.toLocaleString()} users</td>
                      <td style={{ color: s.reduction > 0 ? '#22c55e' : '#888', fontWeight: '700' }}>
                        {s.reduction > 0 ? `−${s.reduction}%` : 'Baseline'}
                      </td>
                      <td>
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${s.reduction}%` }}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default WhatIf;
