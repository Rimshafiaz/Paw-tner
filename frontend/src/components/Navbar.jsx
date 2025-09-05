import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Step 8a: Get authentication data from our AuthContext
  const { isLoggedIn, currentUser, logout } = useAuth()
  
  // What this line does:
  // - useAuth() calls our custom hook
  // - Gets the current auth data from AuthProvider
  // - isLoggedIn: true/false - is someone logged in?
  // - currentUser: user data or null - who is logged in?
  // - logout: function to log out the user
  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl" style={{color: '#FF8C42'}}>🐾</span>
            <span className="ml-2 text-xl font-bold text-gray-800">Paw-tner</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/about" className="text-gray-600 hover:text-gray-900 font-medium">
              About
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-gray-900 font-medium">
              Contact
            </Link>
            
            {/* Step 8b: Show different content based on login status */}
            {isLoggedIn ? (
              // If someone is logged in, show their info
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  Welcome, {currentUser?.name || currentUser?.email || 'User'}! 👋
                </span>
                <button 
                  onClick={logout}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              // If nobody is logged in, show login/signup buttons
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                  Log In
                </Link>
                <Link 
                  to="/register" 
                  className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
            
            {/* What this conditional does:
                - {isLoggedIn ? (...) : (...)} is a ternary operator
                - If isLoggedIn is true: show welcome message + logout
                - If isLoggedIn is false: show login + signup buttons
                - currentUser?.name uses optional chaining (safe access)
                - If currentUser is null, it won't crash */}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-100">
              <Link 
                to="/about" 
                className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                to="/contact" 
                className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
              
              <Link 
                to="/login" 
                className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link 
                to="/register" 
                className="block px-3 py-2 bg-primary text-white rounded-lg font-medium mx-3 text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar