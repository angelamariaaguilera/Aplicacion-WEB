import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'

// Orden de carga: reset -> variables -> layout -> componentes -> formularios -> tablas
import './styles/reset.css'
import './styles/variables.css'
import './styles/global.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/forms.css'
import './styles/tables.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)