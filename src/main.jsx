import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#111', minHeight: '100vh', color: '#fff' }}>
          <h2 style={{ color: '#f87171' }}>Error al cargar la app</h2>
          <pre style={{ color: '#fca5a5', whiteSpace: 'pre-wrap', fontSize: 13 }}>
            {this.state.error.message}
          </pre>
          <pre style={{ color: '#6b7280', whiteSpace: 'pre-wrap', fontSize: 11, marginTop: 12 }}>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
