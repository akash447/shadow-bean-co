import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import './index.css'
import App from './App.tsx'

// Global error handler for uncaught errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', { message, source, lineno, colno, error });
  document.body.innerHTML = `<div style="padding: 20px; font-family: sans-serif;">
    <h1>Application Error</h1>
    <p style="color: red;">${message}</p>
    <p>Source: ${source}:${lineno}:${colno}</p>
    <button onclick="window.location.reload()">Reload</button>
  </div>`;
};

// Configure AWS Amplify with Gen2 format
try {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: 'ap-south-1_jZV6770zJ',
        userPoolClientId: '42vpa5vousikig0c4ohq2vmkge',
        identityPoolId: 'ap-south-1:5dd67b93-9e3c-4de3-a74f-2df439437bbd',
        signUpVerificationMethod: 'code',
        loginWith: {
          email: true,
          oauth: {
            domain: 'shadowbeanco.auth.ap-south-1.amazoncognito.com',
            scopes: ['openid', 'email', 'profile'],
            redirectSignIn: ['https://shadowbeanco.net', 'http://localhost:5173'],
            redirectSignOut: ['https://shadowbeanco.net', 'http://localhost:5173'],
            responseType: 'code' as const,
            providers: [{ custom: 'Google' }],
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
