import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Calendar, Clock, Send, RefreshCw, Sparkles, User, DollarSign, Activity } from 'lucide-react';

export default function LeadDetails({ lead, onClose, onUpdateStatus, onUpdateDetails, onAddNote }) {
  const [newNote, setNewNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [detailsSaving, setDetailsSaving] = useState(false);

  // Form states for details edit
  const [potentialValue, setPotentialValue] = useState(lead ? lead.value || 0 : 0);
  const [assignedRep, setAssignedRep] = useState(lead ? lead.assignedTo || 'John Admin' : 'John Admin');
  const [followDate, setFollowDate] = useState(lead ? lead.followUpDate || '' : '');

  // Reset form when lead changes
  useEffect(() => {
    if (lead) {
      setPotentialValue(lead.value || 0);
      setAssignedRep(lead.assignedTo || 'John Admin');
      setFollowDate(lead.followUpDate || '');
    }
  }, [lead]);

  if (!lead) return null;

  const handleDetailsSave = async () => {
    setDetailsSaving(true);
    try {
      await onUpdateDetails(lead._id, {
        value: Number(potentialValue),
        assignedTo: assignedRep,
        followUpDate: followDate
      });
    } finally {
      setDetailsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === lead.status) return;
    try {
      await onUpdateStatus(lead._id, newStatus);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNoteSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setNoteSaving(true);
    try {
      await onAddNote(lead._id, newNote.trim());
      setNewNote('');
    } finally {
      setNoteSaving(false);
    }
  };

  // Determine stage progress for Stepper
  const getStepStatus = (stepName) => {
    const status = lead.status;
    const stages = ['New', 'Contacted', 'Qualified', 'Converted'];
    const currentIdx = stages.indexOf(status === 'Lost' ? 'New' : status);
    
    const targetIdx = ['Submitted', 'Contacted', 'Qualified', 'Converted'].indexOf(stepName);
    
    if (targetIdx < currentIdx) return 'completed';
    if (targetIdx === currentIdx) return 'active';
    return 'pending';
  };

  // Date formatting
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Score color helper
  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      maxWidth: '520px',
      background: 'var(--bg-sidebar)',
      borderLeft: '1px solid var(--border-light)',
      boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
    }} className="animate-slide-in-right">
      
      {/* Drawer Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(128,128,128,0.02)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '11px',
              background: 'rgba(128,128,128,0.08)',
              padding: '2px 8px',
              borderRadius: '4px',
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              Lead details drawer
            </span>
            <span style={{
              fontSize: '11px',
              background: `${getScoreColor(lead.aiScore)}15`,
              padding: '2px 8px',
              borderRadius: '4px',
              color: getScoreColor(lead.aiScore),
              border: `1px solid ${getScoreColor(lead.aiScore)}30`,
              fontWeight: 'bold'
            }}>
              AI Score: {lead.aiScore}/100
            </span>
          </div>
          <h2 style={{ margin: '6px 0 0 0', fontSize: '20px', color: 'var(--color-text-primary)' }}>{lead.name}</h2>
        </div>
        <button 
          onClick={onClose}
          className="btn btn-secondary"
          style={{ padding: '8px', borderRadius: '50%' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Drawer Body Scroll */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        
        {/* Stage Timeline Checklist Stepper */}
        {lead.status !== 'Lost' && (
          <div className="glass-card p-4">
            <div className="stepper">
              {/* Step 1 */}
              <div className={`stepper-step ${getStepStatus('Submitted')}`}>
                <div className="stepper-circle">✓</div>
                <div className="stepper-label">Submitted</div>
              </div>
              {/* Step 2 */}
              <div className={`stepper-step ${getStepStatus('Contacted')}`}>
                <div className="stepper-circle">
                  {getStepStatus('Contacted') === 'completed' ? '✓' : '2'}
                </div>
                <div className="stepper-label">Contacted</div>
              </div>
              {/* Step 3 */}
              <div className={`stepper-step ${getStepStatus('Qualified')}`}>
                <div className="stepper-circle">
                  {getStepStatus('Qualified') === 'completed' ? '✓' : '3'}
                </div>
                <div className="stepper-label">Qualified</div>
              </div>
              {/* Step 4 */}
              <div className={`stepper-step ${getStepStatus('Converted')}`}>
                <div className="stepper-circle">
                  {getStepStatus('Converted') === 'completed' ? '✓' : '4'}
                </div>
                <div className="stepper-label">Converted</div>
              </div>
            </div>
          </div>
        )}

        {lead.status === 'Lost' && (
          <div style={{
            background: 'var(--color-danger-bg)',
            border: '1px dashed var(--color-danger)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <X size={16} style={{ color: 'var(--color-danger)' }} />
            <span style={{ fontSize: '13px' }}>This deal was marked as <strong>Lost / Unqualified</strong>.</span>
          </div>
        )}

        {/* Status Quick Switcher Buttons */}
        <div>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500', display: 'block', marginBottom: '8px' }}>Pipeline Status Stage:</span>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '6px',
            background: 'rgba(128,128,128,0.04)',
            padding: '4px',
            borderRadius: '8px',
            border: '1px solid var(--border-light)'
          }}>
            {['New', 'Contacted', 'Qualified', 'Converted', 'Lost'].map((st) => {
              const isActive = lead.status === st;
              let btnClass = 'btn-secondary';
              if (isActive) {
                if (st === 'New') btnClass = 'status-btn-new';
                if (st === 'Contacted') btnClass = 'status-btn-contacted';
                if (st === 'Qualified') btnClass = 'status-btn-qualified';
                if (st === 'Converted') btnClass = 'status-btn-converted';
                if (st === 'Lost') btnClass = 'status-btn-lost';
              }
              return (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`btn ${isActive ? '' : 'btn-secondary'}`}
                  style={{
                    padding: '8px 2px',
                    fontSize: '10px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    ...(isActive ? {} : { background: 'transparent', border: 'none', color: 'var(--color-text-muted)' })
                  }}
                  className={isActive ? btnClass : ''}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Business Settings Forms: Potential, Assigned, Followup */}
        <div className="glass-card p-5" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '13px', margin: 0, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Deal Diagnostics</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Revenue value */}
            <div>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>Revenue Potential (Value)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', fontSize: '14px', color: 'var(--color-success)' }}>₹</span>
                <input
                  type="number"
                  value={potentialValue}
                  onChange={(e) => setPotentialValue(e.target.value)}
                  style={{ paddingLeft: '28px' }}
                />
              </div>
            </div>

            {/* Rep assign */}
            <div>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>Assigned Sales Representative</label>
              <select
                value={assignedRep}
                onChange={(e) => setAssignedRep(e.target.value)}
              >
                <option value="John Admin">John Admin (Manager)</option>
                <option value="Sarah Sales">Sarah Sales (Rep)</option>
                <option value="Mike Sales">Mike Sales (Rep)</option>
              </select>
            </div>

            {/* Follow up date */}
            <div>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>Scheduled Follow-Up Date</label>
              <input
                type="date"
                value={followDate}
                onChange={(e) => setFollowDate(e.target.value)}
              />
            </div>

            <button
              onClick={handleDetailsSave}
              className="btn btn-primary"
              disabled={detailsSaving}
              style={{ width: '100%', marginTop: '6px' }}
            >
              {detailsSaving ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Contact Info and Message Details */}
        <div className="glass-card p-5" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '13px', margin: 0, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Contact Channels</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
            <a href={`mailto:${lead.email}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
              <Mail size={15} style={{ color: 'var(--color-primary)' }} />
              <span className="hover-link">{lead.email}</span>
            </a>
            {lead.phone && (
              <a href={`tel:${lead.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                <Phone size={15} style={{ color: 'var(--color-info)' }} />
                <span className="hover-link">{lead.phone}</span>
              </a>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-secondary)' }}>
              <Calendar size={15} style={{ color: 'var(--color-warning)' }} />
              <span>Created: {formatDate(lead.date)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-secondary)' }}>
              <Clock size={15} style={{ color: 'var(--color-accent)' }} />
              <span>Source Form: {lead.source}</span>
            </div>
          </div>
        </div>

        {/* Inquiry Message */}
        <div className="glass-card p-5" style={{ background: 'rgba(0,0,0,0.15)' }}>
          <h3 style={{ fontSize: '13px', margin: '0 0 8px 0', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Message Sent</h3>
          <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.5', color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap' }}>
            {lead.message || <em style={{ color: 'var(--color-text-muted)' }}>No query message provided.</em>}
          </p>
        </div>

        {/* Chronological Activity Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={16} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '13px', margin: 0, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Chronological Activity Log</h3>
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            borderLeft: '2px solid var(--border-light)',
            paddingLeft: '16px',
            marginLeft: '8px'
          }}>
            {(!lead.activities || lead.activities.length === 0) ? (
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>No activities logged.</p>
            ) : (
              [...lead.activities].reverse().map((act, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  {/* Timeline dot */}
                  <div style={{
                    position: 'absolute',
                    left: '-22px',
                    top: '4px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: act.type === 'status' ? 'var(--color-secondary)' : act.type === 'note' ? 'var(--color-primary)' : act.type === 'creation' ? 'var(--color-success)' : 'var(--color-text-muted)',
                    border: '2px solid var(--bg-main)',
                  }} />
                  <div style={{ fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-text-primary)' }}>{act.text}</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginTop: '2px' }}>
                      {new Date(act.date).toLocaleString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Follow-Up Note Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Add Follow-Up Note:</span>
          <form onSubmit={handleAddNoteSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Log follow-up email, phone call summary..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              disabled={noteSaving}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={noteSaving || !newNote.trim()}
              style={{ padding: '10px', borderRadius: '8px' }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>

      </div>
      
      {/* Button styles overrides */}
      <style>{`
        .status-btn-new {
          background: var(--color-warning-bg) !important;
          color: var(--color-warning) !important;
          border: 1px solid var(--color-warning) !important;
        }
        .status-btn-contacted {
          background: var(--color-info-bg) !important;
          color: var(--color-info) !important;
          border: 1px solid var(--color-info) !important;
        }
        .status-btn-qualified {
          background: rgba(139, 92, 246, 0.12) !important;
          color: var(--color-secondary) !important;
          border: 1px solid var(--color-secondary) !important;
        }
        .status-btn-converted {
          background: var(--color-success-bg) !important;
          color: var(--color-success) !important;
          border: 1px solid var(--color-success) !important;
        }
        .status-btn-lost {
          background: var(--color-danger-bg) !important;
          color: var(--color-danger) !important;
          border: 1px solid var(--color-danger) !important;
        }
        .hover-link:hover {
          color: var(--color-primary);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
