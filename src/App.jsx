import React, { useState } from 'react'
import Dashboard from './components/Dashboard.jsx'

export default function App() {
  const [user, setUser] = useState({ name: 'You' })
  return <Dashboard user={user} onUserUpdate={setUser} />
}
