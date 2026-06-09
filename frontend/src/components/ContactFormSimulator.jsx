import React, { useState } from 'react';
import { Send, CheckCircle2, Copy, Code, Sparkles, Loader } from 'lucide-react';
import { api } from '../utils/api';

export default function ContactFormSimulator({ ownerId, onLeadAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    source: 'Website Form'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setError('Name and Email are required.');
      return;
    }
 
    setLoading(true);
    setError('');
    setSuccess(false);
 
    try {
      const result = await api.submitLeadForm({
        ...formData,
        ownerId
      });
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        source: 'Website Form'
      });
      if (onLeadAdded) {
        onLeadAdded(); // Refresh lead listing
      }
    } catch (err) {
      setError(err.message || 'Failed to submit form.');
    } finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = () => {
    const code = `<!-- Integrate into your website contact form -->
<form id="contactForm">
  <input type="text" name="name" placeholder="Name" required />
  <input type="email" name="email" placeholder="Email" required />
  <input type="tel" name="phone" placeholder="Phone" />
  <textarea name="message" placeholder="Your Message"></textarea>
  <input type="hidden" name="source" value="Homepage Form" />
  <button type="submit">Submit</button>
</form>

<script>
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  try {
    const response = await fetch('http://localhost:5000/api/leads/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    alert('Thank you! Lead sent to CRM.');
  } catch (error) {
    console.error('Error sending lead:', error);
  }
});
</script>`;

    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '24px',
      alignItems: 'start'
    }}>
      
      {/* Simulation Form Card */}
      <div className="glass-card p-6" style={{
        position: 'relative',
        background: 'radial-gradient(at 0% 0%, rgba(6, 182, 212, 0.05) 0px, transparent 50%), var(--bg-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <div style={{
            color: 'var(--color-accent)',
            background: 'rgba(6, 182, 212, 0.12)',
            padding: '6px',
            borderRadius: '8px'
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', margin: 0 }}>Website Form Simulator</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>Simulate a client submitting a contact form on your site</p>
          </div>
        </div>

        {success && (
          <div style={{
            background: 'var(--color-success-bg)',
            border: '1px solid var(--color-success)',
            color: 'white',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }} className="animate-fade-in">
            <CheckCircle2 size={20} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
            <div>
              <strong style={{ display: 'block' }}>Lead Submitted Successfully!</strong>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Click over to the **Leads** tab to see this lead populate in real time.</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger)',
            color: 'white',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Name *</label>
              <input
                type="text"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={loading}
                required
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Email *</label>
              <input
                type="email"
                placeholder="jane@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Phone</label>
              <input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Source Tag</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                disabled={loading}
              >
                <option value="Website Form">Website Form (General)</option>
                <option value="Homepage Form">Homepage Contact Form</option>
                <option value="Product Request">Product Inquiry Form</option>
                <option value="Newsletter">Newsletter Sign-up</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Message Inquiry</label>
            <textarea
              placeholder="Tell us about your project/needs..."
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows="4"
              disabled={loading}
              style={{ resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                Submitting lead...
              </>
            ) : (
              <>
                <Send size={16} />
                Send Inquiry
              </>
            )}
          </button>
        </form>
      </div>

      {/* Embedded Code Snippet Card */}
      <div className="glass-card p-6" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        height: '100%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '17px', margin: 0 }}>Integration Snippet</h3>
          </div>
          
          <button
            onClick={copyCodeToClipboard}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Copy size={13} />
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
        
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
          Integrate your actual frontend website contact forms to feed leads directly into this CRM by sending a <code>POST</code> request to the endpoint below.
        </p>

        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--border-light)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: 'var(--color-accent)'
        }}>
          POST http://localhost:5000/api/leads/submit
        </div>

        <pre style={{
          margin: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-light)',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '11px',
          overflowX: 'auto',
          maxHeight: '260px',
          fontFamily: 'Consolas, Monaco, "Courier New", Courier, monospace',
          color: '#34d399',
          lineHeight: '1.4'
        }}>
          {`// Integration JS example
const submitForm = async (data) => {
  const res = await fetch(
    'http://localhost:5000/api/leads/submit',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        source: 'Homepage Contact Form'
      })
    }
  );
  return await res.json();
};`}
        </pre>
      </div>

    </div>
  );
}
