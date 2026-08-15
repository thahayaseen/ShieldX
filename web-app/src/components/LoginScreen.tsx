import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { loginWithPassword, isLoading, authError, clearAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    await loginWithPassword(email.trim(), password);
  };

  return (
    <div style={styles.container}>
      {/* CRT Scanline Overlay */}
      <div style={styles.scanlineOverlay} />

      {/* ACCESS DENIED CARD */}
      {authError ? (
        <div style={styles.deniedCard}>
          <div style={styles.deniedHeader}>
            <div style={styles.deniedIconRing}>
              <span style={{ fontSize: '26px' }}>🚫</span>
            </div>
            <div>
              <h2 style={styles.deniedTitle}>{authError.title}</h2>
              <span style={styles.deniedTag}>SECURITY PROTOCOL // 403 FORBIDDEN</span>
            </div>
          </div>
          <p style={styles.deniedMsg}>{authError.message}</p>
          <div style={styles.deniedActions}>
            <button style={styles.retryBtn} onClick={clearAuthError}>
              🔑 TRY AGAIN
            </button>
          </div>
        </div>
      ) : (
        /* LOGIN FORM CARD */
        <div style={styles.card}>
          {/* Logo */}
          <div style={styles.logoRing}>
            <span style={{ fontSize: '34px' }}>🛡️</span>
          </div>

          <h1 style={styles.title}>A.E.G.I.S.</h1>
          <p style={styles.subtitle}>COMMAND CENTER // RESTRICTED ACCESS</p>
          <div style={styles.badge}>CLASSIFIED // LEVEL 10 DIRECTOR ACCESS ONLY</div>

          {/* Login Form */}
          <form style={styles.form} onSubmit={handleLogin}>
            {/* Email field */}
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="commander-email">
                COMMANDER EMAIL ADDRESS
              </label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>📧</span>
                <input
                  id="commander-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="commander@aegis.shield.org"
                  style={styles.input}
                  autoComplete="username"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password field */}
            <div style={styles.fieldGroup}>
              <label style={styles.label} htmlFor="commander-pass">
                SECURITY PASSPHRASE
              </label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔑</span>
                <input
                  id="commander-pass"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter classified passphrase"
                  style={{ ...styles.input, paddingRight: '44px' }}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  style={styles.eyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}>
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={isLoading || !email || !password ? { ...styles.submitBtn, ...styles.submitBtnDisabled } : styles.submitBtn}
              disabled={isLoading || !email.trim() || !password.trim()}>
              {isLoading ? (
                <>
                  <span style={styles.spinner} />
                  AUTHENTICATING...
                </>
              ) : (
                <>🛡️ AUTHENTICATE COMMANDER</>
              )}
            </button>
          </form>

          <div style={styles.footer}>
            <span>SUPABASE AUTH 2.0</span>
            <span>•</span>
            <span>A.E.G.I.S. NET-OPS v4.1</span>
          </div>
        </div>
      )}
    </div>
  );
};

const INPUT_BG = '#0a0e1c';
const BORDER = '#1e2b4d';
const ACCENT = '#00d4ff';

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#05070f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', sans-serif",
  },
  scanlineOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
    backgroundSize: '100% 3px, 6px 100%',
    pointerEvents: 'none',
    zIndex: 1,
  },
  card: {
    position: 'relative',
    zIndex: 2,
    width: '90%',
    maxWidth: '440px',
    backgroundColor: '#0d1222',
    border: `1px solid ${BORDER}`,
    borderRadius: '16px',
    padding: '36px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: `0 20px 50px rgba(0, 212, 255, 0.08), 0 0 30px rgba(0, 0, 0, 0.8)`,
  },
  logoRing: {
    width: '72px',
    height: '72px',
    borderRadius: '36px',
    backgroundColor: 'rgba(79, 195, 247, 0.08)',
    border: `2px solid ${ACCENT}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    boxShadow: `0 0 20px rgba(0, 212, 255, 0.3)`,
  },
  title: {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: 900,
    letterSpacing: '4px',
    margin: 0,
    textAlign: 'center',
  },
  subtitle: {
    color: ACCENT,
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '1.5px',
    marginTop: '6px',
    marginBottom: '12px',
  },
  badge: {
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    border: '1px solid rgba(255, 179, 0, 0.35)',
    color: '#ffb300',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '1px',
    padding: '4px 12px',
    borderRadius: '20px',
    marginBottom: '28px',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: '#4d5c80',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '1px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    fontSize: '15px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    backgroundColor: INPUT_BG,
    border: `1px solid ${BORDER}`,
    borderRadius: '8px',
    color: '#f0f4fc',
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    padding: '12px 12px 12px 38px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  eyeBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
    color: '#4d5c80',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: ACCENT,
    color: '#05070f',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 20px',
    fontSize: '13px',
    fontWeight: 900,
    letterSpacing: '1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    marginTop: '4px',
    boxShadow: `0 4px 16px rgba(0, 212, 255, 0.35)`,
    transition: 'all 0.2s ease',
  },
  submitBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  spinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '2px solid #05070f',
    borderTopColor: 'transparent',
    animation: 'spin 0.7s linear infinite',
  },
  footer: {
    marginTop: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#4d5c80',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.8px',
  },

  // ─── ACCESS DENIED CARD ────────────────────────
  deniedCard: {
    position: 'relative',
    zIndex: 2,
    width: '90%',
    maxWidth: '460px',
    backgroundColor: '#140a12',
    border: '2px solid #ff3860',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 0 40px rgba(255, 56, 96, 0.35)',
  },
  deniedHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '16px',
    borderBottom: '1px solid rgba(255, 56, 96, 0.25)',
    paddingBottom: '14px',
  },
  deniedIconRing: {
    width: '52px',
    height: '52px',
    borderRadius: '26px',
    backgroundColor: 'rgba(255, 56, 96, 0.15)',
    border: '2px solid #ff3860',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 0 16px rgba(255, 56, 96, 0.4)',
  },
  deniedTitle: {
    color: '#ff3860',
    fontSize: '16px',
    fontWeight: 900,
    letterSpacing: '1px',
    margin: 0,
  },
  deniedTag: {
    color: '#ffb300',
    fontSize: '9px',
    fontWeight: 800,
    letterSpacing: '1.2px',
    marginTop: '3px',
    display: 'block',
  },
  deniedMsg: {
    color: '#f0f4fc',
    fontSize: '13px',
    lineHeight: '1.6',
    margin: '0 0 20px 0',
  },
  deniedActions: {
    display: 'flex',
    gap: '10px',
  },
  retryBtn: {
    flex: 1,
    backgroundColor: '#ff3860',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.8px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(255, 56, 96, 0.4)',
  },
};
