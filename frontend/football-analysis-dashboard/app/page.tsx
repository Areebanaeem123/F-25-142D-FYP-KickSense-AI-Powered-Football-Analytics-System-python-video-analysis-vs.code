'use client'

import React, { useState, useEffect } from 'react'
import Login from '../src/pages/Login'
import SignUp from '../src/pages/SignUp'
import Dashboard from '../src/pages/Dashboard'
import '../src/styles/global.css'

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentPage, setCurrentPage] = useState('login')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const auth = localStorage.getItem('kicksense-auth') === 'true'
    setIsAuthenticated(auth)
    if (auth) {
      setCurrentPage('dashboard')
    }
  }, [])

  const handleLogin = () => {
    localStorage.setItem('kicksense-auth', 'true')
    setIsAuthenticated(true)
    setCurrentPage('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('kicksense-auth')
    setIsAuthenticated(false)
    setCurrentPage('login')
  }

  const handleSignUp = () => {
    localStorage.setItem('kicksense-auth', 'true')
    setIsAuthenticated(true)
    setCurrentPage('dashboard')
  }

  if (!mounted) return null

  return (
    <>
      {currentPage === 'login' && (
        <Login onLogin={handleLogin} onSignUpClick={() => setCurrentPage('signup')} />
      )}
      {currentPage === 'signup' && (
        <SignUp onLogin={handleSignUp} onLoginClick={() => setCurrentPage('login')} />
      )}
      {currentPage === 'dashboard' && <Dashboard onLogout={handleLogout} />}
    </>
  )
}
