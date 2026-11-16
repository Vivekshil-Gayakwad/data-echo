import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  // 1. Initialize from localStorage so refresh NEVER wipes verifications!
  const [verifications, setVerifications] = useState(() => {
    try {
      const saved = localStorage.getItem('data_echo_verifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeVerification, setActiveVerification] = useState(() => {
    try {
      const saved = localStorage.getItem('data_echo_active_verification');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Sync verifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('data_echo_verifications', JSON.stringify(verifications));
    } catch {
      // ignore
    }
  }, [verifications]);

  // Sync active verification to localStorage
  useEffect(() => {
    if (activeVerification) {
      try {
        localStorage.setItem('data_echo_active_verification', JSON.stringify(activeVerification));
      } catch {
        // ignore
      }
    }
  }, [activeVerification]);

  // Background sync with database if available
  useEffect(() => {
    let isMounted = true;
    async function syncWithBackend() {
      try {
        const res = await api.verify.getAll();
        if (isMounted && res && res.verifications && res.verifications.length > 0) {
          setVerifications(prev => {
            const merged = [...prev];
            for (const item of res.verifications) {
              if (!merged.some(m => m.id === item.id)) {
                merged.push(item);
              }
            }
            localStorage.setItem('data_echo_verifications', JSON.stringify(merged));
            return merged;
          });
        }
      } catch {
        // Backend offline — keep local verifications safe!
      }
    }
    syncWithBackend();
    return () => { isMounted = false; };
  }, []);

  const runVerification = async (claimText) => {
    setLoading(true);
    try {
      const result = await api.verify.verifyClaim(claimText);
      const newEntry = {
        id: result.id || Date.now(),
        claim: result.claim,
        category: result.category,
        verdict: result.verdict,
        label: result.verdict_label,
        badge: result.verdict_badge,
        truthScore: result.truth_score,
        earliestSource: result.real_source_name || result.source_audit?.earliest_source || 'Origin Unknown',
        earliestTimestamp: result.source_audit?.earliest_timestamp,
        officialSourceUrl: result.evidence_match?.official_source_url,
        explanation: result.explanation,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullResult: result
      };

      setVerifications(prev => {
        const filtered = prev.filter(v => v.claim.toLowerCase() !== claimText.toLowerCase());
        const updated = [newEntry, ...filtered];
        localStorage.setItem('data_echo_verifications', JSON.stringify(updated));
        return updated;
      });

      setActiveVerification(result);
      localStorage.setItem('data_echo_active_verification', JSON.stringify(result));
      return result;
    } finally {
      setLoading(false);
    }
  };

  const removeVerification = async (id) => {
    setVerifications(prev => {
      const updated = prev.filter(v => v.id !== id);
      localStorage.setItem('data_echo_verifications', JSON.stringify(updated));
      if (activeVerification && activeVerification.id === id) {
        const next = updated.length > 0 ? updated[0].fullResult || updated[0] : null;
        setActiveVerification(next);
        if (next) {
          localStorage.setItem('data_echo_active_verification', JSON.stringify(next));
        } else {
          localStorage.removeItem('data_echo_active_verification');
        }
      }
      return updated;
    });

    try {
      await api.verify.remove(id);
    } catch {
      // ignore
    }
  };

  const hasData = verifications.length > 0;

  // Backwards-compatible aliases for Dashboard & older components
  const analyses = verifications.map(v => ({
    id: v.id,
    incident_id: v.id,
    title: v.claim,
    icon: v.verdict === 'Supported' ? '✅' : v.verdict === 'Contradicted' ? '❌' : v.verdict === 'Partially Supported / Misleading' ? '⚠️' : '❓',
    label: v.label?.toLowerCase() || 'unverified',
    source: v.earliestSource || 'Origin Unknown',
    users: 2500,
    reached: Math.round(2500 * ((100 - (v.truthScore || 50)) / 100)),
    reachPct: Math.round(100 - (v.truthScore || 50)),
    steps: 6,
    date: v.date,
    truthScore: v.truthScore,
    badge: v.badge
  }));

  const addAnalysis = async (data) => {
    return runVerification(data.claim || data.title || 'Sample Claim');
  };

  const removeAnalysis = (id) => {
    return removeVerification(id);
  };

  return (
    <AppDataContext.Provider value={{
      verifications,
      activeVerification,
      setActiveVerification,
      runVerification,
      removeVerification,
      hasData,
      loading,
      // Compatibility aliases:
      analyses,
      addAnalysis,
      removeAnalysis,
      activeIncidentId: activeVerification?.id || (verifications[0]?.id || 1),
      setActiveIncidentId: (id) => {
        const found = verifications.find(v => v.id === id);
        if (found) {
          setActiveVerification(found.fullResult || found);
        }
      }
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}
