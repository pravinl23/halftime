import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Login from './pages/Login'
import Home from './pages/Home'
import Profile from './pages/Profile'

export default function App() {
  const [userId, setUserId] = useState<string | null>(null)

  if (!userId) {
    return <Login onLogin={setUserId} />
  }

  return (
    <Routes>
      <Route path="/" element={<Home userId={userId} />} />
      <Route path="/profile" element={<Profile userId={userId} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

