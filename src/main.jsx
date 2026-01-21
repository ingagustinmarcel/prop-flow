import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './lib/i18nConfig'; // Initialize i18n
import ErrorBoundary from './components/ErrorBoundary';

console.log('Main.jsx executing...');
// Remove this alert after confirming it works
// alert('App Starting...');

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
