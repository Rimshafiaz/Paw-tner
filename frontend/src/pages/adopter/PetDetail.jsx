import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBanner from '../../components/NotificationBanner'

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
        navigate('/adopter/browse')
      }
    } catch (error) {
      showNotification('Failed to load pet details', 'error')
      navigate('/adopter/browse')
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading pet details...</p>
        </div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-300 mb-4">🐾</div>
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">Pet not found</h2>
          <p className="text-gray-500 mb-6">This pet may have been adopted or is no longer available</p>
          <button
            onClick={() => navigate('/adopter/browse')}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/80"
          >
            Browse Other Pets
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <NotificationBanner 
          notification={notification} 
          onClose={() => setNotification({ message: '', type: '', show: false })}
        />

        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/adopter/browse')}
            className="flex items-center text-primary hover:text-primary/80 font-medium"
          >
            ← Back to Browse Pets
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="relative h-96 bg-gray-100 flex items-center justify-center">
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
                className="text-gray-400 text-8xl flex items-center justify-center w-full h-full"
                style={{ display: pet.primary_photo_url ? 'none' : 'flex' }}
              >
                🐾
              </div>
              
              <button
                onClick={toggleFavorite}
                disabled={favoritesLoading}
                className={`absolute top-4 right-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors ${
                  isFavorite 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-white text-gray-400 hover:text-red-500'
                }`}
              >
                <span className="text-xl">
                  {favoritesLoading ? '...' : (isFavorite ? '♥' : '♡')}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-6">

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold from-[#FF8C42] to-[#FE8B02] text-transparent bg-clip-text bg-gradient-to-br mb-2">{pet.name}</h1>
                  <p className="text-lg text-gray-600 capitalize">
                    {pet.pet_type?.toLowerCase()} • {formatAge(pet.age_years, pet.age_months)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {pet.adoption_fee && Number(pet.adoption_fee) > 0 
                      ? `PKR ${Number(pet.adoption_fee)}` 
                      : 'Free'}
                  </div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    pet.adoption_status === 'AVAILABLE' || pet.adoption_status === 'available'
                      ? 'bg-green-100 text-green-800'
                      : pet.adoption_status === 'PENDING' || pet.adoption_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {pet.adoption_status}
                  </div>
                </div>
              </div>

              {pet.description && (
                <p className="text-gray-700 leading-relaxed">{pet.description}</p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
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

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Personality & Care</h2>
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
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${pet.good_with_kids ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm text-gray-700">Good with children</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${pet.good_with_dogs ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm text-gray-700">Good with dogs</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${pet.good_with_cats ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm text-gray-700">Good with cats</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${pet.house_trained ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm text-gray-700">House trained</span>
                  </div>
                </div>
              </div>
            </div>

            {(pet.medical_history || pet.vaccination_status || pet.special_needs) && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Health Information</h2>
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
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Shelter</h2>
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