import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';

const EXAMPLE_CLAIMS = [
  { category: 'Government', claim: 'New government scholarship announced on official portal' },
  { category: 'Natural Disasters', claim: 'Earthquake in Pune with magnitude 6.5 detected' },
  { category: 'College & Education', claim: 'XYZ College closed for 15 days due to pest control' },
  { category: 'Health & Medicine', claim: 'Warm lemon water with turmeric cures diabetes and prevents cancer' },
  { category: 'Financial & Economy', claim: 'RBI to freeze all savings accounts holding over 1 lakh from next Monday' },
  { category: 'Political News', claim: 'EVMs were hacked to manipulate results in recent elections' },
  { category: 'Sports News', claim: 'India won ICC cricket championship final match' },
  { category: 'Government', claim: 'Free government laptop scheme announced for all college students' },
];

function Verify() {
  const { runVerification, activeVerification, loading } = useAppData();
  const [claimInput, setClaimInput] = useState('');
  const [currentResult, setCurrentResult] = useState(activeVerification || null);
  const [selectedExample, setSelectedExample] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  const navigate = useNavigate();

  const handleVerify = async (textToVerify) => {
    const text = (textToVerify || claimInput).trim();
    if (!text) return;
    setVerifyError(null);

    try {
      const res = await runVerification(text);
      if (res) {
        setCurrentResult(res);
      }
    } catch (err) {
      setVerifyError(err.message || 'Verification could not be completed.');
    }
  };

  const handleSelectExample = (ex) => {
    setClaimInput(ex.claim);
    setSelectedExample(ex.claim);
    handleVerify(ex.claim);
  };

  const res = currentResult;

  return (
    <div className="page">
      <div className="page-header">
        <h1>🔍 Real-Time Information Verification</h1>
        <p>
          Verify claims, rumors, and news across authoritative web registries.
          Identifies earliest known sources using timestamp sorting, Jaccard similarity, and Levenshtein distance.
        </p>
      </div>

      {/* VERIFICATION INPUT PANEL */}
      <div className="card animate-in" style={{ marginBottom: '28px', border: '1px solid rgba(255, 215, 0, 0.25)' }}>
        <div className="card-header">
          <span className="card-title">Enter Information or Claim to Verify</span>
          <span className="card-subtitle">Searches domain-specific authoritative portals</span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="e.g. RBI announced a new policy regarding savings accounts, or Earthquake reported in Pune..."
              value={claimInput}
              onChange={(e) => setClaimInput(e.target.value)}
              style={{
                flex: '1 1 300px',
                background: '#141410',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                borderRadius: '12px',
                padding: '14px 18px',
                color: '#f5f5f0',
                fontSize: '15px',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
              }}
              required
            />
            <button
              className="btn-primary"
              type="submit"
              disabled={loading || !claimInput.trim()}
              style={{ minWidth: '180px', justifyContent: 'center' }}
            >
              {loading ? '⏳ Verifying Web Sources...' : '🔎 Verify Claim'}
            </button>
          </div>

          {verifyError && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                borderRadius: '10px',
                color: '#fca5a5',
                fontSize: '13px',
              }}
            >
              ⚠️ {verifyError}
            </div>
          )}

          {/* Quick Example Claim Pills */}
          <div>
            <div style={{ fontSize: '13px', color: '#b0a880', marginBottom: '8px', fontWeight: '500' }}>
              Or test an incident claim:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {EXAMPLE_CLAIMS.map((ex, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => handleSelectExample(ex)}
                  style={{
                    background: selectedExample === ex.claim ? 'rgba(255, 215, 0, 0.2)' : 'rgba(28, 26, 16, 0.9)',
                    border: selectedExample === ex.claim ? '1px solid #FFD700' : '1px solid rgba(255, 215, 0, 0.12)',
                    color: selectedExample === ex.claim ? '#FFD700' : '#b0a880',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  <span style={{ color: '#FFD700', fontWeight: '600', marginRight: '4px' }}>[{ex.category}]</span>
                  {ex.claim.length > 36 ? ex.claim.slice(0, 36) + '...' : ex.claim}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* VERIFICATION RESULTS PANEL */}
      {res ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* TOP VERDICT BANNER */}
          <div
            className="card animate-scale"
            style={{
              borderLeft: `6px solid ${res.verdict_color || '#FFD700'}`,
              background: 'linear-gradient(145deg, #1f1c12 0%, #17150d 100%)',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    background: `${res.verdict_color || '#FFD700'}22`,
                    color: res.verdict_color || '#FFD700',
                    border: `1px solid ${res.verdict_color || '#FFD700'}44`,
                    marginBottom: '10px',
                  }}
                >
                  {res.verdict_badge || res.verdict}
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#f5f5f0' }}>
                  "{res.claim}"
                </h2>
                <p style={{ color: '#b0a880', fontSize: '14px', lineHeight: '1.6', maxWidth: '850px' }}>
                  {res.explanation}
                </p>
              </div>

              {/* Truth Score Dial */}
              <div
                style={{
                  minWidth: '150px',
                  padding: '16px 20px',
                  borderRadius: '14px',
                  background: 'rgba(255, 215, 0, 0.05)',
                  border: '1px solid rgba(255, 215, 0, 0.15)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: '#a0a090', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Truth / Credibility Index
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: res.verdict_color || '#FFD700', margin: '4px 0' }}>
                  {res.truth_score}%
                </div>
                <div className="progress-bar" style={{ width: '100%', margin: '0 auto', height: '8px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${res.truth_score}%`,
                      background: res.verdict_color || 'var(--gradient-yellow)',
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons to Graphs */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="btn-secondary btn-small"
                onClick={() => navigate('/source-propagation')}
              >
                🕸️ Open in Source & Propagation Analysis ➔
              </button>
              <button
                className="btn-secondary btn-small"
                onClick={() => navigate('/what-if')}
              >
                🛡️ Test in What-If Intervention Simulator ➔
              </button>
            </div>
          </div>

          {/* TWO-COLUMN METRICS: AUTHORITIES & EARLIEST KNOWN SOURCE */}
          <div className="dashboard-grid-equal">
            {/* COLUMN 1: Category & Authoritative Sources */}
            <div className="card animate-left">
              <div className="card-header">
                <span className="card-title">Where Verified: Category & Official Registries</span>
                <span className="card-subtitle">Identified: {res.category}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '13px', color: '#a0a090', lineHeight: '1.5' }}>
                  The engine automatically classified the claim under <strong>{res.category}</strong> and cross-referenced official monitoring portals:
                </div>
                {res.target_authorities?.map((auth, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 215, 0, 0.04)',
                      border: '1px solid rgba(255, 215, 0, 0.08)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#f5f5f0' }}>{auth.name}</div>
                      <div style={{ fontSize: '12px', color: '#FFD700', fontFamily: 'monospace' }}>{auth.domain}</div>
                    </div>
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,215,0,0.1)', color: '#FFD700' }}>
                      {auth.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 2: Earliest Known Source */}
            <div className="card animate-right">
              <div className="card-header">
                <span className="card-title">Earliest Known Source Tracing</span>
                <span className="card-subtitle">Timestamp & Citation Provenance</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 215, 0, 0.06)', border: '1px solid rgba(255, 215, 0, 0.18)' }}>
                  <div style={{ fontSize: '11px', color: '#a0a090', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Real Earliest Source Name
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#FFD700', margin: '6px 0' }}>
                    {res.real_source_name || res.source_audit?.earliest_source || 'Origin Unknown'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#d0d0c0' }}>
                    Publisher Type: <strong>{res.source_audit?.earliest_type || (res.source_audit?.is_official ? 'Verified Official Source' : 'Web Publisher')}</strong>
                  </div>
                  {res.source_audit?.earliest_timestamp && (
                    <div style={{ fontSize: '12px', color: '#a0a090', marginTop: '4px' }}>
                      🕒 First Observed Publication: <strong>{new Date(res.source_audit.earliest_timestamp).toUTCString()}</strong>
                    </div>
                  )}
                  {res.source_audit?.earliest_url && (
                    <a
                      href={res.source_audit.earliest_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '12px', color: '#38bdf8', marginTop: '8px', display: 'inline-block', textDecoration: 'none' }}
                    >
                      🔗 Visit Original Source Link ↗
                    </a>
                  )}
                </div>

                {/* Reference citation flow */}
                <div style={{ fontSize: '13px', color: '#a0a090' }}>
                  <strong>Provenance & Attribution Chain:</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {res.source_audit?.reference_chain && res.source_audit.reference_chain.length > 0 ? (
                    res.source_audit.reference_chain.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,215,0,0.06)' }}>
                        <span style={{ color: '#FFD700', fontWeight: '700' }}>#{i + 1}</span>
                        <span style={{ color: '#f5f5f0' }}>{typeof item === 'string' ? item : item.publisher}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', padding: '8px' }}>
                      No verified citation chain available. Classification: Origin Unknown.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* REAL LIVE ARTICLES FOUND ACROSS THE INTERNET */}
          {res.live_articles_found && res.live_articles_found.length > 0 ? (
            <div className="card animate-in">
              <div className="card-header">
                <span className="card-title">🌐 Live Internet Articles & Sources Found</span>
                <span className="card-subtitle">
                  {res.live_articles_found.length} real-time web publications matched via string similarity & timestamp sorting
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {res.live_articles_found.map((art, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '16px 20px',
                      borderRadius: '12px',
                      background: 'rgba(255, 215, 0, 0.03)',
                      border: '1px solid rgba(255, 215, 0, 0.12)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '6px', background: 'rgba(255, 215, 0, 0.15)', color: '#FFD700' }}>
                          📰 {art.publisher}
                        </span>
                        <span style={{ fontSize: '12px', color: '#a0a090' }}>
                          {art.published_at ? new Date(art.published_at).toLocaleString() : 'Recent Web Index'}
                        </span>
                      </div>
                      {art.match_score !== undefined && (
                        <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: '600' }}>
                          {Math.round(art.match_score * 100)}% Semantic Match
                        </span>
                      )}
                    </div>

                    <h4 style={{ fontSize: '15px', color: '#f5f5f0', margin: '4px 0 6px 0', fontWeight: '600' }}>
                      {art.title}
                    </h4>

                    {art.snippet && (
                      <p style={{ fontSize: '13px', color: '#a0a090', lineHeight: '1.5', margin: '0 0 10px 0' }}>
                        {art.snippet}
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      {art.citations && art.citations.length > 0 && (
                        <span style={{ fontSize: '11px', color: '#FFD700' }}>
                          Citations: {art.citations.join(', ')}
                        </span>
                      )}
                      {art.url && (
                        <a
                          href={art.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '12px', color: '#38bdf8', textDecoration: 'none', fontWeight: '600', marginLeft: 'auto' }}
                        >
                          🔗 Read Full Source Article on {art.publisher} ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card animate-in" style={{ padding: '20px', border: '1px solid rgba(255, 215, 0, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🔍</span>
                <div>
                  <h4 style={{ fontSize: '15px', color: '#f5f5f0', margin: 0 }}>
                    Live Web Search Status: No Mainstream Articles Found
                  </h4>
                  <p style={{ fontSize: '13px', color: '#a0a090', margin: '4px 0 0 0' }}>
                    The real-time internet search across Google News, Wikipedia, and official press registries found zero matching reports.
                    This statement is classified as <strong>Unverified / Rumor</strong> with <strong>Origin Unknown</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* DSA EVIDENCE COMPARISON & METRICS */}
          <div className="card animate-in">
            <div className="card-header">
              <span className="card-title">DSA Verification & Similarity Algorithms</span>
              <span className="card-subtitle">Levenshtein Matrix DP · Jaccard Similarity · Cryptographic Hashing</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.1)' }}>
                <div style={{ fontSize: '11px', color: '#a0a090' }}>Jaccard Token Similarity</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#FFD700', marginTop: '4px' }}>
                  {res.evidence_match?.jaccard_similarity ? `${Math.round(res.evidence_match.jaccard_similarity * 100)}%` : '0%'}
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Token set overlap J(A, B)</div>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.1)' }}>
                <div style={{ fontSize: '11px', color: '#a0a090' }}>Levenshtein Distance Match</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#FFD700', marginTop: '4px' }}>
                  {res.evidence_match?.levenshtein_similarity ? `${Math.round(res.evidence_match.levenshtein_similarity * 100)}%` : '0%'}
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Edit operations matrix</div>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.1)' }}>
                <div style={{ fontSize: '11px', color: '#a0a090' }}>Duplicate Detection Hash</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFD700', marginTop: '6px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {res.hash_signatures?.sha256 ? res.hash_signatures.sha256.slice(0, 16) + '...' : 'N/A'}
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>SHA-256 Signature</div>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.1)' }}>
                <div style={{ fontSize: '11px', color: '#a0a090' }}>Verification Rule Result</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: res.verdict_color || '#FFD700', marginTop: '4px' }}>
                  {res.verdict}
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>5-Point Rule Engine</div>
              </div>
            </div>

            {/* Official Matched Statement */}
            {res.evidence_match?.matched_record && (
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,215,0,0.15)' }}>
                <div style={{ fontSize: '12px', color: '#FFD700', fontWeight: '600', marginBottom: '4px' }}>
                  Official Registry Record Matched:
                </div>
                <div style={{ fontSize: '14px', color: '#f5f5f0', fontStyle: 'italic', lineHeight: '1.6' }}>
                  "{res.evidence_match.matched_record}"
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12px', color: '#888' }}>
                  <span>Publisher: <strong>{res.evidence_match.official_publisher}</strong></span>
                  {res.evidence_match.official_source_url && (
                    <a href={res.evidence_match.official_source_url} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>
                      Verify on {res.evidence_match.official_source_url} ↗
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CRITICAL LIMITATION NOTICE */}
          {res.limitations_note && (
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                background: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                color: '#fef08a',
                fontSize: '13px',
                lineHeight: '1.6',
              }}
            >
              ⚠️ <strong>System Limitation & Scope:</strong> {res.limitations_note}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default Verify;
