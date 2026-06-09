import React, { useState, useEffect } from 'react';
import { Search, Filter, Mail, Phone, Trash2, Calendar, ExternalLink, Download, FileSpreadsheet, FileText } from 'lucide-react';

export default function LeadsTable({ 
  leads, 
  onSelectLead, 
  onDeleteLead, 
  filters, 
  setFilters, 
  sources 
}) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [dateFilter, setDateFilter] = useState('all');

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, setFilters]);

  // Handle delete click
  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      onDeleteLead(id);
    }
  };

  // Date Filtering logic (Client-side helper)
  const filterLeadsByDate = (leadsList) => {
    if (dateFilter === 'all') return leadsList;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    
    return leadsList.filter(lead => {
      const leadDate = new Date(lead.date).getTime();
      
      if (dateFilter === 'today') {
        return leadDate >= today;
      } else if (dateFilter === 'yesterday') {
        return leadDate >= (today - oneDay) && leadDate < today;
      } else if (dateFilter === '7days') {
        return leadDate >= (now.getTime() - 7 * oneDay);
      } else if (dateFilter === '30days') {
        return leadDate >= (now.getTime() - 30 * oneDay);
      }
      return true;
    });
  };

  const filteredLeads = filterLeadsByDate(leads);

  // Format currency
  const formatRupee = (value) => {
    return `₹${(value || 0).toLocaleString('en-IN')}`;
  };

  // Score badge helper
  const getScoreBadgeStyle = (score) => {
    if (score >= 80) return { background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' };
    if (score >= 60) return { background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' };
    return { background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' };
  };

  // EXPORT CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return alert('No data to export.');
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Name,Email,Phone,Source,Status,Value,AssignedTo,Date,AIScore\n';
    
    filteredLeads.forEach(lead => {
      const row = [
        `"${lead.name}"`,
        `"${lead.email}"`,
        `"${lead.phone || ''}"`,
        `"${lead.source}"`,
        `"${lead.status}"`,
        lead.value || 0,
        `"${lead.assignedTo || 'Unassigned'}"`,
        `"${new Date(lead.date).toLocaleDateString()}"`,
        lead.aiScore || 50
      ].join(',');
      csvContent += row + '\n';
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CRM_Leads_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT EXCEL (Excel opens CSV natively)
  const handleExportExcel = () => {
    handleExportCSV();
  };

  // EXPORT PDF (Prints a beautiful, styled tabular report in a new window)
  const handleExportPDF = () => {
    if (filteredLeads.length === 0) return alert('No data to export.');

    const printWindow = window.open('', '_blank');
    
    const rowsHtml = filteredLeads.map((lead, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${lead.name}</strong></td>
        <td>${lead.email}<br/><small>${lead.phone || '-'}</small></td>
        <td>${lead.source}</td>
        <td><span class="status-tag status-${lead.status.toLowerCase()}">${lead.status}</span></td>
        <td>₹${(lead.value || 0).toLocaleString()}</td>
        <td>${lead.assignedTo || 'Unassigned'}</td>
        <td>${lead.aiScore}</td>
        <td>${new Date(lead.date).toLocaleDateString()}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
      <head>
        <title>CRM Leads Executive Report</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #4f46e5; }
          .meta { text-align: right; font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          tr:nth-child(even) { background-color: #fafafa; }
          .status-tag { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
          .status-new { background-color: #fef3c7; color: #d97706; }
          .status-contacted { background-color: #dbeafe; color: #2563eb; }
          .status-qualified { background-color: #f3e8ff; color: #7c3aed; }
          .status-converted { background-color: #d1fae5; color: #059669; }
          .status-lost { background-color: #fee2e2; color: #dc2626; }
          .footer { font-size: 11px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 15px; margin-top: 50px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">ClientAxis CRM</div>
            <div style="font-size: 14px; color: #555;">Client Lead Generation & Forecasting Report</div>
          </div>
          <div class="meta">
            Date Generated: ${new Date().toLocaleString()}<br/>
            Total Leads: ${filteredLeads.length}<br/>
            Total Pipeline: ₹${filteredLeads.reduce((acc, curr) => acc + (curr.value || 0), 0).toLocaleString()}
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Client Name</th>
              <th>Contact Details</th>
              <th>Lead Source</th>
              <th>Deal Status</th>
              <th>Revenue Value</th>
              <th>Sales Rep</th>
              <th>AI Score</th>
              <th>Date Created</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        
        <div class="footer">
          This document is property of ClientAxis CRM. Generated programmatically on client request. Page 1 of 1.
        </div>
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Search and Filters Top Card */}
      <div className="glass-card p-4" style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        
        {/* Left Section: Advanced Filter Grid */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          flex: 1
        }}>
          {/* Status dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Status:</span>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              style={{ width: '125px', padding: '6px 10px', height: '34px' }}
            >
              <option value="all">All Status</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          {/* Source dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Source:</span>
            <select
              value={filters.source}
              onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
              style={{ width: '135px', padding: '6px 10px', height: '34px' }}
            >
              <option value="all">All Sources</option>
              {sources.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>

          {/* Rep dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Rep:</span>
            <select
              value={filters.assignedTo}
              onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
              style={{ width: '130px', padding: '6px 10px', height: '34px' }}
            >
              <option value="all">All Members</option>
              <option value="John Admin">John Admin</option>
              <option value="Sarah Sales">Sarah Sales</option>
              <option value="Mike Sales">Mike Sales</option>
            </select>
          </div>

          {/* Date Range Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Date:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ width: '120px', padding: '6px 10px', height: '34px' }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Right Section: Export Panel */}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleExportCSV} 
            title="Export to CSV"
            style={{ padding: '8px 12px', height: '34px', fontSize: '12px' }}
          >
            <Download size={14} /> CSV
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleExportExcel} 
            title="Export to Excel"
            style={{ padding: '8px 12px', height: '34px', fontSize: '12px' }}
          >
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleExportPDF} 
            title="Print PDF Report"
            style={{ padding: '8px 12px', height: '34px', fontSize: '12px' }}
          >
            <FileText size={14} /> Report
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-card" style={{ overflowX: 'auto' }}>
        {filteredLeads.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '52px 24px',
            color: 'var(--color-text-muted)'
          }}>
            <Filter size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <h4 style={{ margin: 0, fontSize: '15px' }}>📈 No analytics data yet</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>Start collecting leads or adjust your filters to see insights.</p>
          </div>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '13px'
          }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border-light)',
                background: 'rgba(128, 128, 128, 0.02)'
              }}>
                <th style={{ padding: '14px 18px', color: 'var(--color-text-primary)', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '14px 18px', color: 'var(--color-text-primary)', fontWeight: '600' }}>Contact Info</th>
                <th style={{ padding: '14px 18px', color: 'var(--color-text-primary)', fontWeight: '600' }}>Sales Rep</th>
                <th style={{ padding: '14px 18px', color: 'var(--color-text-primary)', fontWeight: '600' }}>Potential Value</th>
                <th style={{ padding: '14px 18px', color: 'var(--color-text-primary)', fontWeight: '600' }}>AI Score</th>
                <th style={{ padding: '14px 18px', color: 'var(--color-text-primary)', fontWeight: '600' }}>Source</th>
                <th style={{ padding: '14px 18px', color: 'var(--color-text-primary)', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '14px 18px', color: 'var(--color-text-primary)', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                let badgeClass = 'badge-new';
                if (lead.status === 'Contacted') badgeClass = 'badge-contacted';
                if (lead.status === 'Qualified') badgeClass = 'badge-qualified';
                if (lead.status === 'Converted') badgeClass = 'badge-converted';
                if (lead.status === 'Lost') badgeClass = 'badge-lost';

                const scoreStyle = getScoreBadgeStyle(lead.aiScore);

                return (
                  <tr 
                    key={lead._id}
                    onClick={() => onSelectLead(lead)}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    className="lead-row"
                  >
                    {/* Name */}
                    <td style={{ padding: '14px 18px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                      {lead.name}
                    </td>

                    {/* Contact Details */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)' }}>
                          <Mail size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                          {lead.email}
                        </span>
                        {lead.phone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)' }}>
                            <Phone size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                            {lead.phone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Assigned Salesperson */}
                    <td style={{ padding: '14px 18px', color: 'var(--color-text-secondary)' }}>
                      {lead.assignedTo || 'Unassigned'}
                    </td>

                    {/* Revenue Value */}
                    <td style={{ padding: '14px 18px', fontWeight: 'bold', color: 'var(--color-success)' }}>
                      {formatRupee(lead.value)}
                    </td>

                    {/* AI Score */}
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: scoreStyle.background,
                        color: scoreStyle.color
                      }}>
                        {lead.aiScore}/100
                      </span>
                    </td>

                    {/* Source */}
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ 
                        fontSize: '12px', 
                        color: 'var(--color-accent)',
                        background: 'rgba(6, 182, 212, 0.08)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(6, 182, 212, 0.15)'
                      }}>
                        {lead.source}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 18px' }}>
                      <span className={`badge ${badgeClass}`}>{lead.status}</span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 8px', borderRadius: '6px', background: 'rgba(128,128,128,0.02)' }}
                          title="Open Details"
                        >
                          <ExternalLink size={14} style={{ color: 'var(--color-text-secondary)' }} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, lead._id)}
                          className="btn"
                          style={{
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.15)',
                            color: 'var(--color-danger)'
                          }}
                          title="Delete Lead"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--color-danger)';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                            e.currentTarget.style.color = 'var(--color-danger)';
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .lead-row:hover {
          background: var(--bg-hover) !important;
        }
      `}</style>
    </div>
  );
}
