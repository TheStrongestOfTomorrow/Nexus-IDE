import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handling for PWA/Monaco worker issues
window.addEventListener('unhandledrejection', (event) => {
  // Suppress benign "isTrusted: true" rejections which are usually non-critical browser events
  const reason = event.reason;
  if (reason && typeof reason === 'object' && reason.isTrusted) {
    event.preventDefault();
    return;
  }
  // Also check if the event itself is the reason (sometimes happens with some libs)
  if (event.isTrusted && !reason) {
    event.preventDefault();
    return;
  }
  // Suppress generic script errors
  if (reason && reason.message === 'Script error.') {
    event.preventDefault();
    return;
  }
  console.error('Unhandled Rejection:', reason);
});

window.addEventListener('error', (event) => {
  // Suppress benign "isTrusted: true" errors which are usually non-critical browser events
  const error = event.error;
  if (error && typeof error === 'object' && error.isTrusted) {
    event.preventDefault();
    return;
  }
  if (event.isTrusted && !error) {
    event.preventDefault();
    return;
  }
  // Suppress generic script errors
  if (event.message === 'Script error.') {
    event.preventDefault();
    return;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
