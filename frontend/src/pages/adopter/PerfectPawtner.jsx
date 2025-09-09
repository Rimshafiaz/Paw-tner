import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBanner from '../../components/NotificationBanner'

function PerfectPawtner() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ message: '', type: '', show: false })
  const [needsPreferences, setNeedsPreferences] = useState(false)

  const showNotification = (message, type) => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification({ message: '', type: '', show: false })
    }, 5000)
  }

  useEffect(() => {
    fetchMatches()
  }, [currentUser])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const userId = currentUser?.allUserData?.id
      const token = localStorage.getItem('auth_token')
      
      if (!userId || !token) {
        showNotification('Please log in to view matches', 'error')
        navigate('/login')
        return
      }

      const response = await fetch(`http://localhost:8000/users/${userId}/matches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.requires_preferences) {
          setNeedsPreferences(true)
          setMatches([])
          showNotification(data.message, 'warning')
        } else {
          setMatches(data.matches || [])
          setNeedsPreferences(false)
        }
      } else if (response.status === 401 || response.status === 403) {
        showNotification('Please log in again', 'error')
        navigate('/login')
      } else {
        showNotification('Failed to load matches', 'error')
        setMatches([])
      }
    } catch (error) {
      showNotification('Network error. Please try again.', 'error')
      setMatches([])
    } finally {
      setLoading(false)
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
          <p className="text-gray-600 text-lg">Finding your perfect matches...</p>
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
          <h1 className="text-3xl font-bold from-[#FF8C42] to-[#FE8B02] text-transparent bg-clip-text bg-gradient-to-br">Your Perfect Paw-tner Matches</h1>
          <p className="text-gray-600 mt-2">
            Pets that match your preferences and lifestyle
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

        {needsPreferences ? (
          <div className="text-center py-16">
            <div className="text-8xl text-gray-300 mb-6">⚙️</div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">Complete Your Profile First</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              We need to know your preferences to find the perfect pets for you. Please complete your profile to get personalized matches.
            </p>
            <button
              onClick={() => navigate('/adopter/profile')}
              className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/80 transition-colors"
            >
              Complete Profile
            </button>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl text-gray-300 mb-6">🔍</div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">No matches found</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              We couldn't find any pets that match your current preferences. Try updating your preferences or browse all available pets.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/adopter/profile')}
                className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/80 transition-colors"
              >
                Update Preferences
              </button>
              <button
                onClick={() => navigate('/adopter/browse')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Browse All Pets
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Found {matches.length} perfect {matches.length === 1 ? 'match' : 'matches'} for you
              </p>
              <button
                onClick={() => navigate('/adopter/browse')}
                className="text-primary hover:text-primary/80 font-medium"
              >
                Browse More Pets →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {matches.map((match) => {
                const pet = match.pet || match;
                return (
                <div 
                  key={pet.id} 
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/adopter/pets/${pet.id}`)}
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
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        {pet.adoption_fee && Number(pet.adoption_fee) > 0 
                          ? `PKR ${Number(pet.adoption_fee)}` 
                          : 'Free'}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/adopter/pets/${pet.id}`)
                        }}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/80 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Want to see more options?</h3>
                <p className="text-gray-600 mb-6">
                  These are your best matches, but there might be other great pets waiting for you too!
                </p>
                <div className="space-x-4">
                  <button
                    onClick={() => navigate('/adopter/browse')}
                    className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/80 transition-colors"
                  >
                    Browse All Pets
                  </button>
                  <button
                    onClick={() => navigate('/adopter/profile')}
                    className="bg-secondary text-white px-6 py-3 rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                  >
                    Update Preferences
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

export default PerfectPawtner