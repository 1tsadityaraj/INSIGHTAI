import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Suppress non-critical worker.js errors from Vite HMR
// These are unhandled promise rejections from HMR WebSocket connections
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason?.toString() || event.reason?.message || ''
  const stack = event.reason?.stack || ''
  
  // Suppress Vite HMR worker connection errors (harmless)
  if (
    error.includes('worker.js') ||
    stack.includes('worker.js') ||
    (error.includes('Failed to fetch') && (stack.includes('worker') || error.includes('worker')))
  ) {
    event.preventDefault() // Prevent default error logging
    return
  }
})

// Suppress console errors for worker.js
const originalError = console.error
console.error = (...args) => {
  const message = args.join(' ')
  if (message.includes('worker.js') || 
      (message.includes('Failed to fetch') && message.includes('worker'))) {
    return // Suppress these errors
  }
  originalError.apply(console, args)
}

// Suppress error events that might bubble up
window.addEventListener('error', (event) => {
  const message = event.message || ''
  const filename = event.filename || ''
  if (filename.includes('worker.js') || message.includes('worker.js')) {
    event.preventDefault()
    return false
  }
}, true)

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

console.log("Main.jsx: Mounting App...", rootElement);
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
