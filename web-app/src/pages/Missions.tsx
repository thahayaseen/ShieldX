import React, { useState } from 'react';
import type { Hero, Mission, MissionStatus, Priority } from '../types';

interface MissionsProps {
  missions: Mission[];
  heroes?: Hero[];
  onUpdateStatus: (missionId: string, status: MissionStatus) => void;
  onDispatchMission?: (mission: Mission) => void;
}

export const Missions: React.FC<MissionsProps> = ({
  missions,
  heroes = [],
  onUpdateStatus,
  onDispatchMission,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('critical');
  const [locationLabel, setLocationLabel] = useState('Calicut Sector 1');
  const [assignedHeroId, setAssignedHeroId] = useState<string>('');
  const [requiredPowersStr, setRequiredPowersStr] = useState('Tactical Response, Rescue');

  const columns: { id: MissionStatus; title: string; color: string }[] = [
    { id: 'pending', title: 'DISPATCH PENDING', color: '#ff3860' },
    { id: 'accepted', title: 'ACCEPTED // PREP', color: '#ffd54f' },
    { id: 'en_route', title: 'EN ROUTE / IN ACTION', color: '#00d4ff' },
    { id: 'complete', title: 'RESOLVED / DEBRIEF', color: '#00e676' },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !onDispatchMission) return;

    const selectedHero = heroes.find((h) => h.id === assignedHeroId) || heroes[0];

    const newMission: Mission = {
      id: `m-${Date.now()}`,
      title,
      description,
      priority,
      status: 'pending',
      location: { lat: 11.2588, lng: 75.7804, label: locationLabel },
      requiredPowers: requiredPowersStr.split(',').map((s) => s.trim()).filter(Boolean),
      assignedHeroId: selectedHero?.id,
      assignedHero: selectedHero,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onDispatchMission(newMission);
    setTitle('');
    setDescription('');
    setShowCreateForm(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>TACTICAL MISSION KANBAN</h1>
          <p style={styles.subtitle}>REAL-TIME MISSION LIFECYCLE TRACKING & DIRECT DISPATCH</p>
        </div>
        {onDispatchMission && (
          <button
            className="hud-btn hud-btn-critical"
            onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'CANCEL' : '🚨 DISPATCH NEW MISSION'}
          </button>
        )}
      </div>

      {/* Direct Mission Dispatch Form */}
      {showCreateForm && (
        <form className="hud-panel" onSubmit={handleCreateSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>⚡ CREATE & TRANSMIT TACTICAL MISSION</h3>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>MISSION TITLE</label>
              <input
                type="text"
                placeholder="e.g. Building Extraction - Sector 4"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>PRIORITY TIER</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                style={styles.input}>
                <option value="critical">CRITICAL (Tier 1)</option>
                <option value="high">HIGH (Tier 2)</option>
                <option value="medium">MEDIUM (Tier 3)</option>
                <option value="low">LOW (Tier 4)</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>ASSIGN OPERATIVE (HERO)</label>
              <select
                value={assignedHeroId}
                onChange={(e) => setAssignedHeroId(e.target.value)}
                style={styles.input}>
                <option value="">-- SELECT HERO --</option>
                {heroes.map((h) => (
                  <option key={h.id} value={h.id}>
                    ⚡ {h.codename} ({h.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>LOCATION / SECTOR</label>
              <input
                type="text"
                placeholder="e.g. Calicut Harbor Terminal 3"
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>REQUIRED ABILITIES (Comma separated)</label>
              <input
                type="text"
                placeholder="e.g. Super Strength, Flight, Heavy Lifting"
                value={requiredPowersStr}
                onChange={(e) => setRequiredPowersStr(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={{ ...styles.formGroup, gridColumn: 'span 3' }}>
              <label style={styles.label}>TACTICAL BRIEFING & INSTRUCTIONS</label>
              <textarea
                rows={3}
                placeholder="Mission details, evacuation orders, hazard warnings..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ ...styles.input, resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              className="hud-btn"
              onClick={() => setShowCreateForm(false)}>
              CANCEL
            </button>
            <button type="submit" className="hud-btn hud-btn-critical">
              ⚡ TRANSMIT MISSION TO HERO (WRISTBAND ALERT)
            </button>
          </div>
        </form>
      )}

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
  form: {
    backgroundColor: '#0a0e1c',
    border: '1px solid #ff3860',
    padding: '20px',
    borderRadius: '8px',
  },
  formTitle: {
    fontSize: '14px',
    fontWeight: 900,
    letterSpacing: '1px',
    color: '#ff3860',
    marginTop: 0,
    marginBottom: '16px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '14px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#8493b2',
    letterSpacing: '0.8px',
  },
  input: {
    backgroundColor: '#131b31',
    border: '1px solid #1e2b4d',
    color: '#f0f4fc',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '13px',
    outline: 'none',
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
