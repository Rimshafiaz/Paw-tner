import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

function AdopterDashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold from-[#FF8C42] to-[#FE8B02] text-transparent bg-clip-text bg-gradient-to-br">
            Welcome back {currentUser?.name} ❤️
          </h1>
          <p className="text-gray-600 mt-2">
            Ready to find your perfect companion? Let's explore available pets.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 group cursor-pointer"
              onClick={() => navigate('/adopter/home')}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-adopter-primary transition-colors duration-200">Browse Pets</h3>
              <p className="text-gray-600 text-sm mb-4">
                Discover pets that match your preferences
              </p>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  navigate('/adopter/home')
                }}
                className="w-full bg-adopter-primary text-white py-2 px-4 rounded-lg hover:bg-adopter-primary/80 hover:shadow-md transition-all duration-200"
              >
                Start Browsing
              </button>
            </div>

            <div 
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 group cursor-pointer"
              onClick={() => navigate('/adopter/favorites')}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-5.5 group-hover:text-adopter-secondary transition-colors duration-200 ">My Favorites</h3>
              <p className="text-gray-600 text-sm mb-4">
                View pets you've saved
              </p>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  navigate('/adopter/favorites')
                }}
                className="w-full bg-adopter-secondary text-white py-2 px-4 rounded-lg hover:bg-adopter-secondary/80 hover:shadow-md transition-all duration-200"
              >
                View Favorites
              </button>
            </div>
            
            <div 
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 group cursor-pointer"
              onClick={() => navigate('/adopter/perfect-pawtner')}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-adopter-tertiary transition-colors duration-200">Perfect Paw-tner</h3>
              <p className="text-gray-600 text-sm mb-4">
                Find pets that match your preferences
              </p>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  navigate('/adopter/perfect-pawtner')
                }}
                className="w-full bg-adopter-tertiary text-white py-2 px-4 rounded-lg hover:bg-adopter-tertiary/80 hover:shadow-md transition-all duration-200"
              >
                Find Matches
              </button>
            </div>
            
            

            <div 
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 group cursor-pointer"
              onClick={() => navigate('/adopter/profile')}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-adopter-fourth transition-colors duration-200">My Preferences</h3>
              <p className="text-gray-600 text-sm mb-4">
                Update your pet adoption preferences
              </p>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  navigate('/adopter/profile')
                }}
                className="w-full bg-adopter-fourth text-white py-2 px-4 rounded-lg hover:bg-adopter-fourth/80 hover:shadow-md transition-all duration-200"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
  )
}

export default AdopterDashboard