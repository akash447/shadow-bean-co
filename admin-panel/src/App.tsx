import { useState, useEffect, useCallback, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Hub } from 'aws-amplify/utils';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/UsersPage';
import { OrdersPage } from './pages/OrdersPage';
import { PricingPage } from './pages/PricingPage';
import { TermsPage } from './pages/TermsPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { ProductsPage } from './pages/ProductsPage';
import { MediaPage } from './pages/MediaPage';
import { AccessPage } from './pages/AccessPage';
import { getSession, isGoogleRedirecting } from './lib/admin-api';
import './index.css';

// Error Boundary to catch render crashes
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          <h2>Something went wrong.</h2>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const { session, error } = await getSession();
      if (error) throw error;
      if (session?.user) {
        setUser(session.user);
        setInitError(null);
      }
    } catch (err: any) {
      // Don't show errors during OAuth callback — token exchange may be in progress
      const isOAuthCallback = window.location.search.includes('code=');
      if (!isOAuthCallback) {
        console.error('Session check failed:', err);
        setInitError(err.message || 'Session check failed');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if this is an OAuth callback (URL has authorization code from Cognito)
    const isOAuthCallback = window.location.search.includes('code=');

    // Set up Hub listener FIRST so we don't miss events
    const hubListener = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
        case 'signInWithRedirect':
          console.log('Auth event:', payload.event);
          // Clean OAuth params from URL
          if (window.location.search.includes('code=')) {
            window.history.replaceState({}, '', window.location.pathname);
          }
          checkSession();
          break;
        case 'signedOut':
          if (isGoogleRedirecting) break;
          setUser(null);
          setLoading(false);
          break;
        case 'signInWithRedirect_failure':
          console.error('OAuth redirect failed:', payload);
          setLoading(false);
          break;
      }
    });

    if (isOAuthCallback) {
      // OAuth callback: Amplify processes ?code= asynchronously.
      // Try after 1.5s (fast case) and 5s (safety net).
      const timer1 = setTimeout(() => {
        console.log('OAuth: trying checkSession (1.5s)');
        checkSession();
      }, 1500);
      const timer2 = setTimeout(() => {
        console.log('OAuth: trying checkSession (5s fallback)');
        checkSession();
      }, 5000);
      return () => { hubListener(); clearTimeout(timer1); clearTimeout(timer2); };
    } else {
      // Normal page load: check for existing session immediately
      checkSession();
      return () => hubListener();
    }
  }, [checkSession]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f7f3ed',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div>Loading Admin Panel...</div>
        {initError && <div style={{ color: 'red', fontSize: '12px' }}>{initError}</div>}
      </div>
    );
  }

  if (initError && !user) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>Initialization Error</h2>
        <p style={{ color: 'red' }}>{initError}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: 20 }}>
          Retry
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<Login onLogin={setUser} />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="app-container">
          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>

          {/* Sidebar Overlay */}
          <div
            className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          />

          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/access" element={<AccessPage />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
