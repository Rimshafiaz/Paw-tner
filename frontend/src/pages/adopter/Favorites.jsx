import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBanner from '../../components/NotificationBanner'
import adopterPawtnerImage from '../../assets/adopter paw-tner.jpg'

function Favorites() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ message: '', type: '', show: false })
  const [removingFavorite, setRemovingFavorite] = useState({})

  const showNotification = (message, type) => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification({ message: '', type: '', show: false })
    }, 5000)
  }

  useEffect(() => {
    fetchFavorites()
  }, [currentUser])

  // Refetch favorites when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchFavorites()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [currentUser])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const userId = currentUser?.allUserData?.id
      const token = localStorage.getItem('auth_token')
      
      if (!userId || !token) {
        showNotification('Please log in to view favorites', 'error')
        navigate('/login')
        return
      }

      const response = await fetch(`http://localhost:8000/users/${userId}/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const favoritesData = await response.json()
        const favoritesArray = Array.isArray(favoritesData) ? favoritesData : (favoritesData.favorites || [])
        setFavorites(favoritesArray)
      } else if (response.status === 401 || response.status === 403) {
        showNotification('Please log in again', 'error')
        navigate('/login')
      } else {
        showNotification('Failed to load favorites', 'error')
        setFavorites([])
      }
    } catch (error) {
      showNotification('Network error. Please try again.', 'error')
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (petId) => {
    try {
      setRemovingFavorite(prev => ({ ...prev, [petId]: true }))
      const userId = currentUser?.allUserData?.id
      
      const response = await fetch(`http://localhost:8000/users/${userId}/favorites/${petId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        setFavorites(prev => prev.filter(fav => (fav.pet_id || fav.id) !== petId))
        showNotification('Removed from favorites', 'success')
      } else {
        showNotification('Failed to remove favorite', 'error')
      }
    } catch (error) {
      showNotification('Network error', 'error')
    } finally {
      setRemovingFavorite(prev => ({ ...prev, [petId]: false }))
    }
  }

  const getImageUrl = (photoUrl) => {
    if (!photoUrl) return null
    return photoUrl.startsWith('http') ? photoUrl : `http://localhost:8000${photoUrl}`
  }

  const formatAge = (years, months) => {
    if (years && months) {
      return `${years} ${years === 1 ? 'year' : 'years'}, ${months} ${months === 1 ? 'month' : 'months'}`
    } else if (years) {
      return `${years} ${years === 1 ? 'year' : 'years'} old`
    } else if (months) {
      return `${months} ${months === 1 ? 'month' : 'months'} old`
    }
    return 'Age unknown'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        backgroundImage: `linear-gradient(rgba(255, 248, 240, 0.85), rgba(240, 255, 248, 0.85)), url(${adopterPawtnerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading your favorites... 💖</p>
        </div>
      </div>
    )
  }

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
        <NotificationBanner 
          notification={notification} 
          onClose={() => setNotification({ message: '', type: '', show: false })}
        />

        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <span className="text-6xl animate-bounce">💖</span>
            <span className="text-6xl animate-pulse mx-4">⭐</span>
            <span className="text-6xl animate-bounce">🌟</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] mb-4 drop-shadow-lg animate-pulse">
            My Favorite Pets
          </h1>
          <p className="text-xl text-gray-700 mb-8 font-medium">
            🌟 Pets you've saved for future consideration 🌟
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/adopter/dashboard')}
            className="bg-gradient-to-r from-purple-400 to-pink-500 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 flex items-center shadow-lg border-2 border-purple-300"
          >
            🏠 ← Back to Dashboard
          </button>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl text-gray-300 mb-6">💔</div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">No favorites yet 😢</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Start exploring and save pets you're interested in. They'll appear here for easy access.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/adopter/home')}
                className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-primary"
              >
                🐕 Browse Pets
              </button>
              <button
                onClick={() => navigate('/adopter/perfect-pawtner')}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-gray-400"
              >
                ✨ Find Perfect Paw-tner
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl px-4 py-2 border-2 border-green-200">
                <span className="text-emerald-600 font-bold">
                  💖 You have {favorites.length} favorite {favorites.length === 1 ? 'pet' : 'pets'}
                </span>
              </div>
              <button
                onClick={() => navigate('/adopter/home')}
                className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-4 py-2 rounded-2xl font-medium hover:scale-105 transition-all duration-200 shadow-lg border-2 border-blue-300"
              >
                🐕 Browse More Pets →
              </button>
            </div>
            
            {/* Favorites Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {favorites.map((favorite) => {
                const pet = favorite.pet || favorite
                const petId = favorite.pet_id || favorite.id || pet.id
                
                // Skip rendering if no valid pet ID
                if (!petId) {
                  console.warn('Favorite missing pet ID:', favorite)
                  return null
                }
                
                return (
                  <div 
                    key={petId} 
                    className="bg-gradient-to-br from-white to-pink-50 rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-110 hover:rotate-1 border-2 border-pink-200"
                    onClick={() => navigate(`/pets/${petId}`)}
                  >
                    <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                      {pet.primary_photo_url ? (
                        <img
                          src={getImageUrl(pet.primary_photo_url)}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400 text-6xl">🐾</div>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFavorite(petId)
                        }}
                        disabled={removingFavorite[petId]}
                        className="absolute top-3 right-3 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-110 bg-gradient-to-r from-red-400 to-pink-500 text-white hover:from-red-500 hover:to-pink-600 border-2 border-red-300"
                        title="Remove from favorites"
                      >
                        <span className="text-xl animate-pulse">
                          {removingFavorite[petId] ? '...' : '💔'}
                        </span>
                      </button>
                      
                      <div className={`absolute top-3 left-3 px-3 py-1 rounded-2xl text-xs font-bold ${
                        pet.adoption_status === 'AVAILABLE' || pet.adoption_status === 'available'
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-600 border-2 border-green-200'
                          : pet.adoption_status === 'PENDING' || pet.adoption_status === 'pending'
                          ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-amber-600 border-2 border-yellow-200'
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 border-2 border-gray-200'
                      }`}>
                        {pet.adoption_status === 'AVAILABLE' || pet.adoption_status === 'available' ? '✨ Available!' : pet.adoption_status}
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <div className="text-center mb-3">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">
                          {pet.name} <span className="text-2xl">
                            {pet.pet_type === 'dog' ? '🐕' : pet.pet_type === 'cat' ? '🐱' : pet.pet_type === 'bird' ? '🐦' : pet.pet_type === 'rabbit' ? '🐰' : '🐾'}
                          </span>
                        </h3>
                        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl px-3 py-1 inline-block border border-primary/20">
                          <span className="text-sm text-primary font-bold capitalize">{pet.pet_type?.toLowerCase()}</span>
                        </div>
                      </div>
                      
                      <div className="text-center mb-4">
                        <p className="text-gray-600 text-sm font-medium">
                          {pet.breed && `${pet.breed} • `}
                          {formatAge(pet.age_years, pet.age_months)} • 
                          {pet.size} size
                        </p>
                      </div>

                      {favorite.created_at && (
                        <div className="text-center mb-4">
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl px-3 py-1 inline-block border-2 border-blue-200">
                            <span className="text-xs text-blue-600 font-medium">
                              📅 Saved on {new Date(favorite.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl px-4 py-2 border-2 border-green-200">
                          <span className="text-lg font-bold text-emerald-600">
                            {pet.adoption_fee && Number(pet.adoption_fee) > 0 ? `PKR ${Number(pet.adoption_fee)}` : 'FREE! 🎉'}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/pets/${petId}`)
                          }}
                          className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-2xl text-sm font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-primary"
                        >
                          👀 View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom CTA */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 mb-8 shadow-xl border-2 border-blue-200 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Ready to find more? 🧐</h3>
              <p className="text-gray-600 mb-6">
                Explore more pets or get personalized recommendations based on your preferences
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => navigate('/adopter/home')}
                  className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-primary"
                >
                  🐕 Browse All Pets
                </button>
                <button
                  onClick={() => navigate('/adopter/perfect-pawtner')}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-gray-400"
                >
                  ✨ Find Perfect Paw-tner
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Favorites