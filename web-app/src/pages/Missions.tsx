import React from 'react';
import type { Mission, MissionStatus } from '../types';

interface MissionsProps {
  missions: Mission[];
  onUpdateStatus: (missionId: string, status: MissionStatus) => void;
}

export const Missions: React.FC<MissionsProps> = ({ missions, onUpdateStatus }) => {
  const columns: { id: MissionStatus; title: string; color: string }[] = [
    { id: 'pending', title: 'DISPATCH PENDING', color: '#ff3860' },
    { id: 'accepted', title: 'ACCEPTED // PREP', color: '#ffd54f' },
    { id: 'en_route', title: 'EN ROUTE / IN ACTION', color: '#00d4ff' },
    { id: 'complete', title: 'RESOLVED / DEBRIEF', color: '#00e676' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>TACTICAL MISSION KANBAN</h1>
          <p style={styles.subtitle}>REAL-TIME MISSION LIFECYCLE TRACKING</p>
        </div>
      </div>

      <div style={styles.kanbanGrid}>
        {columns.map((col) => {
          const colMissions = missions.filter((m) => {
            if (col.id === 'pending') return m.status === 'pending' || m.status === 'dispatched';
            if (col.id === 'accepted') return m.status === 'accepted';
            if (col.id === 'en_route') return m.status === 'en_route' || m.status === 'arrived';
            if (col.id === 'complete') return m.status === 'complete' || (m.status as any) === 'completed';
            return m.status === col.id;
          });
          return (
            <div key={col.id} className="hud-panel" style={styles.kanbanCol}>
              <div style={{ ...styles.colHeader, borderBottomColor: col.color }}>
                <span style={{ ...styles.colTitle, color: col.color }}>{col.title}</span>
                <span style={styles.colCount}>{colMissions.length}</span>
              </div>

              <div style={styles.cardList}>
                {colMissions.map((m) => (
                  <div key={m.id} style={styles.card}>
                    <div style={styles.cardTop}>
                      <span
                        className={`badge ${
                          m.priority === 'critical'
                            ? 'badge-critical'
                            : m.priority === 'high'
                            ? 'badge-high'
                            : 'badge-cyan'
                        }`}>
                        {m.priority}
                      </span>
                      <span style={styles.locTag}>📍 {m.location.label || 'Sector'}</span>
                    </div>

                    <h4 style={styles.cardTitle}>{m.title}</h4>
                    {m.description && <p style={styles.cardDesc}>{m.description}</p>}

                    {m.assignedHero && (
                      <div style={styles.assignedHeroRow}>
                        <span style={styles.assignedLabel}>OPERATIVE:</span>
                        <span style={styles.assignedHeroName}>⚡ {m.assignedHero.codename}</span>
                      </div>
                    )}

                    {/* Quick status transition buttons */}
                    <div style={styles.actionRow}>
                      {col.id === 'pending' && (
                        <button
                          className="hud-btn hud-btn-primary"
                          style={{ width: '100%', fontSize: '11px' }}
                          onClick={() => onUpdateStatus(m.id, 'accepted')}>
                          ACCEPT MISSION ⚡
                        </button>
                      )}

                      {col.id === 'accepted' && (
                        <button
                          className="hud-btn"
                          style={{ width: '100%', fontSize: '11px', borderColor: '#ffd54f', color: '#ffd54f' }}
                          onClick={() => onUpdateStatus(m.id, 'en_route')}>
                          DEPLOY EN ROUTE 🚀
                        </button>
                      )}

                      {col.id === 'en_route' && (
                        <button
                          className="hud-btn"
                          style={{ width: '100%', fontSize: '11px', borderColor: '#00e676', color: '#00e676' }}
                          onClick={() => onUpdateStatus(m.id, 'complete')}>
                          MARK COMPLETE ✅
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    height: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
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
  kanbanGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    flex: 1,
    overflowX: 'auto',
  },
  kanbanCol: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0a0e1c',
    border: '1px solid #1e2b4d',
    padding: '16px',
    minWidth: '260px',
  },
  colHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '12px',
    borderBottom: '2px solid',
    marginBottom: '14px',
  },
  colTitle: {
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '0.8px',
  },
  colCount: {
    fontSize: '11px',
    fontWeight: 800,
    backgroundColor: '#131b31',
    padding: '2px 8px',
    borderRadius: '10px',
    color: '#8493b2',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
  },
  card: {
    backgroundColor: '#131b31',
    border: '1px solid #1e2b4d',
    borderRadius: '6px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locTag: {
    fontSize: '10px',
    color: '#00d4ff',
    fontWeight: 600,
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#f0f4fc',
    margin: 0,
  },
  cardDesc: {
    fontSize: '12px',
    color: '#8493b2',
    margin: 0,
    lineHeight: '16px',
  },
  assignedHeroRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px',
  },
  assignedLabel: {
    fontSize: '9px',
    fontWeight: 800,
    color: '#4d5c80',
  },
  assignedHeroName: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#ffd54f',
  },
  actionRow: {
    marginTop: '6px',
  },
};
