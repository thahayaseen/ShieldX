import React from 'react';

export type PageId = 'overview' | 'missions' | 'heroes' | 'incidents' | 'dispatch' | 'chat';

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  activeMissionCount: number;
  onlineHeroCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  activeMissionCount,
  onlineHeroCount,
}) => {
  const navItems: { id: PageId; label: string; icon: string; badge?: number }[] = [
    { id: 'overview', label: 'OPERATIONS HUB', icon: '⚡' },
    { id: 'missions', label: 'TACTICAL BOARD', icon: '🎯', badge: activeMissionCount },
    { id: 'heroes', label: 'HERO ROSTER', icon: '🛡️', badge: onlineHeroCount },
    { id: 'incidents', label: 'INCIDENT LOG', icon: '🚨' },
    { id: 'dispatch', label: 'AI DISPATCH CENTER', icon: '🧠' },
    { id: 'chat', label: 'MCP AI AGENT COMMS', icon: '🤖' },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandContainer}>
        <div style={styles.brandLogo}>🛡️</div>
        <div>
          <h1 style={styles.brandTitle}>A.E.G.I.S.</h1>
          <p style={styles.brandSub}>GUARDIAN COMMAND</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={styles.nav}>
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                ...styles.navButton,
                ...(isActive ? styles.navButtonActive : {}),
              }}>
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  style={{
                    ...styles.navBadge,
                    ...(isActive ? styles.navBadgeActive : {}),
                  }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Telemetry Footer */}
      <div style={styles.footer}>
        <div style={styles.telemetryRow}>
          <span style={styles.telemetryDot} />
          <span style={styles.telemetryText}>NET PROTOCOL: MCP v1.0</span>
        </div>
        <p style={styles.telemetrySub}>HARDWARE LINK: ESP32 SYNCED</p>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '260px',
    backgroundColor: '#0a0e1c',
    borderRight: '1px solid #1e2b4d',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  brandContainer: {
    padding: '24px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #1e2b4d',
  },
  brandLogo: {
    fontSize: '28px',
  },
  brandTitle: {
    fontSize: '20px',
    fontWeight: 900,
    letterSpacing: '2px',
    color: '#00d4ff',
    margin: 0,
    textShadow: '0 0 10px rgba(0,212,255,0.4)',
  },
  brandSub: {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '1px',
    color: '#8493b2',
    margin: 0,
  },
  nav: {
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    borderRadius: '6px',
    color: '#8493b2',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.8px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    width: '100%',
  },
  navButtonActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
    borderColor: 'rgba(0, 212, 255, 0.4)',
    color: '#00d4ff',
    boxShadow: '0 0 15px rgba(0, 212, 255, 0.1)',
  },
  navIcon: {
    fontSize: '16px',
  },
  navLabel: {
    flex: 1,
  },
  navBadge: {
    backgroundColor: '#131b31',
    color: '#8493b2',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: 800,
  },
  navBadgeActive: {
    backgroundColor: '#00d4ff',
    color: '#060810',
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid #1e2b4d',
    backgroundColor: '#060810',
  },
  telemetryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '4px',
  },
  telemetryDot: {
    width: '6px',
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#00e676',
    boxShadow: '0 0 6px #00e676',
  },
  telemetryText: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#00e676',
    letterSpacing: '0.5px',
  },
  telemetrySub: {
    fontSize: '9px',
    color: '#4d5c80',
    fontWeight: 700,
    margin: 0,
  },
};
