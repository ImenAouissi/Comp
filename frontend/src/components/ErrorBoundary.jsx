import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('React error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#F8F6F0', padding: 24,
        }}>
          <div style={{
            maxWidth: 480, width: '100%', background: '#fff', borderRadius: 16,
            padding: '32px 28px', border: '1px solid rgba(27,67,50,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: '#1B4332', marginBottom: 8 }}>
              Une erreur est survenue
            </h2>
            <p style={{ fontSize: 13, color: '#6B7B6E', marginBottom: 16, lineHeight: 1.6 }}>
              {this.state.error?.message || 'Erreur inattendue. Veuillez rafraîchir la page.'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => window.location.reload()}
                style={{ padding: '9px 18px', borderRadius: 10, background: '#40916C', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Rafraîchir la page
              </button>
              <button
                onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
                style={{ padding: '9px 18px', borderRadius: 10, background: 'transparent', color: '#6B7B6E', border: '1px solid rgba(27,67,50,0.2)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Se reconnecter
              </button>
            </div>
            {import.meta.env.DEV && (
              <pre style={{ marginTop: 16, fontSize: 10, color: '#9CA3AF', whiteSpace: 'pre-wrap', background: '#f9f9f9', padding: 10, borderRadius: 8, maxHeight: 200, overflowY: 'auto' }}>
                {this.state.error?.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
