import { verifyClaimLocally } from './verificationEngineClient';
import { verifyClaimWithLiveInternet } from './liveWebVerifierClient';

/**
 * Data Echo — API Service Client
 * Handles HTTP requests to the Flask backend with Vite proxy and direct fallback.
 */

function getAuthHeaders() {
  const token = localStorage.getItem('data_echo_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  // Try relative endpoint first (proxied by Vite)
  try {
    const res = await fetch(`/api${endpoint}`, { ...options, headers });
    return res;
  } catch (proxyErr) {
    // If Vite proxy fails, try direct backend URL
    try {
      const res = await fetch(`http://127.0.0.1:5000/api${endpoint}`, { ...options, headers });
      return res;
    } catch (directErr) {
      throw proxyErr || directErr;
    }
  }
}

export const api = {
  // Authentication
  auth: {
    async login(email, password) {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to sign in');
      }
      return res.json();
    },

    async register(name, email, password) {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to register account');
      }
      return res.json();
    },

    async demoLogin() {
      const res = await request('/auth/demo', {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Demo login failed');
      }
      return res.json();
    },

    async getProfile() {
      try {
        const res = await request('/auth/me');
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
  },

  // Real-Time Information Verification
  verify: {
    async verifyClaim(claimText) {
      try {
        const res = await request('/verify', {
          method: 'POST',
          body: JSON.stringify({ claim: claimText }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.verdict) {
            return data;
          }
        }
      } catch {
        // Backend unreachable or offline
      }

      // Real-time live web query from browser
      try {
        const liveRes = await verifyClaimWithLiveInternet(claimText);
        if (liveRes && liveRes.live_articles_found && liveRes.live_articles_found.length > 0) {
          return liveRes;
        }
      } catch {
        // Fallback to local rule engine
      }

      return verifyClaimLocally(claimText);
    },

    async getAll() {
      try {
        const res = await request('/verifications');
        if (!res.ok) return { verifications: [] };
        return res.json();
      } catch {
        return { verifications: [] };
      }
    },

    async getById(id) {
      const res = await request(`/verifications/${id}`);
      if (!res.ok) throw new Error('Verification details not found');
      return res.json();
    },

    async remove(id) {
      const res = await request(`/verifications/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove verification');
      return res.json();
    },

    async getCategories() {
      try {
        const res = await request('/categories');
        if (!res.ok) return { categories: [] };
        return res.json();
      } catch {
        return { categories: [] };
      }
    },
  },

  // Interactive Graph Visualizations (Source Graph, Propagation Graph, Claim Graph)
  graphs: {
    async getGraph(type = 'source', claimId = null, claimText = '') {
      let url = `/graphs?type=${encodeURIComponent(type)}`;
      if (claimId) url += `&id=${encodeURIComponent(claimId)}`;
      if (claimText) url += `&claim=${encodeURIComponent(claimText)}`;
      const res = await request(url);
      if (!res.ok) throw new Error(`Failed to load ${type} graph`);
      return res.json();
    },
  },

  // What-If Simulator: Social Network Generator & BFS Intervention
  whatIf: {
    async generateNetwork(modelType = 'scale-free', nodeCount = 50) {
      const res = await request('/what-if/generate', {
        method: 'POST',
        body: JSON.stringify({ model_type: modelType, node_count: nodeCount }),
      });
      if (!res.ok) throw new Error('Failed to generate network');
      return res.json();
    },

    async simulate(adj, sourceNode = 'U001', sharingProb = 0.55, candidateCount = 3) {
      const res = await request('/what-if/simulate', {
        method: 'POST',
        body: JSON.stringify({
          adj,
          source_node: sourceNode,
          sharing_prob: sharingProb,
          candidate_count: candidateCount,
        }),
      });
      if (!res.ok) throw new Error('Simulation failed');
      return res.json();
    },
  },

  // Backwards-compatibility aliases
  userAnalyses: {
    async getAll() {
      try {
        const res = await request('/user/analyses');
        if (!res.ok) return { analyses: [] };
        return res.json();
      } catch {
        return { analyses: [] };
      }
    },
    async save(data) {
      return data;
    },
    async remove(id) {
      try {
        await request(`/user/analyses/${id}`, { method: 'DELETE' });
      } catch {
        // ignore
      }
    },
  },
  network: {
    async getGraph(id) {
      const res = await request(`/network?incident_id=${id}`);
      return res.json();
    },
  },
};
