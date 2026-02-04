import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import './index.css'
import App from './App.tsx'
import amplifyconfig from './amplifyconfiguration.json'

// Configure AWS Amplify - same backend as customer-web
Amplify.configure(amplifyconfig)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
