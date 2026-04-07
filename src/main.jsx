import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Hub from './Hub.jsx'
import ChatEngine from './engine/ChatEngine.jsx'
import AnalyticsDashboard from './analytics/AnalyticsDashboard.jsx'

// Pulmonary chapter content
import * as conv1 from './content/patho306/pulmonary/conv1.js'
import * as conv2 from './content/patho306/pulmonary/conv2.js'
import * as conv3 from './content/patho306/pulmonary/conv3.js'
import * as conv7 from './content/patho306/pulmonary/conv7.js'
import * as conv8 from './content/patho306/pulmonary/conv8.js'
import * as conv9 from './content/patho306/pulmonary/conv9.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <HashRouter>
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route path="/conv1" element={<ChatEngine key="conv1" {...conv1} />} />
      <Route path="/conv2" element={<ChatEngine key="conv2" {...conv2} />} />
      <Route path="/conv3" element={<ChatEngine key="conv3" {...conv3} />} />
      <Route path="/conv7" element={<ChatEngine key="conv7" {...conv7} />} />
      <Route path="/conv8" element={<ChatEngine key="conv8" {...conv8} />} />
      <Route path="/conv9" element={<ChatEngine key="conv9" {...conv9} />} />
      <Route path="/analytics" element={<AnalyticsDashboard />} />
    </Routes>
  </HashRouter>
)
