import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function ProtectedRoute({ children, requiredRole = null }) {
  const { isLoggedIn, currentUser, isLoading } = useAuth()
  const location = useLocation()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  if (requiredRole && currentUser?.userType !== requiredRole) {
    const redirectPath = currentUser?.userType === 'shelter' ? '/shelter/dashboard' : '/dashboard'
    return <Navigate to={redirectPath} replace />
  }
  
  return children
}

export default ProtectedRoute