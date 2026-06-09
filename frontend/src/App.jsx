import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Smartphone, 
  LogOut, 
  Settings, 
  Server, 
  RefreshCw, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  ChevronDown, 
  User, 
  Trello, 
  Calendar as CalendarIcon, 
  AlertCircle 
} from 'lucide-react';
import { api } from './utils/api';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import LeadsTable from './components/LeadsTable';
import LeadDetails from './components/LeadDetails';
import PipelineBoard from './components/PipelineBoard';
import FollowUpCalendar from './components/FollowUpCalendar';
import ContactFormSimulator from './components/ContactFormSimulator';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [isFallback, setIsFallback] = useState(false);
  const [sources, setSources] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [theme, setTheme] = useState(localStorage.getItem('crm_theme') || 'dark');

  // UI Dropdowns State
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Search & Filter State
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    source: 'all',
    assignedTo: 'all'
  });

  const bellRef = useRef(null);
  const profileRef = useRef(null);

  // Setup theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('crm_theme', theme);
  }, [theme]);

  // Click outside listener to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setShowBellDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Verify token on load
  useEffect(() => {
    const checkAuth = async () => {
      const valid = await api.verifyToken();
      if (valid) {
        setIsAuthenticated(true);
        try {
          const token = api.getToken();
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({ username: payload.username || 'admin' });
        } catch (e) {
          setUser({ username: 'admin' });
        }
      }
      setLoadingAuth(false);
    };
    checkAuth();
  }, []);

  // Fetch leads and unique sources
  const fetchCrmData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingLeads(true);
    try {
      const data = await api.getLeads(filters);
      setLeads(data.leads);
      setIsFallback(data.isFallback);
      
      const uniqueSources = await api.getLeadSources();
      setSources(uniqueSources);

      // Keep selected lead state in sync if drawer is open
      if (selectedLead) {
        const refreshedLead = data.leads.find(l => l._id === selectedLead._id);
        if (refreshedLead) {
          setSelectedLead(refreshedLead);
        }
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  }, [isAuthenticated, filters, selectedLead]);

  // Trigger fetch when parameters or trigger changes
  useEffect(() => {
    fetchCrmData();
  }, [fetchCrmData, refreshTrigger]);

  // Auth Handlers
  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setUser(null);
    setSelectedLead(null);
  };

  // Lead actions
  const handleUpdateLeadStatus = async (id, status) => {
    try {
      await api.updateLeadStatus(id, status);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleUpdateLeadDetails = async (id, details) => {
    try {
      await api.updateLeadDetails(id, details);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      alert(err.message || 'Failed to update details.');
    }
  };

  const handleAddLeadNote = async (id, noteText) => {
    try {
      await api.addLeadNote(id, noteText);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      alert(err.message || 'Failed to add note.');
    }
  };

  const handleDeleteLead = async (id) => {
    try {
      await api.deleteLead(id);
      if (selectedLead && selectedLead._id === id) {
        setSelectedLead(null);
      }
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      alert(err.message || 'Failed to delete lead.');
    }
  };

  // Dynamic Notification Engine
  const notifications = [];
  const todayStr = new Date().toISOString().split('T')[0];

  leads.forEach(lead => {
    if (lead.status === 'New') {
      notifications.push({
        id: `new-${lead._id}`,
        title: 'New Lead Generated',
        text: `${lead.name} submitted from ${lead.source}`,
        type: 'new',
        lead
      });
    }
    if (lead.followUpDate === todayStr && lead.status !== 'Converted' && lead.status !== 'Lost') {
      notifications.push({
        id: `follow-${lead._id}`,
        title: 'Pending Follow-Up',
        text: `Schedule call today with ${lead.name}`,
        type: 'followup',
        lead
      });
    }
    // Conversions in the last 2 days
    if (lead.status === 'Converted') {
      notifications.push({
        id: `conv-${lead._id}`,
        title: 'Lead Converted!',
        text: `${lead.name} deal closed for ₹${(lead.value || 0).toLocaleString()}`,
        type: 'converted',
        lead
      });
    }
  });

  const handleNotificationClick = (lead) => {
    setSelectedLead(lead);
    setShowBellDropdown(false);
  };

  // Switch to leads manager on topbar search typing
  const handleGlobalSearch = (val) => {
    setFilters(prev => ({ ...prev, search: val }));
    if (activeTab !== 'leads') {
      setActiveTab('leads');
    }
  };

  if (loadingAuth) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        color: 'var(--color-text-secondary)'
      }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
        <span>Loading ClientAxis CRM...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      
      {/* Sidebar Navigation */}
      <aside style={{
        width: '260px',
        background: 'var(--bg-sidebar)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        padding: '24px 16px',
        zIndex: 500
      }}>
        {/* App Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '4px' }}>
          <img 
            src="/logo.jpg" 
            alt="ClientAxis Logo" 
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              objectFit: 'cover',
              border: '1px solid var(--border-light)'
            }}
          />
          <h2 style={{ fontSize: '20px', margin: 0, color: 'var(--color-text-primary)', fontFamily: 'var(--font-title)', fontWeight: '700', letterSpacing: '-0.03em' }}>ClientAxis</h2>
        </div>

        {/* Navigation Menu */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={navButtonStyle(activeTab === 'dashboard')}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            style={navButtonStyle(activeTab === 'leads')}
          >
            <Users size={18} />
            Leads Manager
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            style={navButtonStyle(activeTab === 'pipeline')}
          >
            <Trello size={18} />
            Pipeline Board
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            style={navButtonStyle(activeTab === 'calendar')}
          >
            <CalendarIcon size={18} />
            Follow-Up Calendar
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            style={navButtonStyle(activeTab === 'simulator')}
          >
            <Smartphone size={18} />
            Form Simulator
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            style={navButtonStyle(activeTab === 'settings')}
          >
            <Settings size={18} />
            System Settings
          </button>
        </nav>

        {/* Footer database metadata */}
        <div style={{
          borderTop: '1px solid var(--border-light)',
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--color-text-muted)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Server size={12} style={{ color: isFallback ? 'var(--color-warning)' : 'var(--color-success)' }} />
            {isFallback ? 'Local File DB Mode' : 'MongoDB Production'}
          </span>
        </div>
      </aside>

      {/* Main Panel Content Wrapper */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Global Top Bar */}
        <header style={{
          height: '70px',
          background: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          position: 'sticky',
          top: 0,
          zIndex: 400,
          backdropFilter: 'blur(12px)'
        }}>
          {/* Global Search Input */}
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)'
            }} />
            <input
              type="text"
              placeholder="Search leads globally..."
              value={filters.search}
              onChange={(e) => handleGlobalSearch(e.target.value)}
              style={{
                paddingLeft: '36px',
                borderRadius: '20px',
                background: 'rgba(128,128,128,0.06)',
                height: '36px'
              }}
            />
          </div>

          {/* Right Top Bar items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Dark/Light mode toggle */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="btn btn-secondary"
              style={{ padding: '8px', borderRadius: '50%', background: 'transparent', border: 'none' }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification Bell Dropdown */}
            <div style={{ position: 'relative' }} ref={bellRef}>
              <button
                onClick={() => setShowBellDropdown(prev => !prev)}
                className="btn btn-secondary"
                style={{ padding: '8px', borderRadius: '50%', background: 'transparent', border: 'none', position: 'relative' }}
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '8px',
                    height: '8px',
                    background: 'var(--color-danger)',
                    borderRadius: '50%'
                  }} className="animate-pulse" />
                )}
              </button>

              {showBellDropdown && (
                <div className="glass-card" style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '320px',
                  maxHeight: '360px',
                  overflowY: 'auto',
                  zIndex: 600,
                  padding: '12px'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                    Notifications ({notifications.length})
                  </h4>
                  {notifications.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px' }}>
                      No alerts pending. You are all caught up!
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif.lead)}
                          style={{
                            padding: '8px 10px',
                            background: 'rgba(128,128,128,0.04)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(128,128,128,0.04)'}
                        >
                          <strong style={{
                            display: 'block',
                            color: notif.type === 'converted' ? 'var(--color-success)' : notif.type === 'followup' ? 'var(--color-warning)' : 'var(--color-primary)'
                          }}>{notif.title}</strong>
                          <span style={{ color: 'var(--color-text-secondary)' }}>{notif.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button
                onClick={() => setShowProfileDropdown(prev => !prev)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '13px'
                }}>
                  {user ? user.username.charAt(0).toUpperCase() : 'A'}
                </div>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>
                  {user ? user.username.split('@')[0] : 'Admin'}
                </span>
                <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />
              </button>

              {showProfileDropdown && (
                <div className="glass-card" style={{
                  position: 'absolute',
                  top: '40px',
                  right: 0,
                  width: '180px',
                  zIndex: 600,
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-light)', marginBottom: '4px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>John Admin</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)' }}>john@crm.local</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('settings'); setShowProfileDropdown(false); }}
                    className="btn btn-secondary"
                    style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '12px', border: 'none', background: 'transparent' }}
                  >
                    <User size={14} /> Profile & Settings
                  </button>
                  <button
                    onClick={() => { setTheme(prev => prev === 'dark' ? 'light' : 'dark'); setShowProfileDropdown(false); }}
                    className="btn btn-secondary"
                    style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '12px', border: 'none', background: 'transparent' }}
                  >
                    {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} Switch Theme
                  </button>
                  <button
                    onClick={handleLogout}
                    className="btn"
                    style={{
                      justifyContent: 'flex-start',
                      padding: '8px 10px',
                      fontSize: '12px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: 'var(--color-danger)',
                      border: 'none',
                      marginTop: '4px'
                    }}
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Content Body */}
        <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
          {activeTab === 'dashboard' && (
            <Dashboard 
              leads={leads} 
              isFallback={isFallback} 
              onSelectLead={setSelectedLead} 
              setActiveTab={setActiveTab}
              notifications={notifications}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsTable
              leads={leads}
              sources={sources}
              filters={filters}
              setFilters={setFilters}
              onSelectLead={setSelectedLead}
              onDeleteLead={handleDeleteLead}
            />
          )}

          {activeTab === 'pipeline' && (
            <PipelineBoard
              leads={leads}
              onSelectLead={setSelectedLead}
              onUpdateStatus={handleUpdateLeadStatus}
            />
          )}

          {activeTab === 'calendar' && (
            <FollowUpCalendar
              leads={leads}
              onSelectLead={setSelectedLead}
              onUpdateDetails={handleUpdateLeadDetails}
            />
          )}

          {activeTab === 'simulator' && (
            <ContactFormSimulator 
              onLeadAdded={() => setRefreshTrigger(prev => prev + 1)}
            />
          )}

          {activeTab === 'settings' && (
            <div className="glass-card p-6 animate-fade-in" style={{ maxWidth: '650px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Server size={22} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '18px', margin: 0 }}>System Configuration Settings</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Active Database Provider</span>
                  <div style={{
                    padding: '12px 14px',
                    background: 'rgba(128,128,128,0.06)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>{isFallback ? 'Local JSON database files (zero-configuration)' : 'MongoDB instance connected'}</span>
                    <span className={`badge ${isFallback ? 'badge-new' : 'badge-converted'}`}>
                      {isFallback ? 'Fallback DB' : 'MongoDB Live'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>Connection Path</span>
                    <input
                      type="text"
                      readOnly
                      value={isFallback ? 'backend/db/local_db/leads.json' : 'mongodb://localhost:27017/crm_db'}
                      style={{ fontFamily: 'monospace', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>API Server Port</span>
                    <input
                      type="text"
                      readOnly
                      value="5000"
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginTop: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>Sales Team Roster</h4>
                  <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Leads are automatically routed and balanced across the following team members:
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['John Admin', 'Sarah Sales', 'Mike Sales'].map(member => (
                      <div key={member} style={{
                        padding: '10px 14px',
                        background: 'rgba(128,128,128,0.04)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        textAlign: 'center',
                        flex: 1
                      }}>
                        <strong style={{ display: 'block', color: 'var(--color-text-primary)' }}>{member}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {member.includes('Admin') ? 'Administrator' : 'Sales Representative'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Slide-out Drawer */}
      {selectedLead && (
        <>
          <div 
            onClick={() => setSelectedLead(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 900
            }}
          />
          <LeadDetails
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdateStatus={handleUpdateLeadStatus}
            onUpdateDetails={handleUpdateLeadDetails}
            onAddNote={handleAddLeadNote}
          />
        </>
      )}

    </div>
  );
}

// Navigation button style helper
const navButtonStyle = (isActive) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 14px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '550',
  textAlign: 'left',
  width: '100%',
  transition: 'all 0.2s ease',
  color: isActive ? 'white' : 'var(--color-text-secondary)',
  background: isActive ? 'var(--bg-active)' : 'transparent',
  borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent'
});
