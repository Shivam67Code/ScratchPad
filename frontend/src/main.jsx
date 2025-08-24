import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route } from 'react-router-dom'
import Home from './components/Home/Home'
import Scratchpad from './Scratchpad'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Home />} >
      <Route path="pad/:id" element={<Scratchpad />} />
    </Route>
  )
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="min-h-screen bg-gray-50">
      <RouterProvider router={router} />
    </div>
  </StrictMode>,
)