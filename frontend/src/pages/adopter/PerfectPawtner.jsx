import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBanner from '../../components/NotificationBanner'
import adopterPawtnerImage from '../../assets/adopter paw-tner.jpg'

function PerfectPawtner() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ message: '', type: '', show: false })
  const [needsPreferences, setNeedsPreferences] = useState(false)
  const [mobileViewMode, setMobileViewMode] = useState('double')

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
      <div className="min-h-screen flex items-center justify-center" style={{
        backgroundImage: `linear-gradient(rgba(255, 248, 240, 0.85), rgba(240, 255, 248, 0.85)), url(${adopterPawtnerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div className="text-center">
          <div className="animate-bounce text-6xl mb-6">🎯</div>
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium animate-pulse">Finding your perfect matches... ✨</p>
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

        <div className="text-center mb-12">
          <div className="mb-6">
            <span className="text-6xl animate-bounce">🎯</span>
            <span className="text-6xl animate-pulse mx-4">💕</span>
            <span className="text-6xl animate-bounce">✨</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] mb-4 drop-shadow-lg animate-pulse">
            Your Perfect Paw-tner Matches
          </h1>
          <p className="text-xl text-gray-700 mb-8 font-medium">
            🌟 Specially chosen friends just for you! 🌟
          </p>
        </div>

        {needsPreferences ? (
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-3xl p-12 text-center border-2 border-yellow-200 shadow-xl">
            <div className="text-8xl mb-6 animate-bounce">⚙️</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Complete Your Profile First! 🎨</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              🌟 We need to know your preferences to find the perfect pets for you! Please complete your profile to get personalized matches. ✨
            </p>
            <button
              onClick={() => navigate('/adopter/profile')}
              className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-all duration-200 shadow-lg border-2 border-orange-300"
            >
              🎯 Complete Profile
            </button>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl text-gray-300 mb-6">🔍</div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">No matches found 😢</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              We couldn't find any pets that match your current preferences. Try updating your preferences or browse all available pets.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/adopter/profile')}
                className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-2xl font-medium hover:scale-105 transition-all duration-200 shadow-lg border-2 border-primary"
              >
                ✏️ Update Preferences
              </button>
              <button
                onClick={() => navigate('/adopter/home')}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-2xl font-medium hover:scale-105 transition-all duration-200 shadow-lg border-2 border-gray-400"
              >
                🐾 Browse All Pets
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <button
                onClick={() => navigate('/adopter/dashboard')}
                className="bg-gradient-to-r from-purple-400 to-pink-500 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 flex items-center shadow-lg border-2 border-purple-300"
              >
                🏠 ← Back to Dashboard
              </button>
              <div className="flex items-center gap-2 md:hidden">
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl px-3 py-2 border-2 border-green-200">
                  <span className="text-emerald-600 font-bold text-sm">
                    🎯 {matches.length} matches
                  </span>
                </div>
                <button
                  onClick={() => setMobileViewMode(mobileViewMode === 'single' ? 'double' : 'single')}
                  className="bg-gradient-to-r from-orange-400 to-yellow-500 text-white px-3 py-2 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-orange-300 text-xs"
                >
                  {mobileViewMode === 'single' ? '🔄 2 Cols' : '🔄 1 Col'}
                </button>
              </div>
              <div className="hidden md:block bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl px-4 py-2 border-2 border-green-200">
                <span className="text-emerald-600 font-bold">
                  🎯 Found {matches.length} perfect {matches.length === 1 ? 'match' : 'matches'} for you
                </span>
              </div>
              <button
                onClick={() => navigate('/adopter/home')}
                className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-blue-300"
              >
                🐕 Browse More Pets →
              </button>
            </div>
            
      
            <div className={`grid ${mobileViewMode === 'single' ? 'grid-cols-1' : 'grid-cols-2'} md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8 px-6 md:px-0`}>
              {matches.map((match) => {
                const pet = match.pet || match;
                return (
                <div 
                  key={pet.id} 
                  className="bg-gradient-to-br from-white to-pink-50 rounded-2xl md:rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-110 hover:rotate-1 border-2 border-pink-200"
                  onClick={() => navigate(`/pets/${pet.id}`)}
                >
                  <div className="relative h-32 md:h-48 bg-gray-100 flex items-center justify-center">
                    {pet.primary_photo_url ? (
                      <img
                        src={getImageUrl(pet.primary_photo_url)}
                        alt={`Photo of ${pet.name}, a ${pet.pet_type}`}
                        className="w-full h-full object-contain md:object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-4xl md:text-6xl">🐾</div>
                    )}
                    
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
                  
                  <div className={`${mobileViewMode === 'double' ? 'p-2' : 'p-3'} md:p-5`}>
                    <div className="text-center mb-2 md:mb-3">
                      <h3 className={`${mobileViewMode === 'double' ? 'text-sm' : 'text-base'} md:text-xl font-bold mb-1`}>
                        <span className="text-orange-500">Meet {pet.name}</span> <span className="text-xl md:text-2xl">
                          {pet.pet_type === 'dog' ? '🐕' : pet.pet_type === 'cat' ? '🐱' : pet.pet_type === 'bird' ? '🐦' : pet.pet_type === 'rabbit' ? '🐰' : '🐾'}
                        </span>
                      </h3>
                      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl px-3 py-1 inline-block border border-primary/20">
                        <span className="text-sm text-primary font-bold capitalize">{pet.pet_type?.toLowerCase()}</span>
                      </div>
                    </div>
                    
                    <div className="text-center mb-2 md:mb-4">
                      <p className="text-gray-600 text-xs md:text-sm font-medium">
                        {pet.breed && `${pet.breed} • `}
                        {formatAge(pet.age_years, pet.age_months)} • 
                        {pet.size} size
                      </p>
                    </div>
                    
                    <div className={`flex items-center justify-between ${mobileViewMode === 'double' ? 'gap-1' : 'gap-2'}`}>
                        <div className={`bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl ${mobileViewMode === 'double' ? 'px-1 py-1' : 'px-2 py-1'} md:px-3 md:py-2 border-2 border-green-200`}>
                          <span className={`${mobileViewMode === 'double' ? 'text-xs' : 'text-sm'} md:text-lg font-bold text-emerald-600`}>
                            {pet.adoption_fee && Number(pet.adoption_fee) > 0 ? `PKR ${Number(pet.adoption_fee)}` : 'FREE! 🎉'}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/pets/${petId}`)
                          }}
                          className={`bg-gradient-to-r from-primary to-secondary text-white ${mobileViewMode === 'double' ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'} md:px-6 md:py-3 md:text-sm rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-primary`}
                          aria-label={`View details for ${pet.name}`}
                        >
                          👀 {mobileViewMode === 'double' ? 'View' : 'View Details'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 mb-8 shadow-xl border-2 border-blue-200 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Want to see more options? 🧐</h3>
              <p className="text-gray-600 mb-6">
                These are your best matches, but there might be other great pets waiting for you too!
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => navigate('/adopter/home')}
                  className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-primary"
                >
                  🐕 Browse All Pets
                </button>
                <button
                  onClick={() => navigate('/adopter/profile')}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-gray-400"
                >
                  ✏️ Update Preferences
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default PerfectPawtner