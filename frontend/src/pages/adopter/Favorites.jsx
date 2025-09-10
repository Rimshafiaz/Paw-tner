import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBanner from '../../components/NotificationBanner'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your favorites...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NotificationBanner 
          notification={notification} 
          onClose={() => setNotification({ message: '', type: '', show: false })}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold from-[#FF8C42] to-[#FE8B02] text-transparent bg-clip-text bg-gradient-to-br">My Favorite Pets</h1>
          <p className="text-gray-600 mt-2">
            Pets you've saved for future consideration
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={() => navigate('/adopter/dashboard')}
            className="flex items-center text-primary hover:text-primary/80 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl text-gray-300 mb-6">💔</div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">No favorites yet</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Start exploring and save pets you're interested in. They'll appear here for easy access.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/adopter/home')}
                className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/80 transition-colors"
              >
                Browse Pets
              </button>
              <button
                onClick={() => navigate('/adopter/perfect-pawtner')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Find Perfect Paw-tner
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                You have {favorites.length} favorite {favorites.length === 1 ? 'pet' : 'pets'}
              </p>
              <button
                onClick={() => navigate('/adopter/home')}
                className="text-primary hover:text-primary/80 font-medium"
              >
                Browse More Pets →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/adopter/pets/${petId}`)}
                  >
                    <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                      {pet.primary_photo_url ? (
                        <img
                          src={getImageUrl(pet.primary_photo_url)}
                          alt={pet.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div 
                        className="text-gray-400 text-6xl flex items-center justify-center w-full h-full"
                        style={{ display: pet.primary_photo_url ? 'none' : 'flex' }}
                      >
                        🐾
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFavorite(petId)
                        }}
                        disabled={removingFavorite[petId]}
                        className="absolute top-3 right-3 w-10 h-10 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Remove from favorites"
                      >
                        <span className="text-lg">
                          {removingFavorite[petId] ? '...' : '♥'}
                        </span>
                      </button>
                      <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                        pet.adoption_status === 'AVAILABLE' || pet.adoption_status === 'available'
                          ? 'bg-green-100 text-green-800'
                          : pet.adoption_status === 'PENDING' || pet.adoption_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {pet.adoption_status}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{pet.name}</h3>
                        <span className="text-sm text-gray-500 capitalize">{pet.pet_type?.toLowerCase()}</span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">
                        {pet.breed && `${pet.breed} • `}
                        {formatAge(pet.age_years, pet.age_months)} • {pet.size}
                      </p>

                      {favorite.created_at && (
                        <p className="text-xs text-gray-400 mb-3">
                          Saved on {new Date(favorite.created_at).toLocaleDateString()}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                          {pet.adoption_fee && Number(pet.adoption_fee) > 0 
                            ? `PKR ${Number(pet.adoption_fee)}` 
                            : 'Free'}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/adopter/pets/${petId}`)
                          }}
                          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/80 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-12 text-center">
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Ready to find more?</h3>
                <p className="text-gray-600 mb-6">
                  Explore more pets or get personalized recommendations based on your preferences
                </p>
                <div className="space-x-4">
                  <button
                    onClick={() => navigate('/adopter/home')}
                    className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/80 transition-colors"
                  >
                    Browse All Pets
                  </button>
                  <button
                    onClick={() => navigate('/adopter/perfect-pawtner')}
                    className="bg-secondary text-white px-6 py-3 rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                  >
                    Find Perfect Paw-tner
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Favorites