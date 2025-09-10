import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import adopterPawtnerImage from '../../assets/adopter paw-tner.jpg'

function AdopterDashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  
  // Get current date for a personalized greeting
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  // Pet-related quotes that rotate or use a fixed one
  const petQuotes = [
    "Saving one pet won't change the world, but it will change the world for that one pet.",
    "Pets leave paw prints forever on our hearts.",
    "The best things in life are rescued.",
    "Adopt, don't shop - change a life today!"
  ]

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 248, 240, 0.85), rgba(240, 255, 248, 0.85)), url(${adopterPawtnerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Header Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <span className="text-6xl animate-bounce">🏠</span>
            <span className="text-6xl animate-pulse mx-4">💕</span>
            <span className="text-6xl animate-bounce">🐾</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] mb-4 drop-shadow-lg">
            Welcome back, {currentUser?.name || 'Friend'}! 
          </h1>
          <p className="text-lg text-gray-700 mb-2 font-medium">
            {currentDate}
          </p>
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-4 max-w-2xl mx-auto border-2 border-yellow-200">
            <p className="text-gray-700 italic">
              "🌟 {petQuotes[0]} 🌟"
            </p>
          </div>
        </div>

        {/* Dashboard Cards Grid - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Browse Pets Card */}
          <div 
            className="bg-gradient-to-br from-white to-pink-50 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 border-2 border-pink-200 group relative overflow-hidden"
            onClick={() => navigate('/adopter/home')}
          >
            <div className="absolute -top-2 -right-2 text-4xl opacity-20">🐕</div>
            <div className="text-center mb-4 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                <span className="text-3xl text-white">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-pink-600 transition-colors duration-200">Browse Pets</h3>
              <p className="text-gray-600 text-sm">
                Discover all available pets waiting for their forever home
              </p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                navigate('/adopter/home')
              }}
              className="w-full bg-gradient-to-r from-pink-400 to-red-500 text-white py-3 px-4 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-pink-300 relative z-10"
            >
              🐕 Start Browsing
            </button>
          </div>

          {/* Favorites Card */}
          <div 
            className="bg-gradient-to-br from-white to-blue-50 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 border-2 border-blue-200 group relative overflow-hidden"
            onClick={() => navigate('/adopter/favorites')}
          >
            <div className="absolute -top-2 -right-2 text-4xl opacity-20">💖</div>
            <div className="text-center mb-4 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                <span className="text-3xl text-white">💖</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-200">My Favorites</h3>
              <p className="text-gray-600 text-sm">
                View all the pets you've saved for future consideration
              </p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                navigate('/adopter/favorites')
              }}
              className="w-full bg-gradient-to-r from-blue-400 to-purple-500 text-white py-3 px-4 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-blue-300 relative z-10"
            >
              🌟 View Favorites
            </button>
          </div>

          {/* Perfect Paw-tner Card */}
          <div 
            className="bg-gradient-to-br from-white to-green-50 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 border-2 border-green-200 group relative overflow-hidden"
            onClick={() => navigate('/adopter/perfect-pawtner')}
          >
            <div className="absolute -top-2 -right-2 text-4xl opacity-20">✨</div>
            <div className="text-center mb-4 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                <span className="text-3xl text-white">✨</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors duration-200">Perfect Paw-tner</h3>
              <p className="text-gray-600 text-sm">
                Find pets that perfectly match your preferences
              </p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                navigate('/adopter/perfect-pawtner')
              }}
              className="w-full bg-gradient-to-r from-green-400 to-teal-500 text-white py-3 px-4 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-green-300 relative z-10"
            >
              🎯 Find Matches
            </button>
          </div>

          {/* Preferences Card */}
          <div 
            className="bg-gradient-to-br from-white to-yellow-50 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 border-2 border-yellow-200 group relative overflow-hidden"
            onClick={() => navigate('/adopter/profile')}
          >
            <div className="absolute -top-2 -right-2 text-4xl opacity-20">⚙️</div>
            <div className="text-center mb-4 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                <span className="text-3xl text-white">⚙️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-yellow-600 transition-colors duration-200">My Preferences</h3>
              <p className="text-gray-600 text-sm">
                Update your pet adoption preferences and settings
              </p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                navigate('/adopter/profile')
              }}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 px-4 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-yellow-300 relative z-10"
            >
              🎨 Edit Profile
            </button>
          </div>
        </div>

        {/* Helpful Tips Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 mb-8 shadow-xl border-2 border-blue-200">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6 flex items-center justify-center">
            <span className="mr-2">💡</span>
            Helpful Adoption Tips
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-5 text-center border-2 border-pink-200">
              <div className="text-3xl mb-3">🏠</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Prepare Your Home</h3>
              <p className="text-sm text-gray-600">
                Pet-proof your space and gather essential supplies before bringing your new friend home
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 text-center border-2 border-green-200">
              <div className="text-3xl mb-3">⏰</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Be Patient</h3>
              <p className="text-sm text-gray-600">
                It takes time for pets to adjust to new environments. Give them space and time to feel comfortable
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 text-center border-2 border-blue-200">
              <div className="text-3xl mb-3">❤️</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Consider Lifestyle</h3>
              <p className="text-sm text-gray-600">
                Choose a pet whose energy level and needs match your daily routine and living situation
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-3xl p-8 text-center border-2 border-pink-200 shadow-xl">
          <span className="text-4xl mb-4 block">🐾</span>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Meet Your New Best Friend?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Every adoption journey starts with a single step. Whether you're ready to browse or still exploring, 
            we're here to help you find the perfect companion!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/adopter/home')}
              className="bg-gradient-to-r from-pink-400 to-red-500 text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-pink-300"
            >
              🐕 Start Browsing Pets
            </button>
            <button
              onClick={() => navigate('/adopter/perfect-pawtner')}
              className="bg-gradient-to-r from-purple-400 to-blue-500 text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-purple-300"
            >
              ✨ Get Personalized Matches
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdopterDashboard