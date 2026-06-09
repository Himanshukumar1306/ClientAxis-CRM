import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, User, Phone, Mail, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function FollowUpCalendar({ leads, onSelectLead, onUpdateDetails }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Helper to determine mock time slot based on name hash (keeps it stable)
  const getMockTimeSlot = (name) => {
    const slots = ['09:30 AM', '10:45 AM', '11:15 AM', '02:00 PM', '03:30 PM', '04:15 PM'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % slots.length;
    return slots[idx];
  };

  // Helper to format follow-up dates safely without nesting objects in JSX attributes
  const formatBadgeDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Group leads
  const overdue = [];
  const today = [];
  const tomorrow = [];
  const upcoming = [];

  leads.forEach(lead => {
    if (!lead.followUpDate || lead.status === 'Converted' || lead.status === 'Lost') return;
    
    if (lead.followUpDate < todayStr) {
      overdue.push(lead);
    } else if (lead.followUpDate === todayStr) {
      today.push(lead);
    } else if (lead.followUpDate === tomorrowStr) {
      tomorrow.push(lead);
    } else {
      upcoming.push(lead);
    }
  });

  // Sort groups by date
  upcoming.sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Calendar Header */}
      <div className="glass-card p-4" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CalendarIcon size={22} style={{ color: 'var(--color-primary)' }} />
        <div>
          <h3 style={{ fontSize: '16px', margin: '0 0 2px 0' }}>Client Follow-Up Scheduler</h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Track client calls and meetings. Complete or reschedule calls directly from each task card.
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Overdue & Today */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* OVERDUE BOX */}
          {overdue.length > 0 && (
            <div className="glass-card p-5" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--color-danger)' }}>
                <AlertCircle size={18} />
                <h4 style={{ margin: 0, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overdue Tasks ({overdue.length})</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {overdue.map(lead => (
                  <CalendarTaskCard 
                    key={lead._id} 
                    lead={lead} 
                    time={getMockTimeSlot(lead.name)} 
                    onSelect={onSelectLead} 
                    badgeText="Overdue" 
                    badgeColor="var(--color-danger)"
                    onUpdateDetails={onUpdateDetails}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TODAY BOX */}
          <div className="glass-card p-5">
            <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-primary)' }}>
              Today's Schedule ({today.length})
            </h4>
            {today.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0' }}>
                ☕ No follow-up calls scheduled for today.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {today.map(lead => (
                  <CalendarTaskCard 
                    key={lead._id} 
                    lead={lead} 
                    time={getMockTimeSlot(lead.name)} 
                    onSelect={onSelectLead} 
                    badgeText="Today" 
                    badgeColor="var(--color-warning)"
                    onUpdateDetails={onUpdateDetails}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tomorrow & Upcoming */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* TOMORROW BOX */}
          <div className="glass-card p-5">
            <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-primary)' }}>
              Tomorrow ({tomorrow.length})
            </h4>
            {tomorrow.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0' }}>
                No tasks scheduled for tomorrow.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tomorrow.map(lead => (
                  <CalendarTaskCard 
                    key={lead._id} 
                    lead={lead} 
                    time={getMockTimeSlot(lead.name)} 
                    onSelect={onSelectLead} 
                    badgeText="Tomorrow" 
                    badgeColor="var(--color-info)"
                    onUpdateDetails={onUpdateDetails}
                  />
                ))}
              </div>
            )}
          </div>

          {/* UPCOMING BOX */}
          <div className="glass-card p-5">
            <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-primary)' }}>
              Upcoming Future Tasks ({upcoming.length})
            </h4>
            {upcoming.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0' }}>
                No future follow-ups planned yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {upcoming.map(lead => (
                  <CalendarTaskCard 
                    key={lead._id} 
                    lead={lead} 
                    time={getMockTimeSlot(lead.name)} 
                    onSelect={onSelectLead} 
                    badgeText={formatBadgeDate(lead.followUpDate)} 
                    badgeColor="var(--color-primary)"
                    onUpdateDetails={onUpdateDetails}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for individual scheduler card
function CalendarTaskCard({ lead, time, onSelect, badgeText, badgeColor, onUpdateDetails }) {
  const [showReschedule, setShowReschedule] = useState(false);

  const handleComplete = (e) => {
    e.stopPropagation();
    if (confirm(`Mark follow-up call with ${lead.name} as completed?`)) {
      onUpdateDetails(lead._id, { followUpDate: '' });
    }
  };

  const handleRescheduleChange = (e) => {
    e.stopPropagation();
    onUpdateDetails(lead._id, { followUpDate: e.target.value });
    setShowReschedule(false);
  };

  return (
    <div 
      onClick={() => onSelect(lead)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px 14px',
        background: 'rgba(128, 128, 128, 0.02)',
        border: '1px solid var(--border-light)',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-hover)';
        e.currentTarget.style.borderColor = 'rgba(128, 128, 128, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(128, 128, 128, 0.02)';
        e.currentTarget.style.borderColor = 'var(--border-light)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ 
          fontSize: '10px', 
          fontWeight: '700', 
          color: badgeColor, 
          background: `${badgeColor}12`,
          padding: '2px 6px',
          borderRadius: '4px',
          textTransform: 'uppercase'
        }}>
          {badgeText}
        </span>
        
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> {time}
        </span>
      </div>

      <h5 style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-primary)', fontWeight: '600' }}>
        Call {lead.name}
      </h5>

      <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)' }}>
        Source: {lead.source} • Rep: {lead.assignedTo || 'Unassigned'}
      </p>

      <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--color-text-secondary)', borderTop: '1px solid rgba(128, 128, 128, 0.05)', paddingTop: '8px', marginTop: '2px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={11} /> {lead.email}</span>
        {lead.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={11} /> {lead.phone}</span>}
      </div>

      {/* Task Action items */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginTop: '8px',
        borderTop: '1px dashed var(--border-light)',
        paddingTop: '8px'
      }}>
        <button
          onClick={handleComplete}
          className="btn"
          style={{
            flex: 1,
            padding: '6px 8px',
            fontSize: '11px',
            background: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            borderRadius: '6px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
          title="Mark call completed"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-success)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-success-bg)';
            e.currentTarget.style.color = 'var(--color-success)';
          }}
        >
          <CheckCircle size={12} /> Done
        </button>
        
        <button
          onClick={(e) => { e.stopPropagation(); setShowReschedule(prev => !prev); }}
          className="btn btn-secondary"
          style={{
            flex: 1,
            padding: '6px 8px',
            fontSize: '11px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
          title="Change date"
        >
          <RefreshCw size={11} /> Reschedule
        </button>
      </div>

      {showReschedule && (
        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Select New Date:</label>
          <input
            type="date"
            onChange={handleRescheduleChange}
            style={{ padding: '6px', fontSize: '11px', height: '30px' }}
          />
        </div>
      )}
    </div>
  );
}
