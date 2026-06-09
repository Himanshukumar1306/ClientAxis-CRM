import React, { useState } from 'react';
import { Sparkles, DollarSign } from 'lucide-react';

export default function PipelineBoard({ leads, onSelectLead, onUpdateStatus }) {
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const columns = [
    { key: 'New', title: 'New Leads' },
    { key: 'Contacted', title: 'Contacted' },
    { key: 'Qualified', title: 'Qualified' },
    { key: 'Converted', title: 'Converted' }
  ];

  // Drag and Drop Handlers
  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    if (dragOverColumn !== colKey) {
      setDragOverColumn(colKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) {
      onUpdateStatus(leadId, targetStatus);
    }
  };

  // Score badge helper
  const getScoreBadge = (score) => {
    if (score >= 80) return { label: 'Hot', colorClass: 'kanban-score-hot', color: '#22c55e' };
    if (score >= 60) return { label: 'Warm', colorClass: 'kanban-score-warm', color: '#f59e0b' };
    return { label: 'Cold', colorClass: 'kanban-score-cold', color: '#ef4444' };
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Board Guide Header */}
      <div className="glass-card p-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '16px', margin: '0 0 4px 0' }}>Deal Pipeline Board</h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Drag and drop cards between stages to update deal statuses in real time.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }} /> Hot (Score &ge; 80)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-warning)' }} /> Warm (Score &ge; 60)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger)' }} /> Cold (Score &lt; 60)</span>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="kanban-board">
        {columns.map(col => {
          // Filter leads for this column
          const colLeads = leads.filter(l => l.status === col.key);
          
          // Calculate column potential revenue value
          const colValueSum = colLeads.reduce((acc, curr) => acc + (curr.value || 0), 0);

          return (
            <div
              key={col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
              className={`kanban-column ${dragOverColumn === col.key ? 'drag-over' : ''}`}
            >
              {/* Column Header */}
              <div className="kanban-header">
                <div>
                  <h4 className="kanban-title">{col.title}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                    Value: ₹{colValueSum.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="kanban-count">{colLeads.length}</span>
              </div>

              {/* Column Cards */}
              <div className="kanban-cards-container">
                {colLeads.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '24px 8px',
                    color: 'var(--color-text-muted)',
                    fontSize: '12px',
                    border: '1px dashed var(--border-light)',
                    borderRadius: '8px',
                    margin: '4px 0'
                  }}>
                    No leads here.
                  </div>
                ) : (
                  colLeads.map(lead => {
                    const scoreInfo = getScoreBadge(lead.aiScore);
                    return (
                      <div
                        key={lead._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead._id)}
                        onClick={() => onSelectLead(lead)}
                        className="kanban-card"
                      >
                        {/* Lead Name & Score badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                            {lead.name}
                          </h5>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: '8px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: `${scoreInfo.color}15`,
                            color: scoreInfo.color,
                            border: `1px solid ${scoreInfo.color}30`,
                            textTransform: 'uppercase'
                          }}>
                            {scoreInfo.label}
                          </span>
                        </div>

                        {/* Value & Agent */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          <span style={{ fontWeight: '600', color: 'var(--color-success)' }}>
                            ₹{(lead.value || 0).toLocaleString()}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {lead.assignedTo ? lead.assignedTo.split(' ')[0] : 'Unassigned'}
                          </span>
                        </div>

                        {/* Source Tag */}
                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                          <span style={{ color: 'var(--color-accent)' }}>
                            {lead.source}
                          </span>
                          <span style={{ color: 'var(--color-text-muted)' }}>
                            Score: {lead.aiScore}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
