import React from 'react';
import type { Hero, HeroStatus } from '../types';

interface HeroesProps {
  heroes: Hero[];
  onUpdateStatus: (heroId: string, status: HeroStatus) => void;
}

export const Heroes: React.FC<HeroesProps> = ({ heroes, onUpdateStatus }) => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>HERO REGISTRY & TELEMETRY</h1>
          <p style={styles.subtitle}>ACTIVE GUARDIAN NETWORK // AVENGERS & S.H.I.E.L.D. PROTOCOL</p>
        </div>
      </div>

      <div style={styles.grid}>
        {heroes.map((hero) => (
          <div key={hero.id} className="hud-panel" style={styles.card}>
            <div style={styles.cardHeader}>
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
                <h3 style={styles.heroCodename}>{hero.codename}</h3>
                <p style={styles.heroRealName}>{hero.name}</p>
              </div>
              <span
                className={`badge ${
                  hero.status === 'online'
                    ? 'badge-online'
                    : hero.status === 'on_mission'
                    ? 'badge-high'
                    : hero.status === 'busy'
                    ? 'badge-critical'
                    : 'badge-cyan'
                }`}>
                {hero.status.replace('_', ' ')}
              </span>
            </div>

            <div style={styles.section}>
              <span style={styles.label}>SUPERPOWERS & CAPABILITIES:</span>
              <div style={styles.powersRow}>
                {hero.powers.map((p, idx) => (
                  <span key={idx} className="tag">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div style={styles.section}>
              <span style={styles.label}>CURRENT DEPLOYMENT SECTOR:</span>
              <p style={styles.location}>📍 {hero.location?.label || 'Standby in HQ'}</p>
            </div>

            <div style={styles.statusActionRow}>
              <span style={styles.label}>OVERRIDE STATUS:</span>
              <div style={styles.btnGroup}>
                {(['online', 'busy', 'offline'] as HeroStatus[]).map((st) => (
                  <button
                    key={st}
                    className={`hud-btn ${hero.status === st ? 'hud-btn-primary' : ''}`}
                    style={{ flex: 1, padding: '6px 8px', fontSize: '10px' }}
                    onClick={() => onUpdateStatus(hero.id, st)}>
                    {st.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '18px',
    fontWeight: 900,
    letterSpacing: '1px',
    color: '#00d4ff',
    margin: 0,
  },
  subtitle: {
    fontSize: '11px',
    color: '#8493b2',
    letterSpacing: '0.8px',
    margin: '4px 0 0 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '22px',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    fontSize: '14px',
    boxShadow: '0 0 10px rgba(0,0,0,0.5)',
  },
  heroCodename: {
    fontSize: '16px',
    fontWeight: 900,
    color: '#f0f4fc',
    margin: 0,
  },
  heroRealName: {
    fontSize: '12px',
    color: '#8493b2',
    margin: 0,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#4d5c80',
    letterSpacing: '0.5px',
  },
  powersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  location: {
    fontSize: '12px',
    color: '#00d4ff',
    fontWeight: 600,
    margin: 0,
  },
  statusActionRow: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    paddingTop: '10px',
    borderTop: '1px solid #1e2b4d',
  },
  btnGroup: {
    display: 'flex',
    gap: '6px',
  },
};
