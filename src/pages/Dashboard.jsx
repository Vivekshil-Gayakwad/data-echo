import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const { analyses, verifications, removeAnalysis, setActiveVerification, hasData } = useAppData();
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  const displayList = showAll ? analyses : analyses.slice(0, 4);

  // Build trend data from verifications/analyses
  const trendData = analyses.length > 0
    ? analyses.slice(0, 7).reverse().map((a, i) => ({
        step: `#${i + 1}`,
        truthScore: a.truthScore !== undefined ? a.truthScore : (100 - (a.reachPct || 50)),
        reached: a.reached || 0,
      }))
    : [];

  // Average credibility score
  const avgCredibility = verifications.length > 0
    ? Math.round(verifications.reduce((acc, v) => acc + (v.truthScore || 50), 0) / verifications.length)
    : (analyses[0]?.truthScore || 75);

  const earliestSourcesCount = verifications.filter(v => v.earliestSource && v.earliestSource !== 'Origin Unknown').length;

  // Empty state for new user
  if (!hasData) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>📊 Dashboard</h1>
          <p>Welcome to Data Echo — Real-Time Misinformation & Propagation Analysis Platform</p>
        </div>

        <div className="empty-state-container animate-in">
          <div className="empty-state-card">
            <div className="empty-state-icon">📡</div>
            <h2>No Verifications Yet</h2>
            <p>Start by verifying a real-time news claim, rumor, or headline. Data Echo will cross-reference authoritative registries, trace the earliest known publication source, and model network propagation.</p>
            <Link to="/verify" className="btn-primary" style={{ marginTop: '12px' }}>
              🔍 Verify Information
            </Link>
          </div>

          <div className="empty-hints-grid">
            <div className="empty-hint-card animate-in-delay-1">
              <div className="empty-hint-icon">1</div>
              <h4>Verify Claims</h4>
              <p>Rule-based cross-referencing against official government, health, academic, and financial databases</p>
            </div>
            <div className="empty-hint-card animate-in-delay-2">
              <div className="empty-hint-icon">2</div>
              <h4>Source & Propagation</h4>
              <p>Identify earliest known sources via timestamp sorting and explore 3 interactive graph layers</p>
            </div>
            <div className="empty-hint-card animate-in-delay-3">
              <div className="empty-hint-icon">3</div>
              <h4>What-If Simulator</h4>
              <p>Generate Scale-Free, Small-World, or Random social networks and simulate BFS interventions</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard with data
  const latest = analyses[0];

  return (
    <div className="page">
      <div className="page-header">
        <h1>📊 Dashboard</h1>
        <p>Overview of your real-time verification and information propagation activity</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card animate-in-delay-1">
          <div className="metric-icon">📋</div>
          <div className="metric-value">{analyses.length}</div>
          <div className="metric-label">Claims Verified</div>
        </div>
        <div className="metric-card animate-in-delay-2">
          <div className="metric-icon">🛡️</div>
          <div className="metric-value">{avgCredibility}%</div>
          <div className="metric-label">Avg Credibility Index</div>
        </div>
        <div className="metric-card animate-in-delay-3">
          <div className="metric-icon">🕒</div>
          <div className="metric-value">{earliestSourcesCount || analyses.length}</div>
          <div className="metric-label">Earliest Sources Tracked</div>
        </div>
        <div className="metric-card animate-in-delay-4">
          <div className="metric-icon">⚡</div>
          <div className="metric-value">{latest?.reached?.toLocaleString() || '—'}</div>
          <div className="metric-label">Latest Potential Reach</div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        {trendData.length > 1 && (
          <div className="card animate-left">
            <div className="card-header">
              <span className="card-title">Credibility & Truth Trend</span>
              <span className="card-subtitle">Truth index score across recent verifications</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="step" stroke="#666" />
                <YAxis stroke="#666" domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#1a1a0f', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', color: '#f5f5f5' }} />
                <Area type="monotone" dataKey="truthScore" name="Truth Index %" stroke="#FFD700" fill="url(#colorDash)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card animate-right">
          <div className="card-header">
            <span className="card-title">Quick Action</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: '20px' }}>
            <div className="floating-icon">🔍</div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Verify New Information</h3>
              <p style={{ fontSize: '13px', color: '#a0a0a0', marginBottom: '20px' }}>
                Test any headline or claim against official registries using string similarity and hashing
              </p>
            </div>
            <Link to="/verify" className="btn-primary">▶ Start Verification</Link>
          </div>
        </div>
      </div>

      <div className="card animate-in">
        <div className="card-header">
          <span className="card-title">Recent Verifications</span>
          {analyses.length > 4 && (
            <button
              className="btn-secondary btn-small"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `View All (${analyses.length})`}
            </button>
          )}
        </div>
        <div className={`recent-list ${showAll ? 'expanded' : ''}`}>
          {displayList.map((item) => (
            <div
              className="recent-item"
              key={item.id}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                const full = verifications.find(v => v.id === item.id);
                if (full) {
                  setActiveVerification(full.fullResult || full);
                  navigate('/verify');
                }
              }}
            >
              <div className="recent-icon">{item.icon}</div>
              <div className="recent-info" style={{ flex: 1 }}>
                <h4>{item.title}</h4>
                <p>
                  {item.date} · Earliest Source: <strong>{item.source}</strong> · Potential Reach: {item.reached?.toLocaleString()} users
                </p>
              </div>
              <span
                className={`claim-label ${
                  item.label?.includes('supported') && !item.label?.includes('partially')
                    ? 'true'
                    : item.label?.includes('contradicted') || item.label?.includes('false')
                    ? 'false'
                    : 'mixed'
                }`}
                style={{ marginBottom: 0 }}
              >
                {item.badge || (item.label === 'false' ? '✗ Contradicted' : item.label === 'true' ? '✓ Supported' : '~ Misleading')}
              </span>
              <button
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAnalysis(item.id);
                }}
                title="Remove Verification"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
