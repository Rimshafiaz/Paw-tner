import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBanner from '../../components/NotificationBanner'
import adopterPawtnerImage from '../../assets/adopter paw-tner.jpg'

function PetDetail() {
  const { petId } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  
  const [pet, setPet] = useState(null)
  const [shelter, setShelter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ message: '', type: '', show: false })
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoritesLoading, setFavoritesLoading] = useState(false)

  const showNotification = (message, type) => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification({ message: '', type: '', show: false })
    }, 5000)
  }

  const getStatusColor = (status) => {
    const upperStatus = status?.toUpperCase() || ''
    switch (upperStatus) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ADOPTED': return 'bg-purple-100 text-purple-800'
      case 'ON_HOLD': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  useEffect(() => {
    fetchPetDetails()
    checkIfFavorite()
  }, [petId, currentUser])

  // Refetch favorites when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkIfFavorite()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [petId, currentUser])

  const fetchPetDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch pet details
      const petResponse = await fetch(`http://localhost:8000/pets/${petId}`)
      if (petResponse.ok) {
        const petData = await petResponse.json()
        setPet(petData)
        
        // Fetch shelter contact info
        const contactResponse = await fetch(`http://localhost:8000/pets/${petId}/contact`)
        if (contactResponse.ok) {
          const contactData = await contactResponse.json()
          setShelter(contactData.shelter)
        }
      } else {
        showNotification('Pet not found', 'error')
        navigate('/adopter/home')
      }
    } catch (error) {
      showNotification('Failed to load pet details', 'error')
      navigate('/adopter/home')
    } finally {
      setLoading(false)
    }
  }

  const checkIfFavorite = async () => {
    try {
      const userId = currentUser?.allUserData?.id
      const token = localStorage.getItem('auth_token')
      
      if (!userId || !token) {
        setIsFavorite(false)
        return
      }

      const response = await fetch(`http://localhost:8000/users/${userId}/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const favoritesData = await response.json()
        const favorites = Array.isArray(favoritesData) ? favoritesData : (favoritesData.favorites || [])
        const currentPetId = parseInt(petId)
        const isCurrentlyFavorite = favorites.some(fav => {
          const favPetId = fav.pet_id || fav.id
          return favPetId === currentPetId
        })
        setIsFavorite(isCurrentlyFavorite)
      } else {
        setIsFavorite(false)
      }
    } catch (error) {
      setIsFavorite(false)
    }
  }

  const toggleFavorite = async () => {
    try {
      setFavoritesLoading(true)
      const userId = currentUser?.allUserData?.id
      const token = localStorage.getItem('auth_token')
      
      if (!userId || !token) {
        showNotification('Please log in to save favorites', 'error')
        return
      }

      const method = isFavorite ? 'DELETE' : 'POST'
      const response = await fetch(`http://localhost:8000/users/${userId}/favorites/${petId}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setIsFavorite(!isFavorite)
        showNotification(
          isFavorite ? 'Removed from favorites' : 'Added to favorites', 
          'success'
        )
      } else {
        showNotification('Failed to update favorites', 'error')
      }
    } catch (error) {
      showNotification('Network error', 'error')
    } finally {
      setFavoritesLoading(false)
    }
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

  const getImageUrl = (photoUrl) => {
    if (!photoUrl) return null
    return photoUrl.startsWith('http') ? photoUrl : `http://localhost:8000${photoUrl}`
  }

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 248, 240, 0.85), rgba(240, 255, 248, 0.85)), url(${adopterPawtnerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/50">
          <div className="animate-bounce text-6xl mb-6">🐶</div>
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-6"></div>
          <p className="text-gray-700 text-xl font-semibold">Finding your furry friend... 🔍✨</p>
        </div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 248, 240, 0.85), rgba(240, 255, 248, 0.85)), url(${adopterPawtnerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/50">
          <div className="text-8xl mb-6 animate-pulse">😢</div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 text-transparent bg-clip-text mb-4">Oops! Pet not found 🐾</h2>
          <p className="text-gray-700 mb-8 text-lg">This adorable friend may have found their forever home already! 🏠✨</p>
          <button
            onClick={() => navigate('/adopter/home')}
            className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-full font-semibold hover:from-primary/80 hover:to-secondary/80 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            🔍 Find Other Amazing Pets! 🌈
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen py-8"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 248, 240, 0.85), rgba(240, 255, 248, 0.85)), url(${adopterPawtnerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <NotificationBanner 
          notification={notification} 
          onClose={() => setNotification({ message: '', type: '', show: false })}
        />

        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/adopter/home')}
            className="flex items-center bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full text-primary hover:text-primary/80 font-medium hover:bg-white/90 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            🏠 ← Back to Browse Pets
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-transparent backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden border-2 border-pink-200 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
            <div className="relative h-96 flex items-center justify-center p-4">
              {pet.primary_photo_url ? (
                <img
                  src={getImageUrl(pet.primary_photo_url)}
                  alt={pet.name}
                  className="max-w-full max-h-full object-contain rounded-2xl border-4 border-white shadow-lg"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div 
                className="text-gray-400 text-8xl flex items-center justify-center w-full h-full"
                style={{ display: pet.primary_photo_url ? 'none' : 'flex' }}
              >
                🐾
              </div>
              
              <button
                onClick={toggleFavorite}
                disabled={favoritesLoading}
                className={`absolute top-4 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${
                  isFavorite 
                    ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white hover:from-red-500 hover:to-pink-600 animate-pulse' 
                    : 'bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-white'
                }`}
              >
                <span className="text-2xl">
                  {favoritesLoading ? '💫' : (isFavorite ? '💖' : '🤍')}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-6">

            <div className="bg-gradient-to-br from-orange-50/90 to-yellow-50/90 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-orange-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-extrabold from-[#FF8C42] to-[#FE8B02] text-transparent bg-clip-text bg-gradient-to-br mb-2 "> {pet.name}🧡</h1>
                  <p className="text-lg text-gray-600 capitalize">
                    {pet.pet_type?.toLowerCase()} • {formatAge(pet.age_years, pet.age_months)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-transparent bg-clip-text">
                     {pet.adoption_fee && Number(pet.adoption_fee) > 0 
                      ? `PKR ${Number(pet.adoption_fee)}` 
                      : 'Free Adoption! 🎉'}
                  </div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pet.adoption_status)}`}>
                    {pet.adoption_status?.charAt(0).toUpperCase() + pet.adoption_status?.slice(1).toLowerCase() || 'Available'}
                  </div>
                </div>
              </div>

              {pet.description && (
                <p className="text-gray-700 leading-relaxed">{pet.description}</p>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-50/90 to-cyan-50/90 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-blue-200 hover:shadow-xl transition-all duration-300">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-transparent bg-clip-text mb-6">📜 Basic Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Breed</span>
                  <p className="text-gray-800">{pet.breed || 'Mixed breed'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Size</span>
                  <p className="text-gray-800 capitalize">{pet.size?.toLowerCase() || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Gender</span>
                  <p className="text-gray-800">{pet.gender || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Weight</span>
                  <p className="text-gray-800">{pet.weight ? `${pet.weight} kg` : 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Color</span>
                  <p className="text-gray-800">{pet.color || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Spayed/Neutered</span>
                  <p className="text-gray-800">{pet.is_spayed_neutered ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50/90 to-teal-50/90 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-green-200 hover:shadow-xl transition-all duration-300">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 text-transparent bg-clip-text mb-6">😊 Personality & Care</h2>
              <div className="space-y-4">
                {pet.temperament && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Temperament</span>
                    <p className="text-gray-800">{pet.temperament}</p>
                  </div>
                )}
                
                {pet.activity_level && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Activity Level</span>
                    <p className="text-gray-800 capitalize">{pet.activity_level.toLowerCase().replace('_', ' ')}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 bg-white/50 rounded-full px-4 py-2 border border-white/30">
                    <span className="text-lg">{pet.good_with_kids ? '👶💕' : '🚫👶'}</span>
                    <span className="text-sm text-gray-700 font-medium">Good with children</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-white/50 rounded-full px-4 py-2 border border-white/30">
                    <span className="text-lg">{pet.good_with_dogs ? '🐶💕' : '🚫🐶'}</span>
                    <span className="text-sm text-gray-700 font-medium">Good with dogs</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-white/50 rounded-full px-4 py-2 border border-white/30">
                    <span className="text-lg">{pet.good_with_cats ? '🐱💕' : '🚫🐱'}</span>
                    <span className="text-sm text-gray-700 font-medium">Good with cats</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-white/50 rounded-full px-4 py-2 border border-white/30">
                    <span className="text-lg">{pet.house_trained ? '🏠✅' : '🏠❌'}</span>
                    <span className="text-sm text-gray-700 font-medium">House trained</span>
                  </div>
                </div>
              </div>
            </div>

            {(pet.medical_history || pet.vaccination_status || pet.special_needs) && (
              <div className="bg-gradient-to-br from-red-50/90 to-pink-50/90 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-red-200 hover:shadow-xl transition-all duration-300">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 text-transparent bg-clip-text mb-6">🌡️ Health Information</h2>
                <div className="space-y-3">
                  {pet.vaccination_status && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Vaccination Status</span>
                      <p className="text-gray-800">{pet.vaccination_status}</p>
                    </div>
                  )}
                  {pet.medical_history && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Medical History</span>
                      <p className="text-gray-800">{pet.medical_history}</p>
                    </div>
                  )}
                  {pet.special_needs && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Special Needs</span>
                      <p className="text-gray-800">{pet.special_needs}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {shelter && (
              <div className="bg-gradient-to-br from-purple-50/90 to-indigo-50/90 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-purple-200 hover:shadow-xl transition-all duration-300">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text mb-6">🏠 Contact Shelter</h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Shelter Name</span>
                    <p className="text-gray-800 font-medium">{shelter.name}</p>
                  </div>
                  
                  {/* Location Information */}
                  {(shelter.address || shelter.city || shelter.state) && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Location</span>
                      <div className="text-gray-800">
                        {shelter.address && <p>{shelter.address}</p>}
                        <p>
                          {shelter.city}{shelter.state && `, ${shelter.state}`}
                          {shelter.zip_code && ` ${shelter.zip_code}`}
                        </p>
                        {shelter.country && shelter.country !== 'Pakistan' && (
                          <p>{shelter.country}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email</span>
                    <p className="text-gray-800">
                      <a href={`mailto:${shelter.email}`} className="text-primary hover:text-primary/80">
                        {shelter.email}
                      </a>
                    </p>
                  </div>
                  {shelter.phone && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Phone</span>
                      <p className="text-gray-800">
                        <a href={`tel:${shelter.phone}`} className="text-primary hover:text-primary/80">
                          {shelter.phone}
                        </a>
                      </p>
                    </div>
                  )}
                  {shelter.contact_hours && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Contact Hours</span>
                      <p className="text-gray-800">{shelter.contact_hours}</p>
                    </div>
                  )}
                </div>
                
                
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PetDetail