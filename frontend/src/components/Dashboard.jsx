import React from 'react';
import { Users, UserCheck, PhoneCall, Sparkles, TrendingUp, DollarSign, Trophy, Activity, Calendar } from 'lucide-react';

export default function Dashboard({ leads, isFallback, onSelectLead, setActiveTab, notifications }) {
  
  // 1. Calculations & Dashboard Headers
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'New').length;
  const contactedLeads = leads.filter(l => l.status === 'Contacted').length;
  const qualifiedLeads = leads.filter(l => l.status === 'Qualified').length;
  const convertedLeads = leads.filter(l => l.status === 'Converted').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const leadsToday = leads.filter(l => l.date && l.date.startsWith(todayStr)).length;
  
  const pendingFollowupsCount = leads.filter(l => 
    l.followUpDate === todayStr && l.status !== 'Converted' && l.status !== 'Lost'
  ).length;

  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
  
  // Revenue Potential (₹) - Sum of values of all non-lost/non-converted leads, plus total closed revenue!
  const pipelineValue = leads
    .filter(l => l.status !== 'Lost' && l.status !== 'Converted')
    .reduce((acc, curr) => acc + (curr.value || 0), 0);

  const closedRevenue = leads
    .filter(l => l.status === 'Converted')
    .reduce((acc, curr) => acc + (curr.value || 0), 0);

  // Dynamic Greeting based on time
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // 2. Lead Source Analytics (Donut Chart calculations)
  const sourcesCount = {};
  leads.forEach(l => {
    sourcesCount[l.source] = (sourcesCount[l.source] || 0) + 1;
  });
  const sourceKeys = Object.keys(sourcesCount);
  const sourceData = sourceKeys.map(key => ({
    name: key,
    value: sourcesCount[key],
    percentage: totalLeads > 0 ? Math.round((sourcesCount[key] / totalLeads) * 100) : 0
  })).sort((a,b) => b.value - a.value);

  // 3. Team Performance
  const teamStats = {
    'Sarah Sales': { total: 0, converted: 0, revenue: 0 },
    'Mike Sales': { total: 0, converted: 0, revenue: 0 },
    'John Admin': { total: 0, converted: 0, revenue: 0 }
  };
  leads.forEach(l => {
    const agent = l.assignedTo || 'John Admin';
    if (teamStats[agent]) {
      teamStats[agent].total += 1;
      if (l.status === 'Converted') {
        teamStats[agent].converted += 1;
        teamStats[agent].revenue += (l.value || 0);
      }
    }
  });
  const teamList = Object.keys(teamStats).map(name => ({
    name,
    ...teamStats[name]
  })).sort((a, b) => b.revenue - a.revenue);

  // 4. Recent Activity Feed (Aggregation of activities across all leads)
  let allActivities = [];
  leads.forEach(lead => {
    if (lead.activities) {
      lead.activities.forEach(act => {
        allActivities.push({
          ...act,
          leadName: lead.name,
          leadId: lead._id,
          leadObj: lead
        });
      });
    }
  });
  // Sort activities by date descending
  allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentActivities = allActivities.slice(0, 6);

  // Format currency
  const formatRupee = (value) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Header Greeting Panel */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08), rgba(244, 209, 96, 0.08))',
        border: '1px solid var(--border-light)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '24px', margin: '0 0 6px 0', color: 'var(--color-text-primary)' }}>
            {getGreeting()}, Admin 👋
          </h2>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            You generated <strong style={{ color: 'var(--color-primary)' }}>{leadsToday}</strong> new leads today. 
            <strong style={{ color: 'var(--color-warning)' }}> {pendingFollowupsCount}</strong> follow-ups require your attention.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setActiveTab('calendar')}>
            <Calendar size={16} /> View Tasks
          </button>
          <button className="btn btn-primary" onClick={() => setActiveTab('simulator')}>
            + Generate Lead
          </button>
        </div>
      </div>

      {/* 2. Premium KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1: Total Leads */}
        <div className="glass-card p-5" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500', textTransform: 'uppercase' }}>Total Leads</span>
              <h3 style={{ fontSize: '28px', margin: '4px 0 0 0', fontWeight: '700' }}>{totalLeads}</h3>
            </div>
            <span style={{ fontSize: '12px', background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
              ↑ 12%
            </span>
          </div>
          <div style={{ height: '30px', marginTop: '10px' }}>
            <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <path d="M 0 20 C 20 20, 30 10, 50 15 C 70 20, 80 25, 100 8" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 2: New Leads */}
        <div className="glass-card p-5" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500', textTransform: 'uppercase' }}>New Leads</span>
              <h3 style={{ fontSize: '28px', margin: '4px 0 0 0', fontWeight: '700' }}>{newLeads}</h3>
            </div>
            <span style={{ fontSize: '12px', background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
              ↑ 8%
            </span>
          </div>
          <div style={{ height: '30px', marginTop: '10px' }}>
            <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <path d="M 0 22 L 15 25 L 30 15 L 45 18 L 60 10 L 75 20 L 90 12 L 100 10" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Card 3: Conversion Rate */}
        <div className="glass-card p-5" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500', textTransform: 'uppercase' }}>Conversion Rate</span>
              <h3 style={{ fontSize: '28px', margin: '4px 0 0 0', fontWeight: '700' }}>{conversionRate}%</h3>
            </div>
            <span style={{ fontSize: '12px', background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
              ↑ 5%
            </span>
          </div>
          <div style={{ height: '30px', marginTop: '10px' }}>
            <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <path d="M 0 25 C 20 25, 40 22, 60 15 C 80 8, 90 5, 100 5" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 4: Revenue Potential */}
        <div className="glass-card p-5" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '500', textTransform: 'uppercase' }}>Pipeline Potential</span>
              <h3 style={{ fontSize: '28px', margin: '4px 0 0 0', fontWeight: '700' }}>{formatRupee(pipelineValue)}</h3>
            </div>
            <span style={{ fontSize: '12px', background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
              ↑ 14%
            </span>
          </div>
          <div style={{ height: '30px', marginTop: '10px' }}>
            <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <path d="M 0 22 C 20 22, 30 25, 50 18 C 70 11, 80 5, 100 8" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Sales Funnel and Donut Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        {/* Sales Funnel Visualization */}
        <div className="glass-card p-6" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--color-text-primary)' }}>Sales Conversion Funnel</h3>
          <div className="funnel-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Leads */}
            <div className="funnel-stage">
              <div className="funnel-bar" style={{ width: '100%', background: 'rgba(212, 175, 55, 0.85)' }}>
                <div className="funnel-label">
                  <span>📥 Total Leads Received</span>
                  <span className="funnel-value">{totalLeads} Leads (100%)</span>
                </div>
              </div>
            </div>
            <div className="funnel-arrow">↓</div>
            {/* Contacted */}
            <div className="funnel-stage">
              <div className="funnel-bar" style={{ 
                width: `${totalLeads > 0 ? ((contactedLeads + qualifiedLeads + convertedLeads) / totalLeads) * 100 : 0}%`, 
                background: 'rgba(244, 209, 96, 0.85)' 
              }}>
                <div className="funnel-label">
                  <span>📞 Contact Initiated</span>
                  <span className="funnel-value">
                    {contactedLeads + qualifiedLeads + convertedLeads} ({totalLeads > 0 ? Math.round(((contactedLeads + qualifiedLeads + convertedLeads) / totalLeads) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
            <div className="funnel-arrow">↓</div>
            {/* Qualified */}
            <div className="funnel-stage">
              <div className="funnel-bar" style={{ 
                width: `${totalLeads > 0 ? ((qualifiedLeads + convertedLeads) / totalLeads) * 100 : 0}%`, 
                background: 'rgba(197, 160, 40, 0.85)' 
              }}>
                <div className="funnel-label">
                  <span>💎 Sales Qualified</span>
                  <span className="funnel-value">
                    {qualifiedLeads + convertedLeads} ({totalLeads > 0 ? Math.round(((qualifiedLeads + convertedLeads) / totalLeads) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
            <div className="funnel-arrow">↓</div>
            {/* Converted */}
            <div className="funnel-stage">
              <div className="funnel-bar" style={{ 
                width: `${totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0}%`, 
                background: 'rgba(34, 197, 94, 0.85)' 
              }}>
                <div className="funnel-label">
                  <span>🏆 Deals Converted</span>
                  <span className="funnel-value">{convertedLeads} ({conversionRate}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Source Analytics - Donut Chart */}
        <div className="glass-card p-6" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--color-text-primary)' }}>Lead Source Distribution</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flex: 1, gap: '20px', flexWrap: 'wrap' }}>
            {/* SVG Donut */}
            <div style={{ position: 'relative', width: '130px', height: '130px' }}>
              <svg width="100%" height="100%" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.915" fill="none" stroke="rgba(128,128,128,0.08)" strokeWidth="4" />
                {(() => {
                  let accumulatedOffset = 0;
                  const colors = ['#D4AF37', '#F4D160', '#C5A028', '#8E6E1F', '#5E4910'];
                  return sourceData.map((src, idx) => {
                    const percent = src.percentage;
                    const strokeColor = colors[idx % colors.length];
                    const strokeDash = `${percent} ${100 - percent}`;
                    const offset = 100 - accumulatedOffset + 25; // start from top
                    accumulatedOffset += percent;
                    return (
                      <circle
                        key={src.name}
                        cx="21"
                        cy="21"
                        r="15.915"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="4"
                        strokeDasharray={strokeDash}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                    );
                  });
                })()}
              </svg>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{totalLeads}</span>
                <span style={{ display: 'block', fontSize: '9px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Leads</span>
              </div>
            </div>

            {/* Legends */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '130px' }}>
              {sourceData.length === 0 ? (
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>No source data.</span>
              ) : (
                sourceData.map((src, idx) => {
                  const colors = ['#D4AF37', '#F4D160', '#C5A028', '#8E6E1F', '#5E4910'];
                  const dotColor = colors[idx % colors.length];
                  return (
                    <div key={src.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor }} />
                        <span style={{ color: 'var(--color-text-secondary)' }}>{src.name}</span>
                      </div>
                      <span style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{src.percentage}%</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Professional Charts (SVG bar and line charts) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        {/* Lead Growth Trend Chart (Monthly Columns) */}
        <div className="glass-card p-6" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--color-text-primary)' }}>Monthly Lead Growth</h3>
          <div style={{ height: '220px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Gridlines */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '180px', position: 'absolute', left: 0, right: 0, pointerEvents: 'none' }}>
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} style={{ borderBottom: '1px dashed var(--border-light)', width: '100%', height: 0 }} />
              ))}
            </div>

            {/* Bars container */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'end', height: '180px', zIndex: 10 }}>
              {[
                { month: 'Jan', val: 5 },
                { month: 'Feb', val: 12 },
                { month: 'Mar', val: 18 },
                { month: 'Apr', val: 24 },
                { month: 'May', val: totalLeads + 10 } // Sync with data!
              ].map(item => {
                const maxVal = 40;
                const percentHeight = Math.min((item.val / maxVal) * 100, 100);
                return (
                  <div key={item.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '40px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>{item.val}</span>
                    <div style={{
                      height: `${percentHeight * 1.5}px`,
                      width: '24px',
                      background: 'linear-gradient(to top, var(--color-primary), var(--color-accent))',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.8s ease'
                    }} />
                  </div>
                );
              })}
            </div>

            {/* Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May'].map(m => (
                <span key={m} style={{ fontSize: '12px', color: 'var(--color-text-secondary)', width: '40px', textAlign: 'center' }}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Conversion Rate Trend Chart (SVG Line Chart) */}
        <div className="glass-card p-6" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--color-text-primary)' }}>Weekly Conversion Trend</h3>
          <div style={{ height: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            
            {/* SVG Line Graph */}
            <div style={{ height: '180px', width: '100%', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 400 180" preserveAspectRatio="none" style={{ position: 'absolute', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {/* Horizontal Dashed Lines */}
                <line x1="0" y1="45" x2="400" y2="45" stroke="var(--border-light)" strokeDasharray="4 4" />
                <line x1="0" y1="90" x2="400" y2="90" stroke="var(--border-light)" strokeDasharray="4 4" />
                <line x1="0" y1="135" x2="400" y2="135" stroke="var(--border-light)" strokeDasharray="4 4" />

                {/* Filled Area */}
                <path d="M 0 150 L 80 110 L 160 130 L 240 80 L 320 60 L 400 45 L 400 180 L 0 180 Z" fill="url(#areaGrad)" />

                {/* Plot Line */}
                <path d="M 0 150 L 80 110 L 160 130 L 240 80 L 320 60 L 400 45" fill="none" stroke="var(--color-secondary)" strokeWidth="3" strokeLinecap="round" />

                {/* Plot Dots */}
                <circle cx="0" cy="150" r="4" fill="white" stroke="var(--color-secondary)" strokeWidth="2" />
                <circle cx="80" cy="110" r="4" fill="white" stroke="var(--color-secondary)" strokeWidth="2" />
                <circle cx="160" cy="130" r="4" fill="white" stroke="var(--color-secondary)" strokeWidth="2" />
                <circle cx="240" cy="80" r="4" fill="white" stroke="var(--color-secondary)" strokeWidth="2" />
                <circle cx="320" cy="60" r="4" fill="white" stroke="var(--color-secondary)" strokeWidth="2" />
                <circle cx="400" cy="45" r="4" fill="white" stroke="var(--color-secondary)" strokeWidth="2" />
              </svg>
            </div>

            {/* Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
              {['Wk 18', 'Wk 19', 'Wk 20', 'Wk 21', 'Wk 22', 'Wk 23'].map(wk => (
                <span key={wk} style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{wk}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Team Performance & Recent Activities */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        {/* Sales Team Performance Leaderboard */}
        <div className="glass-card p-6" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Trophy size={18} style={{ color: 'var(--color-warning)' }} />
            <h3 style={{ fontSize: '18px', margin: 0 }}>Sales Team Performance</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            {teamList.map((member, idx) => {
              const conversion = member.total > 0 ? Math.round((member.converted / member.total) * 100) : 0;
              return (
                <div key={member.name} style={{
                  padding: '12px 14px',
                  background: 'rgba(128,128,128,0.03)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: idx === 0 ? 'var(--color-warning-bg)' : 'rgba(128,128,128,0.1)',
                      color: idx === 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>{idx + 1}</span>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', color: 'var(--color-text-primary)' }}>{member.name}</h4>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {member.converted} wins / {member.total} leads • {conversion}% Conv
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-success)' }}>
                    {formatRupee(member.revenue)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="glass-card p-6" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Activity size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '18px', margin: 0 }}>Recent Activity Feed</h3>
          </div>

          {recentActivities.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              padding: '24px'
            }}>
              <span>📈 No activity logs recorded yet.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {recentActivities.map((act, idx) => (
                <div 
                  key={idx}
                  onClick={() => onSelectLead(act.leadObj)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '8px 10px',
                    background: 'rgba(128,128,128,0.02)',
                    border: '1px solid rgba(128,128,128,0.04)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                    e.currentTarget.style.borderColor = 'rgba(128,128,128,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(128,128,128,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(128,128,128,0.04)';
                  }}
                >
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: act.type === 'status' ? 'var(--color-secondary)' : act.type === 'note' ? 'var(--color-primary)' : act.type === 'creation' ? 'var(--color-success)' : 'var(--color-text-muted)',
                    marginTop: '5px',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px 0', color: 'var(--color-text-primary)' }}>
                      <strong>{act.leadName}</strong>: {act.text}
                    </p>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                      {new Date(act.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
