import { useState, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';
import { api } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const fallbackIncidents = [
  { id: 1, icon: '🦠', title: 'COVID Vaccine Microchip', label: 'false', claim: '"COVID-19 vaccines contain microchips designed to track people via 5G networks."', source: 'Social Media / WhatsApp', users: 2500, category: 'Health' },
  { id: 2, icon: '🏫', title: 'College Closure Rumour', label: 'false', claim: '"XYZ Engineering College will remain closed for the entire week due to a pest control emergency."', source: 'WhatsApp Group', users: 2500, category: 'Education' },
  { id: 3, icon: '🌊', title: 'Tsunami Warning Hoax', label: 'false', claim: '"A massive tsunami is expected to hit the eastern coast within the next 6 hours. Evacuate immediately."', source: 'Facebook / SMS', users: 2500, category: 'Disaster' },
  { id: 4, icon: '💊', title: 'Miracle Turmeric Cure', label: 'mixed', claim: '"Drinking warm lemon water with turmeric every morning can cure diabetes and prevent cancer."', source: 'Instagram / YouTube', users: 2500, category: 'Health' },
  { id: 5, icon: '📱', title: '5G Health Conspiracy', label: 'false', claim: '"5G towers emit radiation that weakens the immune system and causes respiratory illness."', source: 'Twitter / Telegram', users: 2500, category: 'Technology' },
  { id: 6, icon: '🗳️', title: 'Election Rigging Claim', label: 'false', claim: '"EVMs were hacked to manipulate results in the recent state election."', source: 'Twitter / WhatsApp', users: 2500, category: 'Politics' },
  { id: 7, icon: '🏦', title: 'Bank Account Freeze Alert', label: 'false', claim: '"RBI will freeze all savings accounts above 1 lakh from next Monday."', source: 'WhatsApp', users: 2500, category: 'Finance' },
  { id: 8, icon: '💧', title: 'Drinking Water Contamination', label: 'mixed', claim: '"City water supply has been contaminated with toxic industrial chemicals."', source: 'Facebook', users: 2500, category: 'Environment' },
  { id: 9, icon: '💻', title: 'Free Government Laptop Scheme', label: 'false', claim: '"Government is giving free laptops to all college students via a registration link."', source: 'Instagram', users: 2500, category: 'Government' },
  { id: 10, icon: '🌍', title: 'Earthquake Prediction', label: 'false', claim: '"Scientists predict an 8.5 magnitude earthquake in Delhi within 48 hours."', source: 'Twitter', users: 2500, category: 'Disaster' },
];

function Analyze() {
  const { addAnalysis, setActiveIncidentId } = useAppData();
  const [datasets, setDatasets] = useState(fallbackIncidents);
  const [selected, setSelected] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    claim: '',
    source: '',
    label: 'false',
    severity: 'medium',
    users: 2500,
    icon: '📰',
    sharing_probability: 0.45
  });

  // Fetch incidents from SQLite backend
  useEffect(() => {
    let isMounted = true;
    async function fetchIncidents() {
      setLoadingList(true);
      try {
        const res = await api.incidents.getAll();
        if (isMounted && res && res.incidents && res.incidents.length > 0) {
          setDatasets(res.incidents);
        }
      } catch {
        // Keeps fallbackIncidents
      } finally {
        if (isMounted) setLoadingList(false);
      }
    }
    fetchIncidents();
    return () => { isMounted = false; };
  }, []);

  const ds = selected ? datasets.find(d => d.id === selected) : null;

  const handleAnalyze = async () => {
    if (!ds) return;
    setAnalyzing(true);
    setResults(null);

    try {
      // Query analysis from SQLite backend
      const res = await api.incidents.getAnalysis(ds.id);
      setResults(res);
      setActiveIncidentId(ds.id);

      // Save to user's persistent analysis history in SQLite
      await addAnalysis({
        incident_id: ds.id,
        title: ds.title,
        icon: ds.icon || '📰',
        label: ds.label || 'false',
        users: ds.users || 2500,
        reached: res.reached,
        reachPct: res.reachPct,
        steps: res.steps,
        source: ds.source,
      });
    } catch {
      // Fallback calculation if offline
      const reached = Math.round(2500 * 0.72);
      const reachPct = 72;
      const fallbackRes = {
        reached,
        reachPct,
        steps: 6,
        spread: [
          { step: 'Step 0', reached: 1 },
          { step: 'Step 1', reached: 25 },
          { step: 'Step 2', reached: 180 },
          { step: 'Step 3', reached: 620 },
          { step: 'Step 4', reached: 1250 },
          { step: 'Step 5', reached: 1650 },
          { step: 'Step 6', reached: 1800 },
        ],
        community: [
          { name: 'Students', reached: 780 },
          { name: 'News Enthusiasts', reached: 450 },
          { name: 'Local Community', reached: 320 },
          { name: 'Parents', reached: 180 },
          { name: 'Professionals', reached: 70 },
        ],
      };
      setResults(fallbackRes);
      setActiveIncidentId(ds.id);
      addAnalysis({
        incident_id: ds.id,
        title: ds.title,
        icon: ds.icon || '📰',
        label: ds.label || 'false',
        users: 2500,
        reached,
        reachPct,
        steps: 6,
        source: ds.source,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddIncident = async (e) => {
    e.preventDefault();
    if (!newIncident.title || !newIncident.claim) return;

    try {
      const res = await api.incidents.add({
        title: newIncident.title,
        claim_text: newIncident.claim,
        source_platform: newIncident.source || 'Social Media',
        fact_check_label: newIncident.label,
        severity: newIncident.severity,
        icon: newIncident.icon,
        users: parseInt(newIncident.users) || 2500,
        sharing_probability: parseFloat(newIncident.sharing_probability) || 0.45,
      });

      const added = res.incident;
      setDatasets(prev => [...prev, added]);
      setSelected(added.id);
      setShowAddForm(false);
      setNewIncident({
        title: '',
        claim: '',
        source: '',
        label: 'false',
        severity: 'medium',
        users: 2500,
        icon: '📰',
        sharing_probability: 0.45
      });
      setResults(null);
    } catch (err) {
      alert(err.message || 'Could not add incident');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>🔍 Analyze Misinformation</h1>
        <p>Select or add a misinformation incident, view the claim, and analyze its propagation</p>
      </div>

      <div className="analyze-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card animate-left">
            <div className="card-header">
              <span className="card-title">Incidents ({datasets.length})</span>
              <button className="btn-secondary btn-small" onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? '✕ Cancel' : '+ Add New'}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddIncident} className="add-incident-form animate-in" style={{ marginBottom: '16px' }}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Election Fraud Claim"
                    value={newIncident.title}
                    onChange={e => setNewIncident(p => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Claim Text</label>
                  <input
                    type="text"
                    placeholder="The full claim description..."
                    value={newIncident.claim}
                    onChange={e => setNewIncident(p => ({ ...p, claim: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Source Platform</label>
                  <input
                    type="text"
                    placeholder="e.g. WhatsApp, Twitter, Instagram"
                    value={newIncident.source}
                    onChange={e => setNewIncident(p => ({ ...p, source: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Label</label>
                    <select value={newIncident.label} onChange={e => setNewIncident(p => ({ ...p, label: e.target.value }))}>
                      <option value="false">False</option>
                      <option value="mixed">Mixed</option>
                      <option value="true">True</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Icon</label>
                    <select value={newIncident.icon} onChange={e => setNewIncident(p => ({ ...p, icon: e.target.value }))}>
                      <option value="📰">📰 News</option>
                      <option value="⚠️">⚠️ Warning</option>
                      <option value="🗳️">🗳️ Politics</option>
                      <option value="🦠">🦠 Health</option>
                      <option value="🌍">🌍 Global</option>
                      <option value="📱">📱 Tech</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Sharing Probability (0.1 - 0.9): <strong>{newIncident.sharing_probability}</strong></label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={newIncident.sharing_probability}
                    onChange={e => setNewIncident(p => ({ ...p, sharing_probability: e.target.value }))}
                  />
                </div>
                <button className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>
                  + Add & Run BFS Simulation
                </button>
              </form>
            )}

            <div className="dataset-list" style={{ maxHeight: '480px', overflowY: 'auto' }}>
              {datasets.map((d) => (
                <div
                  key={d.id}
                  className={`dataset-item ${selected === d.id ? 'selected' : ''}`}
                  onClick={() => { setSelected(d.id); setResults(null); }}
                >
                  <div className="dataset-icon">{d.icon || '📰'}</div>
                  <div className="dataset-info">
                    <h4>{d.title}</h4>
                    <p>{d.source} · {d.users?.toLocaleString() || '2,500'} users</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {ds ? (
            <>
              <div className="card animate-right">
                <div className="card-header">
                  <span className="card-title">Claim Details</span>
                </div>
                <div className="claim-box">
                  <div className={`claim-label ${ds.label === 'false' ? 'false' : ds.label === 'mixed' ? 'mixed' : 'true-label'}`}>
                    {ds.label === 'false' ? '✗ False' : ds.label === 'mixed' ? '~ Mixed' : '✓ True'}
                  </div>
                  <div className="claim-text">{ds.claim}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div className="info-pill">
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Source</div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{ds.source}</div>
                  </div>
                  <div className="info-pill">
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Network Size</div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{ds.users?.toLocaleString() || '2,500'} users</div>
                  </div>
                </div>
                <button
                  className="btn-primary"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {analyzing ? '⏳ Traversing Network (BFS)...' : '▶ Start Analysis'}
                </button>
              </div>

              {results && (
                <>
                  <div className="metrics-grid animate-in" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="metric-card">
                      <div className="metric-icon">📡</div>
                      <div className="metric-value">{results.reached?.toLocaleString()}</div>
                      <div className="metric-label">Users Reached</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-icon">📈</div>
                      <div className="metric-value">{results.reachPct}%</div>
                      <div className="metric-label">Network Reach</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-icon">⚡</div>
                      <div className="metric-value">{results.steps}</div>
                      <div className="metric-label">Propagation Steps</div>
                    </div>
                  </div>

                  <div className="card animate-in">
                    <div className="card-header">
                      <span className="card-title">Spread Timeline</span>
                      <span className="card-subtitle">Cumulative users reached per step</span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={results.spread}>
                        <defs>
                          <linearGradient id="colorSpread2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FFD700" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="step" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip contentStyle={{ background: '#1a1a0f', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', color: '#f5f5f5' }} />
                        <Area type="monotone" dataKey="reached" stroke="#FFD700" fill="url(#colorSpread2)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card animate-in">
                    <div className="card-header">
                      <span className="card-title">Community Exposure</span>
                      <span className="card-subtitle">Reach across community clusters</span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={results.community}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip contentStyle={{ background: '#1a1a0f', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', color: '#f5f5f5' }} />
                        <Bar dataKey="reached" fill="#B8860B" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="card empty-select-card animate-scale">
              <div className="floating-icon">📋</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Select an Incident</h3>
              <p style={{ fontSize: '14px', color: '#a0a0a0' }}>Choose an incident from the 10 available datasets or click "+ Add New" to create one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analyze;
