import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Handle OAuth callback BEFORE React mounts
// This prevents any Supabase initialization issues from interfering
(function handleOAuthBeforeMount() {
  const hash = window.location.hash;

  // Check for OAuth implicit flow tokens in hash
  if (hash && hash.includes('access_token=') && !hash.includes('#/')) {
    console.log('[Main] OAuth callback detected, processing before React mount...');

    try {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const expiresIn = params.get('expires_in');

      if (accessToken) {
        // Store tokens in localStorage for Supabase to pick up
        const expiresAt = Math.floor(Date.now() / 1000) + parseInt(expiresIn || '3600');
        const sessionData = {
          access_token: accessToken,
          refresh_token: refreshToken || '',
          expires_in: parseInt(expiresIn || '3600'),
          expires_at: expiresAt,
        };

        // Supabase localStorage key format
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const match = supabaseUrl.match(/\/\/([^.]+)\./);
        const projectRef = match ? match[1] : 'supabase';
        const storageKey = `sb-${projectRef}-auth-token`;

        localStorage.setItem(storageKey, JSON.stringify(sessionData));
        console.log('[Main] OAuth tokens stored, redirecting to home...');

        // Redirect to clean URL - this happens before React renders
        window.location.replace(window.location.pathname + '#/');
        // Stop execution - the page will reload
        throw new Error('OAUTH_REDIRECT');
      }
    } catch (err: any) {
      if (err?.message === 'OAUTH_REDIRECT') {
        // Expected - just stop execution
        return;
      }
      console.error('[Main] OAuth processing error:', err);
    }
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

