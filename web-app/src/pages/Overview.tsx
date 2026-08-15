import React from 'react';
import type { Hero, Mission, Incident } from '../types';

interface OverviewProps {
  heroes: Hero[];
  missions: Mission[];
  incidents: Incident[];
  onNavigateToDispatch: (incidentId?: string) => void;
  onNavigateToChat: () => void;
}

export const Overview: React.FC<OverviewProps> = ({
  heroes,
  missions,
  incidents,
  onNavigateToDispatch,
  onNavigateToChat,
}) => {
  const onlineHeroes = heroes.filter((h) => h.status === 'online');
  const onMissionHeroes = heroes.filter((h) => h.status === 'on_mission' || h.status === 'busy');
  const criticalMissions = missions.filter((m) => m.priority === 'critical');

  return (
    <div style={styles.container}>
      {/* Top Stat Cards */}
      <div style={styles.statsGrid}>
        <div className="hud-panel" style={styles.statCard}>
          <span style={styles.statLabel}>AVAILABLE HEROES</span>
          <div style={styles.statValueRow}>
            <span style={{ ...styles.statVal, color: '#00e676' }}>{onlineHeroes.length}</span>
            <span style={styles.statTotal}>/ {heroes.length} READY</span>
          </div>
        </div>

        <div className="hud-panel" style={styles.statCard}>
          <span style={styles.statLabel}>ACTIVE MISSIONS</span>
          <div style={styles.statValueRow}>
            <span style={{ ...styles.statVal, color: '#00d4ff' }}>{missions.length}</span>
            <span style={styles.statTotal}>ACROSS 4 SECTORS</span>
          </div>
        </div>

        <div className="hud-panel" style={styles.statCard}>
          <span style={styles.statLabel}>CRITICAL EMERGENCIES</span>
          <div style={styles.statValueRow}>
            <span style={{ ...styles.statVal, color: '#ff3860' }}>{criticalMissions.length}</span>
            <span style={styles.statTotal}>URGENT DISPATCH</span>
          </div>
        </div>

        <div className="hud-panel" style={styles.statCard}>
          <span style={styles.statLabel}>HEROES DEPLOYED</span>
          <div style={styles.statValueRow}>
            <span style={{ ...styles.statVal, color: '#ffd54f' }}>{onMissionHeroes.length}</span>
            <span style={styles.statTotal}>IN COMBAT / RESCUE</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Incidents & Active Missions */}
      <div style={styles.contentGrid}>
        {/* Left Column: Incidents Needing Dispatch */}
        <div className="hud-panel" style={{ flex: 1 }}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>🚨 INCOMING INCIDENT RADAR</h2>
            <button className="hud-btn hud-btn-primary" onClick={() => onNavigateToDispatch()}>
              AI AUTO-DISPATCH
            </button>
          </div>

          <div style={styles.list}>
            {incidents.map((inc) => (
              <div key={inc.id} style={styles.incidentRow}>
                <div style={styles.incidentInfo}>
                  <div style={styles.incidentTitleRow}>
                    <span
                      className={`badge ${
                        inc.severity === 'critical'
                          ? 'badge-critical'
                          : inc.severity === 'high'
                          ? 'badge-high'
                          : 'badge-cyan'
                      }`}>
                      {inc.severity}
                    </span>
                    <span style={styles.incidentTitle}>{inc.title}</span>
                  </div>
                  <p style={styles.incidentDesc}>{inc.description}</p>
                  <span style={styles.incidentLoc}>📍 {inc.location?.label || 'Sector Unspecified'}</span>
                </div>
                <button
                  className="hud-btn"
                  onClick={() => onNavigateToDispatch(inc.id)}>
                  DISPATCH ⚡
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Hero Network Status */}
        <div className="hud-panel" style={{ width: '380px' }}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>🛡️ HERO READINESS</h2>
            <button className="hud-btn" onClick={onNavigateToChat}>
              ASK MCP AI 🤖
            </button>
          </div>

          <div style={styles.heroList}>
            {heroes.map((hero) => (
              <div key={hero.id} style={styles.heroRow}>
                <div
                  style={{
                    ...styles.avatar,
                    borderColor: hero.brandColor,
                    backgroundColor: `${hero.brandColor}20`,
                    color: hero.brandColor,
                  }}>
                  {hero.codename.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.heroName}>{hero.codename}</div>
                  <div style={styles.heroPowers}>{hero.powers.slice(0, 2).join(' • ')}</div>
                </div>
                <span
                  className={`badge ${
                    hero.status === 'online'
                      ? 'badge-online'
                      : hero.status === 'on_mission'
                      ? 'badge-high'
                      : 'badge-cyan'
                  }`}>
                  {hero.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#8493b2',
    letterSpacing: '1px',
  },
  statValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  statVal: {
    fontSize: '32px',
    fontWeight: 900,
    fontFamily: "'JetBrains Mono', monospace",
  },
  statTotal: {
    fontSize: '11px',
    color: '#4d5c80',
    fontWeight: 700,
  },
  contentGrid: {
    display: 'flex',
    gap: '24px',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  panelTitle: {
    fontSize: '14px',
    fontWeight: 900,
    letterSpacing: '1px',
    color: '#f0f4fc',
    margin: 0,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  incidentRow: {
    backgroundColor: '#131b31',
    border: '1px solid #1e2b4d',
    borderRadius: '6px',
    padding: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  incidentInfo: {
    flex: 1,
  },
  incidentTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px',
  },
  incidentTitle: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#f0f4fc',
  },
  incidentDesc: {
    fontSize: '12px',
    color: '#8493b2',
    margin: '0 0 6px 0',
  },
  incidentLoc: {
    fontSize: '11px',
    color: '#00d4ff',
    fontWeight: 600,
  },
  heroList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  heroRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px',
    backgroundColor: '#131b31',
    border: '1px solid #1e2b4d',
    borderRadius: '6px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    fontSize: '12px',
  },
  heroName: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#f0f4fc',
  },
  heroPowers: {
    fontSize: '11px',
    color: '#8493b2',
  },
};
