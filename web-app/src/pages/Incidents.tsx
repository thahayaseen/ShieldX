import React, { useState } from 'react';
import type { Incident, IncidentSeverity } from '../types';

interface IncidentsProps {
  incidents: Incident[];
  onReportIncident: (incident: Partial<Incident>) => void;
}

export const Incidents: React.FC<IncidentsProps> = ({ incidents, onReportIncident }) => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('critical');
  const [locationLabel, setLocationLabel] = useState('Calicut Sector 1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    onReportIncident({
      title,
      description,
      severity,
      location: { lat: 11.2588, lng: 75.7804, label: locationLabel },
      status: 'reported',
    });
    setTitle('');
    setDescription('');
    setShowForm(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>EMERGENCY INCIDENT LOG</h1>
          <p style={styles.subtitle}>CIVILIAN DISTRESS SIGNALS & SENSOR FEEDS</p>
        </div>
        <button
          className="hud-btn hud-btn-critical"
          onClick={() => setShowForm(!showForm)}>
          {showForm ? 'CANCEL' : '🚨 REPORT NEW INCIDENT'}
        </button>
      </div>

      {showForm && (
        <form className="hud-panel" onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>REPORT EMERGENCY INCIDENT</h3>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>INCIDENT TITLE</label>
              <input
                type="text"
                placeholder="e.g. Seismic tremor at Calicut Metro"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>SEVERITY LEVEL</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                style={styles.input}>
                <option value="critical">CRITICAL (Tier 1)</option>
                <option value="high">HIGH (Tier 2)</option>
                <option value="medium">MEDIUM (Tier 3)</option>
                <option value="low">LOW (Tier 4)</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>LOCATION / SECTOR</label>
              <input
                type="text"
                placeholder="e.g. Calicut Beach Promenade"
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={{ ...styles.formGroup, gridColumn: 'span 3' }}>
              <label style={styles.label}>DESCRIPTION & SENSOR TELEMETRY</label>
              <textarea
                rows={3}
                placeholder="Incident details, civilian count, structural hazards..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ ...styles.input, resize: 'vertical' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="hud-btn"
              onClick={() => setShowForm(false)}>
              CANCEL
            </button>
            <button type="submit" className="hud-btn hud-btn-critical">
              TRANSMIT INCIDENT TO A.E.G.I.S. 🚨
            </button>
          </div>
        </form>
      )}

      {/* Incident List */}
      <div style={styles.incidentList}>
        {incidents.map((inc) => (
          <div key={inc.id} className="hud-panel" style={styles.incidentCard}>
            <div style={styles.incidentTop}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                <h3 style={styles.incCardTitle}>{inc.title}</h3>
              </div>
              <span style={styles.timeTag}>
                {new Date(inc.createdAt || Date.now()).toLocaleTimeString()}
              </span>
            </div>

            <p style={styles.incDesc}>{inc.description}</p>

            <div style={styles.incFooter}>
              <span style={styles.locText}>📍 {inc.location.label}</span>
              <span
                className={`badge ${
                  inc.status === 'dispatched'
                    ? 'badge-online'
                    : inc.status === 'resolved'
                    ? 'badge-cyan'
                    : 'badge-high'
                }`}>
                {inc.status.toUpperCase()}
              </span>
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    border: '1px solid rgba(255, 56, 96, 0.4)',
  },
  formTitle: {
    fontSize: '14px',
    fontWeight: 900,
    color: '#ff3860',
    margin: 0,
    letterSpacing: '1px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
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
    backgroundColor: '#060810',
    border: '1px solid #1e2b4d',
    borderRadius: '4px',
    padding: '8px 12px',
    color: '#f0f4fc',
    fontSize: '12px',
    fontFamily: 'inherit',
  },
  incidentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  incidentCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  incidentTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incCardTitle: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#f0f4fc',
    margin: 0,
  },
  timeTag: {
    fontSize: '11px',
    color: '#4d5c80',
    fontWeight: 700,
  },
  incDesc: {
    fontSize: '13px',
    color: '#8493b2',
    margin: 0,
    lineHeight: '18px',
  },
  incFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px',
    borderTop: '1px solid #1e2b4d',
  },
  locText: {
    fontSize: '12px',
    color: '#00d4ff',
    fontWeight: 600,
  },
};
