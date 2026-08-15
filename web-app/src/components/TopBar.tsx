import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface TopBarProps {
  criticalAlertCount: number;
  onOpenCreateMission?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ criticalAlertCount, onOpenCreateMission }) => {
  const { userEmail, clearanceLevel, logout } = useAuth();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const initials = userEmail
    ? userEmail.split('@')[0].substring(0, 2).toUpperCase()
    : 'CM';

  return (
    <header style={styles.topbar}>
      {/* Alert Ticker */}
      <div style={styles.alertTicker}>
        {criticalAlertCount > 0 ? (
          <div style={styles.alertCritical}>
            <span style={styles.pulseDot} />
            <span style={styles.alertText}>
              ALERT: {criticalAlertCount} CRITICAL INCIDENTS IN PROGRESS — SECTOR CALICUT
            </span>
          </div>
        ) : (
          <div style={styles.alertNominal}>
            <span style={styles.nominalDot} />
            <span style={styles.nominalText}>ALL SECTORS MONITORED // DEFENSE LEVEL: GREEN</span>
          </div>
        )}
      </div>

      {/* Right Telemetry & Auth User Profile */}
      <div style={styles.metaRow}>
        {onOpenCreateMission && (
          <button
            className="hud-btn hud-btn-critical"
            style={{ fontSize: '11px', padding: '6px 14px' }}
            onClick={onOpenCreateMission}>
            ⚡ DISPATCH MISSION
          </button>
        )}

        <div style={styles.telemetryPill}>
          <span style={styles.metaLabel}>CLEARANCE:</span>
          <span style={styles.metaVal}>{clearanceLevel}</span>
        </div>

        <div style={styles.clockPill}>
          <span style={styles.clockText}>{time || 'SYNCING UTC...'}</span>
        </div>

        {/* Commander Profile & Logout */}
        <div style={styles.userProfilePill}>
          <div style={styles.avatarCircle}>{initials}</div>
          <div style={styles.userInfo}>
            <span style={styles.userName}>COMMANDER</span>
            <span style={styles.userEmail}>{userEmail}</span>
          </div>
          <button style={styles.logoutBtn} onClick={logout} title="Sign Out">
            🔒 LOGOUT
          </button>
        </div>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  topbar: {
    height: '60px',
    backgroundColor: '#0a0e1c',
    borderBottom: '1px solid #1e2b4d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
  },
  alertTicker: {
    display: 'flex',
    alignItems: 'center',
  },
  alertCritical: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 56, 96, 0.15)',
    border: '1px solid rgba(255, 56, 96, 0.4)',
    padding: '6px 14px',
    borderRadius: '4px',
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '4px',
    backgroundColor: '#ff3860',
    boxShadow: '0 0 8px #ff3860',
  },
  alertText: {
    color: '#ff3860',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '0.8px',
  },
  alertNominal: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  nominalDot: {
    width: '6px',
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#00e676',
  },
  nominalText: {
    color: '#8493b2',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.8px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  telemetryPill: {
    backgroundColor: '#131b31',
    border: '1px solid #1e2b4d',
    padding: '4px 10px',
    borderRadius: '4px',
    display: 'flex',
    gap: '6px',
  },
  metaLabel: {
    color: '#4d5c80',
    fontSize: '11px',
    fontWeight: 700,
  },
  metaVal: {
    color: '#00e676',
    fontSize: '11px',
    fontWeight: 800,
  },
  clockPill: {
    backgroundColor: '#131b31',
    border: '1px solid #1e2b4d',
    padding: '4px 12px',
    borderRadius: '4px',
  },
  clockText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    color: '#f0f4fc',
    fontWeight: 700,
  },
  userProfilePill: {
    backgroundColor: '#131b31',
    border: '1px solid #1e2b4d',
    borderRadius: '6px',
    padding: '4px 8px 4px 6px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  avatarImg: {
    width: '28px',
    height: '28px',
    borderRadius: '14px',
  },
  avatarCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '14px',
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    border: '1px solid #00d4ff',
    color: '#00d4ff',
    fontSize: '11px',
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    color: '#f0f4fc',
    fontSize: '11px',
    fontWeight: 800,
    lineHeight: '1.2',
  },
  userEmail: {
    color: '#4d5c80',
    fontSize: '9px',
    fontWeight: 600,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 56, 96, 0.12)',
    border: '1px solid rgba(255, 56, 96, 0.3)',
    color: '#ff3860',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '9px',
    fontWeight: 800,
    cursor: 'pointer',
    letterSpacing: '0.5px',
  },
};
