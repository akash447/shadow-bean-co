import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import './index.css'
import App from './App.tsx'

// Global error handler for uncaught errors (safe — no innerHTML injection)
window.onerror = () => {
  const div = document.createElement('div');
  div.style.cssText = 'padding:20px;font-family:sans-serif;text-align:center;margin-top:60px';
  div.innerHTML = '<h1>Something went wrong</h1><p>Please reload the page.</p><button onclick="window.location.reload()">Reload</button>';
  document.body.replaceChildren(div);
};

// Configure AWS Amplify with Gen2 format
try {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: 'ap-south-1_jZV6770zJ',
        userPoolClientId: '42vpa5vousikig0c4ohq2vmkge',
        signUpVerificationMethod: 'code',
        loginWith: {
          email: true,
          oauth: {
            domain: 'shadowbeanco.auth.ap-south-1.amazoncognito.com',
            scopes: ['openid', 'email', 'profile'],
            redirectSignIn: ['https://shadowbeanco.net', 'https://www.shadowbeanco.net', 'http://localhost:5173'],
            redirectSignOut: ['https://shadowbeanco.net', 'https://www.shadowbeanco.net', 'http://localhost:5173'],
            responseType: 'code' as const,
            providers: ['Google'],
          },
        },
      },
    },
  });
} catch (error) {
  console.error('Amplify configuration error:', error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
