import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { isLoggedIn, currentUser, logout } = useAuth()
  
  const isShelterPage = location.pathname.includes('/shelter') || currentUser?.userType === 'shelter'
  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          
          <Link to="/" className="flex items-center">
            <span className="text-2xl" style={{color: '#FF8C42'}}>🐾</span>
            <span className="ml-2 text-xl font-bold text-gray-800">Paw-tner</span>
          </Link>

         
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/about" className="text-gray-600 hover:bg-gradient-to-r hover:from-[#FF5733] hover:to-[#00FFEA] hover:bg-clip-text hover:text-transparent font-medium transition-all duration-200">
              About
            </Link>
            <Link to={currentUser?.userType==='adopter'? 'adopter/home':'/'} className="text-gray-600 hover:bg-gradient-to-r hover:from-[#FF5733] hover:to-[#00FFEA] hover:bg-clip-text hover:text-transparent font-medium transition-all duration-200">
              Home
            </Link>
            
            
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to={
                    currentUser?.userType === 'shelter' ? '/shelter/dashboard' 
                    : currentUser?.userType === 'admin' ? '/admin/dashboard'
                    : '/adopter/dashboard'
                  } 
                  className="text-gray-600 hover:bg-gradient-to-r hover:from-[#FF5733] hover:to-[#00FFEA] hover:bg-clip-text hover:text-transparent font-medium transition-all duration-200"
                >
                  Dashboard
                </Link>
                <span className={
                  currentUser.userType === 'shelter' ? "text-secondary font-normal" 
                  : currentUser.userType === 'admin' ? "text-purple-600 font-normal"
                  : "text-primary font-normal"
                }>
                  Welcome {currentUser?.name || currentUser?.email || 'User'}
                </span>
                <button 
                  onClick={logout}
                  className="text-gray-600 hover:bg-gradient-to-r hover:from-[#FF5733] hover:to-[#00FFEA] hover:bg-clip-text hover:text-transparent font-medium transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:bg-gradient-to-r hover:from-[#FF5733] hover:to-[#00FFEA] hover:bg-clip-text hover:text-transparent font-medium transition-all duration-200">
                  Log In
                </Link>
                <Link 
                  to="/register" 
                  className="bg-gradient-to-r from-[#FF5733] to-[#00FFEA] text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`text-white p-2 rounded-2xl hover:scale-105 transition-all duration-200 shadow-lg border-2 ${
                isShelterPage 
                  ? 'bg-gradient-to-r from-secondary to-secondary/80 border-secondary/30' 
                  : 'bg-gradient-to-r from-pink-400 to-purple-500 border-pink-300'
              }`}
            >
              <span className="text-lg">
                {isMobileMenuOpen ? '✖️' : '📱'}
              </span>
            </button>
          </div>
        </div>
        
        
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className={`px-4 pt-4 pb-6 space-y-3 border-t-2 rounded-b-3xl shadow-xl ${
              isShelterPage 
                ? 'bg-gradient-to-br from-teal-50 to-secondary/10 border-secondary/30' 
                : 'bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200'
            }`}>
              <Link 
                to="/about" 
                className={`block px-4 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-md border-2 ${
                  isShelterPage 
                    ? 'bg-gradient-to-r from-teal-100 to-secondary/20 text-secondary border-secondary/30'
                    : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-600 border-blue-200'
                }`}
                
                onClick={() => setIsMobileMenuOpen(false)}
              >
                📖 About
              </Link>
              <Link 
                to={currentUser?.userType==='adopter'? 'adopter/home':'/'} 
                className={`block px-4 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-md border-2 ${
                  isShelterPage 
                    ? 'bg-gradient-to-r from-teal-100 to-secondary/20 text-secondary border-secondary/30'
                    : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-600 border-green-200'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🏠 Home
              </Link>
              
              {isLoggedIn ? (
                <>
                  <Link 
                    to={
                      currentUser?.userType === 'shelter' ? '/shelter/dashboard' 
                      : currentUser?.userType === 'admin' ? '/admin/dashboard'
                      : '/adopter/dashboard'
                    }
                    className={`block px-4 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-md border-2 ${
                      isShelterPage 
                        ? 'bg-gradient-to-r from-teal-100 to-secondary/20 text-secondary border-secondary/30'
                        : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 border-purple-200'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    📊 Dashboard
                  </Link>
                  <div className={`px-4 py-2 rounded-2xl border-2 ${
                    isShelterPage 
                      ? 'bg-gradient-to-r from-teal-50 to-secondary/10 border-secondary/30'
                      : 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-200'
                  }`}>
                    <span className={
                      currentUser.userType === 'shelter' ? "text-secondary font-bold text-sm" 
                      : currentUser.userType === 'admin' ? "text-purple-600 font-bold text-sm"
                      : "text-primary font-bold text-sm"
                    }>
                      👋 Welcome {currentUser?.name || currentUser?.email || 'User'}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      logout()
                      setIsMobileMenuOpen(false)
                    }}
                    className={`block w-full px-4 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-md border-2 ${
                      isShelterPage 
                        ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-600 border-red-200'
                        : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-600 border-red-200'
                    }`}
                  >
                    🚪 Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className={`block px-4 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-md border-2 ${
                      isShelterPage 
                        ? 'bg-gradient-to-r from-teal-100 to-secondary/20 text-secondary border-secondary/30'
                        : 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-600 border-blue-200'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    🔑 Log In
                  </Link>
                  <Link 
                    to="/register" 
                    className={`block px-4 py-3 text-white rounded-2xl font-bold text-center hover:scale-105 transition-all duration-200 shadow-lg border-2 ${
                      isShelterPage 
                        ? 'bg-gradient-to-r from-secondary to-secondary/80 border-secondary/30'
                        : 'bg-gradient-to-r from-orange-400 to-pink-500 border-orange-300'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    ✨ Sign Up
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