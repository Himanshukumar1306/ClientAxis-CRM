import React, { useState, useEffect } from 'react';
import { Lock, User, AlertCircle, Loader, Key, CheckCircle, ArrowLeft } from 'lucide-react';
import { api } from '../utils/api';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Custom Google chooser modal states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleAccountStep, setGoogleAccountStep] = useState(1); // 1: list accounts, 2: input email
  const [newGoogleEmail, setNewGoogleEmail] = useState('');
  const [savedGoogleAccounts, setSavedGoogleAccounts] = useState([]);

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: request, 2: verify/reset, 3: success
  const [forgotUsername, setForgotUsername] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState('');

  // Load saved Google accounts on mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('crm_google_accounts') || '[]');
    setSavedGoogleAccounts(saved);
    if (saved.length === 0) {
      setGoogleAccountStep(2); // directly show email input if no saved accounts exist
    } else {
      setGoogleAccountStep(1);
    }
  }, []);

  // Google sign in handler
  const handleGoogleSignInWithEmail = async (email) => {
    setShowGoogleModal(false);
    setError('');
    setLoading(true);
    try {
      // Create a mock Google Identity Token payload containing this email address
      const mockHeader = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
      const mockPayload = btoa(JSON.stringify({
        email: email,
        name: email.split('@')[0],
        sub: `google-${email}`
      }));
      const mockCredential = `${mockHeader}.${mockPayload}.mocksignature`;
      
      const data = await api.loginWithGoogle(mockCredential, remember);
      
      // Save email to local storage list
      const saved = JSON.parse(localStorage.getItem('crm_google_accounts') || '[]');
      if (!saved.includes(email)) {
        const newSaved = [...saved, email];
        localStorage.setItem('crm_google_accounts', JSON.stringify(newSaved));
        setSavedGoogleAccounts(newSaved);
      }
      
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSavedAccount = (e, emailToRemove) => {
    e.stopPropagation();
    const updated = savedGoogleAccounts.filter(email => email !== emailToRemove);
    localStorage.setItem('crm_google_accounts', JSON.stringify(updated));
    setSavedGoogleAccounts(updated);
    if (updated.length === 0) {
      setGoogleAccountStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await api.login(username, password, remember);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handlers
  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!forgotUsername) {
      setForgotError('Please enter your username.');
      return;
    }

    setForgotError('');
    setForgotLoading(true);
    try {
      const data = await api.forgotPassword(forgotUsername);
      setSimulatedCode(data.code || '');
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'Failed to request recovery code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!recoveryCode || !newPassword) {
      setForgotError('Please fill in all fields.');
      return;
    }

    setForgotError('');
    setForgotLoading(true);
    try {
      await api.resetPassword(forgotUsername, recoveryCode, newPassword);
      setForgotStep(3);
    } catch (err) {
      setForgotError(err.message || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotUsername('');
    setRecoveryCode('');
    setNewPassword('');
    setForgotError('');
    setSimulatedCode('');
  };

  return (
    <div className="min-height-screen flex items-center justify-center p-4" style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card p-8 animate-fade-in" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img 
            src="/logo.jpg" 
            alt="ClientAxis Logo" 
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '16px',
              objectFit: 'cover',
              border: '1px solid var(--border-light)',
              marginBottom: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          />
          <h2 style={{ fontSize: '28px', color: 'var(--color-text-primary)', margin: '0 0 6px 0', fontFamily: 'var(--font-title)', fontWeight: '700', letterSpacing: '-0.03em' }}>ClientAxis</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>Secure Admin Access</p>
        </div>

        {error && (
          <div style={{ 
            background: 'var(--color-danger-bg)', 
            border: '1px solid var(--color-danger)', 
            color: 'white', 
            borderRadius: '8px', 
            padding: '10px 12px', 
            fontSize: '14px', 
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                placeholder="Enter username (admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Password</label>
              <button 
                type="button" 
                onClick={() => setShowForgotModal(true)}
                style={{ fontSize: '12px', color: 'var(--color-primary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="password"
                placeholder="Enter password (adminpassword123)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          {/* Remember Me Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
            <label htmlFor="rememberMe" style={{ fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
              Remember me on this device
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                Authenticating...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Separator */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0 16px 0', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Or Continue With</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
        </div>

        {/* Google Sign-in */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', width: '100%' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setShowGoogleModal(true);
              if (savedGoogleAccounts.length > 0) {
                setGoogleAccountStep(1);
              } else {
                setGoogleAccountStep(2);
              }
            }}
            style={{ 
              width: '100%', 
              background: '#FFFFFF', 
              border: '1px solid #DADCE0', 
              color: '#3C4043',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '10px',
              fontWeight: '550',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FA'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707a5.416 5.416 0 0 1-.282-1.707c0-.596.102-1.174.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.579c1.32 0 2.507.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.043 0 1.651 2.279.957 5.57l3.007 2.332c.708-2.127 2.692-3.711 5.036-3.711z" fill="#EA4335"/>
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>

      {/* Google Simulated Chooser Modal */}
      {showGoogleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div className="glass-card p-8 animate-fade-in" style={{ width: '100%', maxWidth: '400px', background: '#FFFFFF', color: '#1F2937', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" style={{ marginBottom: '8px' }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '500', color: '#202124', fontFamily: 'system-ui, sans-serif' }}>Sign in with Google</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#5f6368' }}>to continue to ClientAxis</p>
            </div>

            {googleAccountStep === 1 ? (
              // Step 1: List saved Google accounts
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#5f6368', fontWeight: '500' }}>Choose an account</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                  {savedGoogleAccounts.map(email => (
                    <div 
                      key={email}
                      onClick={() => handleGoogleSignInWithEmail(email)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        border: '1px solid #DADCE0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FA'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--color-primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        flexShrink: 0
                      }}>
                        {email.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '24px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#3c4043', display: 'block', margin: 0 }}>{email.split('@')[0]}</span>
                        <span style={{ fontSize: '11px', color: '#5f6368', display: 'block' }}>{email}</span>
                      </div>
                      <button
                        onClick={(e) => handleRemoveSavedAccount(e, email)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}
                        title="Remove account from device"
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div 
                  onClick={() => setGoogleAccountStep(2)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    border: '1px dashed #DADCE0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    color: '#1a73e8',
                    fontWeight: '550',
                    fontSize: '13px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F8F9FA'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#E8F0FE',
                    color: '#1a73e8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    +
                  </div>
                  Use another account
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button 
                    type="button" 
                    className="btn" 
                    onClick={() => setShowGoogleModal(false)}
                    style={{ flex: 1, background: '#F1F3F4', color: '#5F6368', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: '500' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // Step 2: Input another Google email
              <form onSubmit={(e) => { e.preventDefault(); if (newGoogleEmail) { handleGoogleSignInWithEmail(newGoogleEmail); } }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#5f6368', fontWeight: '500' }}>Email or phone</label>
                  <input
                    type="email"
                    placeholder="Enter Google email address"
                    value={newGoogleEmail}
                    onChange={(e) => setNewGoogleEmail(e.target.value)}
                    required
                    autoFocus
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #DADCE0',
                      color: '#202124',
                      padding: '10px 12px',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button 
                    type="button" 
                    className="btn" 
                    onClick={() => {
                      if (savedGoogleAccounts.length > 0) {
                        setGoogleAccountStep(1);
                      } else {
                        setShowGoogleModal(false);
                      }
                    }}
                    style={{ flex: 1, background: '#F1F3F4', color: '#5F6368', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: '500' }}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="btn" 
                    style={{ flex: 1.5, background: '#1a73e8', color: 'white', fontWeight: '500', borderRadius: '4px', fontSize: '13px' }}
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Forgot Password Modal Dialog Overlay */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div className="glass-card p-6 animate-fade-in" style={{ width: '100%', maxWidth: '420px', border: '1px solid var(--color-primary)' }}>
            
            {/* Step 1: Request Code */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                  <Key size={20} />
                  <h3 style={{ margin: 0, fontSize: '18px' }}>Password Recovery</h3>
                </div>
                
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  Enter your registered admin username or email below. We'll generate a secure verification recovery code.
                </p>

                {forgotError && (
                  <div style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', color: 'white', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={16} style={{ color: '#ef4444' }} />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Username / Email</label>
                  <input
                    type="text"
                    placeholder="Enter username (e.g. admin)"
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeForgotModal} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={forgotLoading}>
                    {forgotLoading ? 'Processing...' : 'Send Code'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Verify Code and Reset Password */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                  <Key size={20} />
                  <h3 style={{ margin: 0, fontSize: '18px' }}>Verify Identity</h3>
                </div>

                {simulatedCode && (
                  <div style={{ 
                    background: 'rgba(212, 175, 55, 0.08)', 
                    border: '1px solid rgba(212, 175, 55, 0.25)', 
                    borderRadius: '8px', 
                    padding: '12px', 
                    fontSize: '13px',
                    lineHeight: '1.4'
                  }}>
                    <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '2px' }}>🔒 Sandbox Simulation Code:</strong>
                    Your recovery code is <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '15px', color: '#FFFFFF', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>{simulatedCode}</span>. Use this to verify.
                  </div>
                )}

                {forgotError && (
                  <div style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', color: 'white', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={16} style={{ color: '#ef4444' }} />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>6-Digit Recovery Code</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    required
                    style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '18px', fontWeight: 'bold', background: 'var(--bg-input)' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setForgotStep(1)} style={{ flex: 1 }}>
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={forgotLoading}>
                    {forgotLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Success Screen */}
            {forgotStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
                <CheckCircle size={56} style={{ color: 'var(--color-success)' }} />
                <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--color-text-primary)' }}>Password Updated</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  Your password has been successfully updated. You can now close this recovery manager and sign in.
                </p>
                <button type="button" className="btn btn-primary" onClick={closeForgotModal} style={{ width: '100%', marginTop: '12px' }}>
                  Done & Continue
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Keyframe animation injected inline for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
