/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import App from './App'
import { serviceWorkerManager } from './lib/serviceWorker'

// Register service worker
if ('serviceWorker' in navigator) {
  serviceWorkerManager.register().catch(console.error)
}

const root = document.getElementById('root')

render(() => <App />, root!)
