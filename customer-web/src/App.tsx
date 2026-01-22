import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from './services/supabase'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import AboutPage from './pages/AboutPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import './App.css'

// Component to handle OAuth callback before router processes the URL
function OAuthCallbackHandler({ children }: { children: React.ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Check if the URL hash contains an access_token (implicit flow)
      const hash = window.location.hash;

      if (hash && hash.includes('access_token=')) {
        console.log('OAuth callback detected, processing tokens...');

        try {
          // Parse the hash to extract params
          const params = new URLSearchParams(hash.substring(1)); // Remove the #
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken) {
            // Set the session manually
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (error) {
              console.error('Error setting session:', error);
            } else {
              console.log('OAuth session established:', data.user?.email);
            }
          }
        } catch (err) {
          console.error('Error processing OAuth callback:', err);
        }

        // Clean the URL - redirect to home or the intended path
        window.history.replaceState({}, '', window.location.pathname + '#/');
      }

      setIsProcessing(false);
    };

    handleOAuthCallback();
  }, []);

  if (isProcessing) {
    // Show loading while processing OAuth
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#1a1a2e',
        color: '#e8d5b7'
      }}>
        <div>Processing login...</div>
      </div>
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <OAuthCallbackHandler>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </OAuthCallbackHandler>
  )
}

export default App
