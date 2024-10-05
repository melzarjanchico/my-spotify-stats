import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import CallbackPage from './pages/callback'
import HomePage from './pages/home'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CallbackPage />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="/home" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
