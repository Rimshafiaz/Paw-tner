import ProtectedRoute from '../../components/ProtectedRoute'
import { useAuth } from '../../contexts/AuthContext'

function ShelterDashboard() {
  const { user } = useAuth()

  return (
    <ProtectedRoute requireRole="shelter">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name}! 🏠
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your shelter and help pets find loving homes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Add New Pet</h3>
              <p className="text-gray-600 text-sm mb-4">
                List a new pet for adoption
              </p>
              <button className="w-full bg-secondary text-white py-2 px-4 rounded-lg hover:bg-secondary/90">
                Add Pet
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Manage Pets</h3>
              <p className="text-gray-600 text-sm mb-4">
                View and edit your pet listings
              </p>
              <button className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90">
                Manage Pets
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Analytics</h3>
              <p className="text-gray-600 text-sm mb-4">
                View shelter performance metrics
              </p>
              <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700">
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default ShelterDashboard