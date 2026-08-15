import React, { useState } from 'react';
import type { Hero, Mission, Priority } from '../types';

interface CreateMissionModalProps {
  heroes: Hero[];
  isOpen: boolean;
  onClose: () => void;
  onDispatch: (mission: Mission) => void;
}

export const CreateMissionModal: React.FC<CreateMissionModalProps> = ({
  heroes,
  isOpen,
  onClose,
  onDispatch,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('critical');
  const [locationLabel, setLocationLabel] = useState('Calicut Sector 1');
  const [assignedHeroId, setAssignedHeroId] = useState<string>('');
  const [requiredPowersStr, setRequiredPowersStr] = useState('Super Strength, Rescue');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

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

    onDispatch(newMission);
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <h2 style={styles.title}>DISPATCH TACTICAL MISSION</h2>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>MISSION TITLE</label>
            <input
              type="text"
              placeholder="e.g. Harbor Structural Collapse Emergency"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
              required
              autoFocus
            />
          </div>

          <div style={styles.grid2}>
            <div style={styles.fieldGroup}>
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

            <div style={styles.fieldGroup}>
              <label style={styles.label}>ASSIGN HERO / OPERATIVE</label>
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
          </div>

          <div style={styles.grid2}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>SECTOR / LOCATION</label>
              <input
                type="text"
                placeholder="e.g. Calicut Harbor Terminal 4"
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>REQUIRED ABILITIES</label>
              <input
                type="text"
                placeholder="e.g. Flight, Armor Diagnostics"
                value={requiredPowersStr}
                onChange={(e) => setRequiredPowersStr(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>TACTICAL BRIEFING</label>
            <textarea
              rows={3}
              placeholder="Incident parameters, perimeter safety instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...styles.input, resize: 'vertical' }}
            />
          </div>

          <div style={styles.footer}>
            <button type="button" className="hud-btn" onClick={onClose}>
              CANCEL
            </button>
            <button type="submit" className="hud-btn hud-btn-critical">
              ⚡ TRANSMIT MISSION TO WRISTBAND
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 7, 15, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#0a0e1c',
    border: '2px solid #ff3860',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '560px',
    boxShadow: '0 0 40px rgba(255, 56, 96, 0.3)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #1e2b4d',
    backgroundColor: '#131b31',
  },
  title: {
    fontSize: '15px',
    fontWeight: 900,
    letterSpacing: '1px',
    color: '#ff3860',
    margin: 0,
  },
  closeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#8493b2',
    fontSize: '18px',
    cursor: 'pointer',
  },
  form: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  label: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#00d4ff',
    letterSpacing: '0.8px',
  },
  input: {
    backgroundColor: '#131b31',
    border: '1px solid #1e2b4d',
    color: '#f0f4fc',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px',
  },
};
