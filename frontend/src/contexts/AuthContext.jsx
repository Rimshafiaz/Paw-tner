import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const login = (userData, accessToken) => {
    if (accessToken) {
      localStorage.setItem('auth_token', accessToken)
    }
    setIsLoggedIn(true)
    setCurrentUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setIsLoggedIn(false)
    setCurrentUser(null)
    window.location.href = '/'
  }

  const verifyStoredToken = async () => {
    const savedToken = localStorage.getItem('auth_token')
    
    if (!savedToken) {
      setIsLoggedIn(false)
      setIsLoading(false)
      return
    }
    
    try {
      const tokenParts = savedToken.split('.')
      const payload = JSON.parse(atob(tokenParts[1]))
      const userId = payload.user_id
      const userType = payload.user_type
      
      const endpoint = userType === 'shelter' 
        ? `http://localhost:8000/shelters/${userId}/stats`
        : `http://localhost:8000/users/${userId}`
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsLoggedIn(true)
        
        if (userType === 'shelter') {
          setCurrentUser({
            name: data.shelter_name,
            email: payload.email,
            userType: 'shelter',
            allUserData: { ...payload, shelter_name: data.shelter_name }
          })
        } else {
          setCurrentUser({
            name: data.full_name || data.name || data.email,
            email: data.email,
            userType: data.role || 'adopter',
            allUserData: data
          })
        }
      } else {
        localStorage.removeItem('auth_token')
        setIsLoggedIn(false)
      }
    } catch (error) {
      localStorage.removeItem('auth_token')
      setIsLoggedIn(false)
    }
    
    setIsLoading(false)
  }

  useEffect(() => {
    verifyStoredToken()
  }, [])

  const value = {
    isLoggedIn,
    currentUser,
    isLoading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}