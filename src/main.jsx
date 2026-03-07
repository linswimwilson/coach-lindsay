import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Hub from './Hub.jsx'
import Conv1 from './conversations/conv1.jsx'
import Conv2 from './conversations/conv2.jsx'
import Conv3 from './conversations/conv3.jsx'
import Conv7 from './conversations/conv7.jsx'
import Conv8 from './conversations/conv8.jsx'
import Conv9 from './conversations/conv9.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <HashRouter>
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route path="/conv1" element={<Conv1 />} />
      <Route path="/conv2" element={<Conv2 />} />
      <Route path="/conv3" element={<Conv3 />} />
      <Route path="/conv7" element={<Conv7 />} />
      <Route path="/conv8" element={<Conv8 />} />
      <Route path="/conv9" element={<Conv9 />} />
    </Routes>
  </HashRouter>
)
