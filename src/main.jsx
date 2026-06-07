import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── OneSignal Init ──────────────────────────────────────────────
window.OneSignalDeferred = window.OneSignalDeferred || [];
window.OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: "fb68e5d0-9f79-4da9-9d12-e7e49bfbb6df",
    safari_web_id: "web.onesignal.auto.fb68e5d0-9f79-4da9-9d12-e7e49bfbb6df",
    notifyButton: { enable: false },
    allowLocalhostAsSecureOrigin: true,
  });
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
