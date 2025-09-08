import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const { isLoggedIn, currentUser, logout } = useAuth()
  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          
          <Link to="/" className="flex items-center">
            <span className="text-2xl" style={{color: '#FF8C42'}}>🐾</span>
            <span className="ml-2 text-xl font-bold text-gray-800">Paw-tner</span>
          </Link>

         
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/about" className="text-gray-600 hover:text-blue-500 font-medium">
              About
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-blue-500 font-medium">
              Contact
            </Link>
            
            
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to={currentUser?.userType === 'shelter' ? '/shelter/dashboard' : '/dashboard'} 
                  className="text-gray-600 hover:text-blue-500 font-medium"
                >
                  Dashboard
                </Link>
                <span className="text-blue-500 font-normal">
                  Welcome {currentUser?.name || currentUser?.email || 'User'}
                </span>
                <button 
                  onClick={logout}
                  className="text-gray-600 hover:text-blue-500 font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-500 font-medium">
                  Log In
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-400 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-300 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          
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
        
        
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-100">
              <Link 
                to="/about" 
                className="block px-3 py-2 text-gray-600 hover:text-blue-500 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                to="/contact" 
                className="block px-3 py-2 text-gray-600 hover:text-blue-500 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
              
              {isLoggedIn ? (
                <>
                  <Link 
                    to={currentUser?.userType === 'shelter' ? '/shelter/dashboard' : '/dashboard'}
                    className="block px-3 py-2 text-gray-600 hover:text-blue-500 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={() => {
                      logout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="block px-3 py-2 text-gray-600 hover:text-blue-500 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/register" 
                    className="block px-3 py-2 bg-blue-400
                     text-white rounded-lg font-medium mx-3 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar