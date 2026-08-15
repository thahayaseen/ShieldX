import React, { useState } from 'react';
import type { Incident, Hero, Mission } from '../types';

interface AiDispatchProps {
  incidents: Incident[];
  heroes: Hero[];
  onDispatchMission: (mission: Mission) => void;
}

export const AiDispatch: React.FC<AiDispatchProps> = ({
  incidents,
  heroes,
  onDispatchMission,
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    incidents[0]?.id || ''
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{
    recommendedHero: Hero;
    threatLevel: string;
    requiredPowers: string[];
    reasoning: string;
    confidence: number;
  } | null>(null);

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId);

  const handleRunAiAnalysis = () => {
    if (!selectedIncident) return;
    setAnalyzing(true);

    setTimeout(() => {
      // AI Recommendation Algorithm matching Incident to Superpowers
      let matchedHero = heroes.find((h) => h.codename === 'Hulk') || heroes[0];
      let powers = ['Strength', 'Rescue', 'Durability'];
      let reason =
        'Building collapse requires extreme structural load-bearing capacity and rubble lifting. Hulk possesses the requisite strength metrics with 98% survival probability for trapped victims.';

      if (selectedIncident.title.toLowerCase().includes('energy') || selectedIncident.title.toLowerCase().includes('harbor')) {
        matchedHero = heroes.find((h) => h.codename === 'Thor') || heroes[1];
        powers = ['Energy Absorption', 'Lightning Containment', 'Flight'];
        reason =
          'Energy surge anomalies near Beypore harbor pose secondary explosion hazards. Thor can absorb high-voltage discharges and isolate power feeds safely.';
      } else if (selectedIncident.title.toLowerCase().includes('chemical') || selectedIncident.title.toLowerCase().includes('tech')) {
        matchedHero = heroes.find((h) => h.codename === 'Iron Man') || heroes[2];
        powers = ['Armor Containment', 'Flight', 'Environmental Sensors'];
        reason =
          'Hazardous spill requires rapid atmospheric dispersal analysis and drone-assisted containment barricades. Iron Man suit diagnostics recommended.';
      }

      setDispatchResult({
        recommendedHero: matchedHero,
        threatLevel: selectedIncident.severity.toUpperCase(),
        requiredPowers: powers,
        reasoning: reason,
        confidence: 0.96,
      });
      setAnalyzing(false);
    }, 1200);
  };

  const [dispatchedIncidentIds, setDispatchedIncidentIds] = useState<Set<string>>(new Set());

  const isCurrentIncidentDispatched =
    Boolean(selectedIncident) &&
    (dispatchedIncidentIds.has(selectedIncident!.id) || selectedIncident?.status === 'dispatched');

  const handleConfirmDispatch = () => {
    if (!selectedIncident || !dispatchResult || isCurrentIncidentDispatched) return;

    const newMission: Mission = {
      id: `m-${Date.now()}`,
      title: `MISSION: ${selectedIncident.title.toUpperCase()}`,
      description: selectedIncident.description,
      priority: selectedIncident.severity as Mission['priority'],
      status: 'pending',
      location: selectedIncident.location,
      requiredPowers: dispatchResult.requiredPowers,
      assignedHeroId: dispatchResult.recommendedHero.id,
      assignedHero: dispatchResult.recommendedHero,
      incidentId: selectedIncident.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onDispatchMission(newMission);
    setDispatchedIncidentIds((prev) => new Set(prev).add(selectedIncident.id));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>AI DISPATCH & THREAT ANALYZER</h1>
          <p style={styles.subtitle}>GEMINI-POWERED HERO SELECTION & EMERGENCY MATCHMAKING</p>
        </div>
      </div>

      <div style={styles.layoutGrid}>
        {/* Left Column: Select Incident */}
        <div className="hud-panel" style={{ flex: 1 }}>
          <h3 style={styles.panelTitle}>1. SELECT EMERGENCY INCIDENT</h3>
          <div style={styles.incidentSelector}>
            {incidents.map((inc) => (
              <div
                key={inc.id}
                onClick={() => {
                  setSelectedIncidentId(inc.id);
                  setDispatchResult(null);
                }}
                style={{
                  ...styles.incidentItem,
                  ...(selectedIncidentId === inc.id ? styles.incidentItemActive : {}),
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={styles.incidentItemTitle}>{inc.title}</span>
                  <span className="badge badge-critical">{inc.severity}</span>
                </div>
                <p style={styles.incidentItemDesc}>{inc.description}</p>
              </div>
            ))}
          </div>

          <button
            className="hud-btn hud-btn-primary"
            style={{ width: '100%', marginTop: '16px', padding: '12px' }}
            disabled={analyzing}
            onClick={handleRunAiAnalysis}>
            {analyzing ? '🧠 A.E.G.I.S. NEURAL NET PROCESSING...' : '⚡ RUN GEMINI THREAT ANALYSIS'}
          </button>
        </div>

        {/* Right Column: AI Analysis & Hero Recommendation */}
        <div className="hud-panel" style={{ flex: 1 }}>
          <h3 style={styles.panelTitle}>2. AI DISPATCH RECOMMENDATION</h3>

          {dispatchResult ? (
            <div style={styles.resultContainer}>
              <div style={styles.recommendHeader}>
                <div
                  style={{
                    ...styles.avatar,
                    borderColor: dispatchResult.recommendedHero.brandColor,
                    backgroundColor: `${dispatchResult.recommendedHero.brandColor}20`,
                    color: dispatchResult.recommendedHero.brandColor,
                  }}>
                  {dispatchResult.recommendedHero.codename.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={styles.recLabel}>OPTIMAL HERO CANDIDATE:</span>
                  <h2 style={styles.recHeroName}>{dispatchResult.recommendedHero.codename}</h2>
                  <span style={styles.recRealName}>{dispatchResult.recommendedHero.name}</span>
                </div>
                <div style={styles.confidencePill}>
                  <span style={styles.confLabel}>CONFIDENCE</span>
                  <span style={styles.confVal}>{Math.round(dispatchResult.confidence * 100)}%</span>
                </div>
              </div>

              <div style={styles.reasoningBox}>
                <span style={styles.sectionLabel}>AI LOGICAL REASONING:</span>
                <p style={styles.reasoningText}>{dispatchResult.reasoning}</p>
              </div>

              <div style={styles.powersNeeded}>
                <span style={styles.sectionLabel}>REQUIRED ABILITIES:</span>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  {dispatchResult.requiredPowers.map((p, idx) => (
                    <span key={idx} className="tag">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {isCurrentIncidentDispatched ? (
                <div
                  style={{
                    width: '100%',
                    padding: '14px',
                    marginTop: '16px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0, 230, 118, 0.15)',
                    border: '1px solid #00e676',
                    color: '#00e676',
                    textAlign: 'center',
                    fontWeight: 900,
                    fontSize: '12px',
                    letterSpacing: '0.8px',
                    boxShadow: '0 0 15px rgba(0, 230, 118, 0.2)',
                  }}>
                  ✓ DISPATCH TRANSMITTED TO {dispatchResult.recommendedHero.codename.toUpperCase()} — EN ROUTE IN ROSTER
                </div>
              ) : (
                <button
                  className="hud-btn hud-btn-critical"
                  style={{ width: '100%', padding: '14px', marginTop: '16px', fontSize: '13px' }}
                  onClick={handleConfirmDispatch}>
                  ⚡ DISPATCH TO {dispatchResult.recommendedHero.codename.toUpperCase()} (TRANSMIT TO ESP32)
                </button>
              )}
            </div>
          ) : (
            <div style={styles.standbyView}>
              <span style={{ fontSize: '32px' }}>🧠</span>
              <p style={styles.standbyText}>
                Select an emergency incident and run Gemini analysis to compute optimal hero power assignments.
              </p>
            </div>
          )}
        </div>
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
  layoutGrid: {
    display: 'flex',
    gap: '24px',
  },
  panelTitle: {
    fontSize: '13px',
    fontWeight: 900,
    color: '#f0f4fc',
    letterSpacing: '0.8px',
    marginBottom: '16px',
  },
  incidentSelector: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  incidentItem: {
    backgroundColor: '#131b31',
    border: '1px solid #1e2b4d',
    borderRadius: '6px',
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  incidentItemActive: {
    borderColor: '#00d4ff',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    boxShadow: '0 0 10px rgba(0, 212, 255, 0.15)',
  },
  incidentItemTitle: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#f0f4fc',
  },
  incidentItemDesc: {
    fontSize: '11px',
    color: '#8493b2',
    margin: '4px 0 0 0',
  },
  resultContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  recommendHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    backgroundColor: '#131b31',
    padding: '14px',
    borderRadius: '6px',
    border: '1px solid #1e2b4d',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '24px',
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    fontSize: '16px',
  },
  recLabel: {
    fontSize: '9px',
    fontWeight: 800,
    color: '#00d4ff',
  },
  recHeroName: {
    fontSize: '18px',
    fontWeight: 900,
    color: '#f0f4fc',
    margin: '2px 0',
  },
  recRealName: {
    fontSize: '11px',
    color: '#8493b2',
  },
  confidencePill: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    border: '1px solid rgba(0, 230, 118, 0.4)',
    padding: '6px 10px',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  confLabel: {
    fontSize: '8px',
    fontWeight: 800,
    color: '#00e676',
  },
  confVal: {
    fontSize: '14px',
    fontWeight: 900,
    color: '#00e676',
  },
  reasoningBox: {
    backgroundColor: '#131b31',
    border: '1px solid #1e2b4d',
    padding: '12px',
    borderRadius: '6px',
  },
  sectionLabel: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#8493b2',
    letterSpacing: '0.5px',
  },
  reasoningText: {
    fontSize: '12px',
    color: '#f0f4fc',
    lineHeight: '18px',
    margin: '6px 0 0 0',
  },
  powersNeeded: {
    backgroundColor: '#131b31',
    border: '1px solid #1e2b4d',
    padding: '12px',
    borderRadius: '6px',
  },
  standbyView: {
    height: '240px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    textAlign: 'center',
    padding: '20px',
  },
  standbyText: {
    fontSize: '12px',
    color: '#8493b2',
    maxWidth: '300px',
    lineHeight: '18px',
  },
};
