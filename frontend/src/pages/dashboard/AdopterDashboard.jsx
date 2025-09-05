import ProtectedRoute from '../../components/ProtectedRoute'
import { useAuth } from '../../contexts/AuthContext'

function AdopterDashboard() {
  const { user } = useAuth()

  return (
    <ProtectedRoute requireRole="adopter">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.full_name}! ❤️
            </h1>
            <p className="text-gray-600 mt-2">
              Ready to find your perfect companion? Let's explore available pets.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Browse Pets</h3>
              <p className="text-gray-600 text-sm mb-4">
                Discover pets that match your preferences
              </p>
              <button className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90">
                Start Browsing
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Matches</h3>
              <p className="text-gray-600 text-sm mb-4">
                Get personalized pet recommendations
              </p>
              <button className="w-full bg-secondary text-white py-2 px-4 rounded-lg hover:bg-secondary/90">
                View Matches
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">My Favorites</h3>
              <p className="text-gray-600 text-sm mb-4">
                View pets you've saved
              </p>
              <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700">
                View Favorites
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default AdopterDashboard