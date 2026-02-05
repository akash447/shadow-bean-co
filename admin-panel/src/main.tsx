import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import './index.css'
import App from './App.tsx'

// Configure AWS Amplify with Gen2 format - same backend as customer-web
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'ap-south-1_jZV6770zJ',
      userPoolClientId: '42vpa5vousikig0c4ohq2vmkge',
      identityPoolId: 'ap-south-1:5dd67b93-9e3c-4de3-a74f-2df439437bbd',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
