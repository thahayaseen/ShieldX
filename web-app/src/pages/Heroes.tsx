import React, { useState } from 'react';
import type { Hero, HeroStatus } from '../types';
import { updateHeroInSupabase } from '../lib/supabase';

interface HeroesProps {
  heroes: Hero[];
  onUpdateStatus?: (heroId: string, status: HeroStatus) => void;
  onRefreshHeroes?: () => void;
  onUpdateHeroLocal?: (hero: Hero) => void;
}

export const Heroes: React.FC<HeroesProps> = ({ heroes, onRefreshHeroes, onUpdateHeroLocal }) => {
  const [editingHero, setEditingHero] = useState<Hero | null>(null);
  const [codenameInput, setCodenameInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [powersInput, setPowersInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter pending approval heroes (auto-created by DB trigger on Google signup)
  const pendingHeroes = heroes.filter(
    (h) =>
      h.name === 'Unknown Hero' ||
      h.codename.startsWith('Agent_') ||
      h.codename === 'Unknown' ||
      h.codename === 'Agent_Pending'
  );

  const verifiedHeroes = heroes.filter(
    (h) =>
      h.name !== 'Unknown Hero' &&
      !h.codename.startsWith('Agent_') &&
      h.codename !== 'Unknown' &&
      h.codename !== 'Agent_Pending'
  );

  const openApproveModal = (hero: Hero) => {
    setEditingHero(hero);
    setCodenameInput(hero.codename.startsWith('Agent_') ? '' : hero.codename);
    setNameInput(hero.name === 'Unknown Hero' ? '' : hero.name);
    setPowersInput(hero.powers.join(', '));
    setLocationInput(hero.location?.label || 'Calicut Sector 4');
  };

  const handleSaveApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHero) return;

    setIsSubmitting(true);
    const powersArray = powersInput
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const updatedHeroObj: Hero = {
      ...editingHero,
      codename: codenameInput.trim() || 'Agent Operative',
      name: nameInput.trim() || 'Classified Identity',
      powers: powersArray.length > 0 ? powersArray : ['tactics', 'rescue'],
      location: {
        lat: editingHero.location?.lat ?? 11.2588,
        lng: editingHero.location?.lng ?? 75.7804,
        label: locationInput.trim() || 'Calicut Sector 4',
      },
      status: 'online',
    };

    // 1. Instantly update local state optimistically (0ms delay)
    if (onUpdateHeroLocal) {
      onUpdateHeroLocal(updatedHeroObj);
    }
    setEditingHero(null);

    // 2. Persist update in Supabase database
    await updateHeroInSupabase(editingHero.id, {
      codename: updatedHeroObj.codename,
      name: updatedHeroObj.name,
      powers: updatedHeroObj.powers,
      locationLabel: updatedHeroObj.location?.label,
      status: 'online',
    });

    setIsSubmitting(false);

    // 3. Refresh live heroes
    if (onRefreshHeroes) {
      onRefreshHeroes();
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>HERO REGISTRY & TELEMETRY</h1>
          <p style={styles.subtitle}>ACTIVE GUARDIAN NETWORK // AVENGERS & S.H.I.E.L.D. PROTOCOL</p>
        </div>
        {onRefreshHeroes && (
          <button className="hud-btn hud-btn-primary" onClick={onRefreshHeroes}>
            🔄 REFRESH TELEMETRY
          </button>
        )}
      </div>

      {/* ─── PENDING HERO APPROVALS SECTION ───────────────────── */}
      {pendingHeroes.length > 0 && (
        <div style={styles.pendingSection}>
          <div style={styles.pendingHeader}>
            <span style={styles.warningIcon}>⚠️</span>
            <div>
              <h2 style={styles.pendingTitle}>PENDING OPERATIVE VERIFICATION ({pendingHeroes.length})</h2>
              <p style={styles.pendingSub}>
                New Google accounts registered via Mobile App. Require Commander clearance & identity assignment.
              </p>
            </div>
          </div>

          <div style={styles.pendingGrid}>
            {pendingHeroes.map((hero) => (
              <div key={hero.id} style={styles.pendingCard}>
                <div style={styles.pendingCardHeader}>
                  <div style={styles.pendingAvatar}>?</div>
                  <div style={{ flex: 1 }}>
                    <span style={styles.pendingTag}>UNASSIGNED OPERATIVE</span>
                    <h3 style={styles.pendingCodename}>{hero.codename}</h3>
                    <p style={styles.pendingEmail}>{hero.name}</p>
                  </div>
                </div>

                <button
                  style={styles.approveBtn}
                  onClick={() => openApproveModal(hero)}>
                  ⚡ VERIFY & ASSIGN HERO IDENTITY
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── VERIFIED HERO REGISTRY GRID ──────────────────────── */}
      <div style={styles.grid}>
        {verifiedHeroes.map((hero) => (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={styles.label}>TELEMETRY SOURCE: HERO MOBILE APP</span>
                <button style={styles.editLinkBtn} onClick={() => openApproveModal(hero)}>
                  ✏️ EDIT GUARDIAN PROFILE
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── APPROVAL & EDIT MODAL ────────────────────────────── */}
      {editingHero && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingHero.name === 'Unknown Hero' || editingHero.codename.startsWith('Agent_')
                  ? '⚡ APPROVE OPERATIVE & ASSIGN IDENTITY'
                  : '✏️ EDIT HERO PROFILE'}
              </h2>
              <button style={styles.closeBtn} onClick={() => setEditingHero(null)}>
                ✕
              </button>
            </div>

            <form style={styles.form} onSubmit={handleSaveApproval}>
              <div style={styles.fieldGroup}>
                <label style={styles.formLabel}>HERO CODENAME (e.g. Spider-Man, Hulk, Thor)</label>
                <input
                  type="text"
                  value={codenameInput}
                  onChange={(e) => setCodenameInput(e.target.value)}
                  placeholder="e.g. Spider-Man"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.formLabel}>REAL NAME / CIVILIAN IDENTITY</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Peter Parker"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.formLabel}>SUPERPOWERS & CAPABILITIES (comma separated)</label>
                <input
                  type="text"
                  value={powersInput}
                  onChange={(e) => setPowersInput(e.target.value)}
                  placeholder="e.g. agility, web-slinging, super-strength, rescue"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.formLabel}>ASSIGNED SECTOR LOCATION</label>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g. Calicut Sector 4"
                  style={styles.input}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setEditingHero(null)}>
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="hud-btn hud-btn-primary"
                  style={{ flex: 1, padding: '12px' }}
                  disabled={isSubmitting}>
                  {isSubmitting ? 'SAVING TO SUPABASE...' : 'SAVE & GRANT CLEARANCE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
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
  pendingSection: {
    backgroundColor: '#171109',
    border: '2px solid #ffb300',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 0 25px rgba(255, 179, 0, 0.2)',
  },
  pendingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    borderBottom: '1px solid rgba(255, 179, 0, 0.3)',
    paddingBottom: '12px',
  },
  warningIcon: {
    fontSize: '24px',
  },
  pendingTitle: {
    color: '#ffb300',
    fontSize: '14px',
    fontWeight: 900,
    letterSpacing: '1px',
    margin: 0,
  },
  pendingSub: {
    color: '#8493b2',
    fontSize: '11px',
    margin: '2px 0 0 0',
  },
  pendingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  pendingCard: {
    backgroundColor: '#0d1222',
    border: '1px solid rgba(255, 179, 0, 0.4)',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  pendingCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  pendingAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    backgroundColor: 'rgba(255, 179, 0, 0.15)',
    border: '2px solid #ffb300',
    color: '#ffb300',
    fontSize: '18px',
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTag: {
    fontSize: '9px',
    fontWeight: 800,
    color: '#ffb300',
    letterSpacing: '0.8px',
  },
  pendingCodename: {
    fontSize: '14px',
    fontWeight: 900,
    color: '#ffffff',
    margin: '2px 0 0 0',
  },
  pendingEmail: {
    fontSize: '11px',
    color: '#8493b2',
    margin: 0,
  },
  approveBtn: {
    backgroundColor: '#ffb300',
    color: '#05070f',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '0.5px',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s',
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
  editLinkBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#00d4ff',
    fontSize: '10px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(5, 7, 15, 0.85)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modalCard: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#0d1222',
    border: '1px solid #00d4ff',
    borderRadius: '14px',
    padding: '24px',
    boxShadow: '0 0 40px rgba(0, 212, 255, 0.2)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #1e2b4d',
    paddingBottom: '12px',
  },
  modalTitle: {
    color: '#00d4ff',
    fontSize: '14px',
    fontWeight: 900,
    letterSpacing: '0.8px',
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
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#8493b2',
    letterSpacing: '0.5px',
  },
  input: {
    backgroundColor: '#0a0e1c',
    border: '1px solid #1e2b4d',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '10px',
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    border: '1px solid #1e2b4d',
    color: '#8493b2',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '11px',
    fontWeight: 800,
    cursor: 'pointer',
  },
};
