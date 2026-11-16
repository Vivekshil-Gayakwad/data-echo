import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';

function Profile() {
  const { user } = useAuth();
  const { analyses } = useAppData();

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>👤 Profile</h1>
        <p>Your account information</p>
      </div>

      <div className="card animate-in" style={{ marginBottom: '24px' }}>
        <div className="profile-header-card">
          <div className="profile-header-avatar">👤</div>
          <div>
            <h2 style={{ fontSize: '22px', marginBottom: '4px' }}>{user?.name || 'Demo User'}</h2>
            <p style={{ fontSize: '14px', color: '#a0a0a0' }}>{user?.email || 'demo@dataecho.com'}</p>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Joined {user?.joinedDate || 'Oct 2026'}</p>
          </div>
        </div>
      </div>

      <div className="card animate-in-delay-1" style={{ marginBottom: '24px' }}>
        <div className="card-header"><span className="card-title">Activity Summary</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { icon: '📋', value: analyses.length, label: 'Analyses Run' },
            { icon: '🛡️', value: Math.floor(analyses.length / 2), label: 'Interventions' },
            { icon: '🕸️', value: analyses.length > 0 ? 1 : 0, label: 'Networks' },
          ].map((item, i) => (
            <div key={i} className="activity-stat-card">
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFD700' }}>{item.value}</div>
              <div style={{ fontSize: '12px', color: '#a0a0a0', marginTop: '4px' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card animate-in-delay-2">
        <div className="card-header"><span className="card-title">Account Details</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Display Name', value: user?.name || 'Demo User' },
            { label: 'Email', value: user?.email || 'demo@dataecho.com' },
            { label: 'Role', value: 'Researcher' },
            { label: 'Member Since', value: user?.joinedDate || 'Oct 2026' },
          ].map((item, i) => (
            <div key={i} className="detail-row">
              <span style={{ fontSize: '13px', color: '#a0a0a0' }}>{item.label}</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Profile;
