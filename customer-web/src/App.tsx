import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AssetProvider } from './contexts/AssetContext'
import { YetiProvider } from './components/YetiMascot'
import HomePage from './pages/HomePage'
import ChatWidget from './components/chat'
import './App.css'
import { Component, lazy, Suspense } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

const ShopPage = lazy(() => import('./pages/ShopPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))

// Error Boundary to catch React errors
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p style={{ color: '#666' }}>An unexpected error occurred. Please reload the page.</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '10px 24px', cursor: 'pointer' }}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AssetProvider>
        <AuthProvider>
          <YetiProvider>
            <BrowserRouter>
              <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="loading-spinner" /></div>}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                </Routes>
              </Suspense>
              <ChatWidget />
            </BrowserRouter>
          </YetiProvider>
        </AuthProvider>
      </AssetProvider>
    </ErrorBoundary>
  )
}

export default App

