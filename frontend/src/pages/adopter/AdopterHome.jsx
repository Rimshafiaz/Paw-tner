import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBanner from '../../components/NotificationBanner'
import adopterPawtnerImage from '../../assets/adopter paw-tner.jpg'

function AdopterHome() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ message: '', type: '', show: false })
  const [favorites, setFavorites] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedGender, setSelectedGender] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [ageRange, setAgeRange] = useState({ min: '', max: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [mobileViewMode, setMobileViewMode] = useState('double') // 'single' or 'double'
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMorePets, setHasMorePets] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const showNotification = (message, type) => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification({ message: '', type: '', show: false })
    }, 5000)
  }

  useEffect(() => {
    fetchPets()
    fetchFavorites()
  }, [])

  const fetchPets = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true)
        setCurrentPage(1)
        setHasMorePets(true)
      } else {
        setLoadingMore(true)
      }

      const limit = 20
      const skip = (page - 1) * limit
      
      const params = new URLSearchParams({
        limit: limit,
        skip: skip,
        adoption_status: 'AVAILABLE'
      })

      if (selectedType) params.append('pet_type', selectedType)
      if (selectedSize) params.append('size', selectedSize)
      if (selectedGender) params.append('gender', selectedGender)
      if (selectedCity) params.append('city', selectedCity)
      if (selectedState) params.append('state', selectedState)
      if (ageRange.min) params.append('age_min', ageRange.min)
      if (ageRange.max) params.append('age_max', ageRange.max)

      const response = await fetch(`http://localhost:8000/pets?${params}`)
      if (response.ok) {
        const data = await response.json()
        const newPets = Array.isArray(data) ? data : data.pets || []
        
        if (append) {
          setPets(prevPets => [...prevPets, ...newPets])
        } else {
          setPets(newPets)
        }
        
        setHasMorePets(newPets.length === limit)
        
        if (append) {
          setCurrentPage(page)
        }
      }
    } catch (error) {
      console.error('Failed to fetch pets:', error)
      showNotification('Failed to load pets', 'error')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      const userId = currentUser?.allUserData?.id
      const token = localStorage.getItem('auth_token')
      
      if (!userId || !token) return

      const response = await fetch(`http://localhost:8000/users/${userId}/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const favoritesData = await response.json()
        const favoritesArray = Array.isArray(favoritesData) ? favoritesData : (favoritesData.favorites || [])
        const favoriteIds = new Set(favoritesArray.map(fav => fav.pet_id || fav.id))
        setFavorites(favoriteIds)
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    }
  }

  const toggleFavorite = async (petId) => {
    try {
      const userId = currentUser?.allUserData?.id
      const token = localStorage.getItem('auth_token')
      
      if (!userId || !token) {
        showNotification('Please log in to save favorites', 'error')
        return
      }

      const isFavorite = favorites.has(petId)
      const method = isFavorite ? 'DELETE' : 'POST'
      const response = await fetch(`http://localhost:8000/users/${userId}/favorites/${petId}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setFavorites(prev => {
          const newFavorites = new Set(prev)
          if (isFavorite) {
            newFavorites.delete(petId)
          } else {
            newFavorites.add(petId)
          }
          return newFavorites
        })
        showNotification(
          isFavorite ? 'Removed from favorites' : 'Added to favorites', 
          'success'
        )
      }
    } catch (error) {
      showNotification('Failed to update favorites', 'error')
    }
  }

  const loadMorePets = async () => {
    if (!hasMorePets || loadingMore) return
    await fetchPets(currentPage + 1, true)
  }

  const getImageUrl = (photoUrl) => {
    if (!photoUrl) return null
    return photoUrl.startsWith('http') ? photoUrl : `http://localhost:8000${photoUrl}`
  }

  const filteredPets = pets.filter(pet => {
    const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pet.breed?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  useEffect(() => {
    fetchPets()
  }, [selectedType, selectedSize, selectedGender, selectedCity, selectedState, ageRange])

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
            <span className="text-6xl animate-bounce">🏠</span>
            <span className="text-6xl animate-pulse mx-4">💕</span>
            <span className="text-6xl animate-bounce">🐾</span>
          </div>
          <h1 className="text-3xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] mb-4 drop-shadow-lg animate-pulse">
            Welcome home, {currentUser?.name || 'Friend'}! 
          </h1>
          <p className="text-xl text-gray-700 mb-8 font-medium">
            🌟 Your furry friends are waiting to meet you! 🌟
          </p>

       
          {/* Quick Stats - Commented for now */}
          {/* <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
            <div className="bg-gradient-to-r from-pink-100 to-orange-100 rounded-3xl px-8 py-4 shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-pink-200">
              <div className="flex items-center">
                <span className="text-3xl mr-3">🎯</span>
                <div>
                  <span className="text-3xl font-bold text-primary block">{pets.length}</span>
                  <span className="text-gray-700 text-sm font-medium">Amazing Friends</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-100 to-pink-100 rounded-3xl px-8 py-4 shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-red-200">
              <div className="flex items-center">
                <span className="text-3xl mr-3">💖</span>
                <div>
                  <span className="text-3xl font-bold text-red-500 block">{favorites.size}</span>
                  <span className="text-gray-700 text-sm font-medium">Your Favorites</span>
                </div>
              </div>
            </div>
          </div> */}

          {/* Cute Call to Action - Commented for now */}
          {/* <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-3xl p-6 max-w-2xl mx-auto border-2 border-yellow-200 shadow-lg">
            <span className="text-2xl">🌈</span>
            <p className="text-lg font-medium text-gray-800 inline mx-3">
              Ready to find your perfect match? Let the magic begin!
            </p>
            <span className="text-2xl">✨</span>
          </div> */}
        </div>
 
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-6 mb-8 shadow-xl border-2 border-blue-200">
          <div className="text-center mb-6">
            <span className="text-2xl mr-2">🔍</span>
            <span className="text-xl font-bold text-gray-800">Find Your Perfect Buddy!</span>
            
            <span className="text-2xl ml-2">🐕</span>
          </div>
          
          <div className="md:hidden">
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🔤</span>
                <input
                  type="text"
                  placeholder="Search by name or breed..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center justify-center bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl px-3 py-3 border-2 border-green-200 flex-1">
                  <span className="text-emerald-600 font-bold text-sm">
                    🎯 {filteredPets.length} pets
                  </span>
                </div>
                <button
                  onClick={() => setMobileViewMode(mobileViewMode === 'single' ? 'double' : 'single')}
                  className="bg-gradient-to-r from-orange-400 to-yellow-500 text-white px-3 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-lg border-2 border-orange-300 text-xs"
                  title={mobileViewMode === 'single' ? 'Switch to 2-column view' : 'Switch to 1-column view'}
                >
                  {mobileViewMode === 'single' ? '🔄 2 Cols' : '🔄 1 Col'}
                </button>
                <button
                  onClick={() => navigate('/adopter/favorites')}
                  
                  className="bg-gradient-to-r from-red-400 to-pink-500 text-white px-3 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-lg border-2 border-red-300 text-sm"
                >
                  💖 Favorites ({favorites.size})
                </button>
              </div>
            </div>

            <div className="text-center mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gradient-to-r from-purple-400 to-blue-500 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 flex items-center justify-center mx-auto shadow-lg border-2 border-purple-300"
              >
                <span className="mr-2">🎛️</span>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
                <span className="ml-2">{showFilters ? '🔼' : '🔽'}</span>
              </button>
            </div>

            {showFilters && (
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🏷️</span>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                  >
                    <option value="">🌟 All Pet Types</option>
                    <option value="dog">🐕 Dogs</option>
                    <option value="cat">🐱 Cats</option>
                    <option value="bird">🐦 Birds</option>
                    <option value="rabbit">🐰 Rabbits</option>
                    <option value="other">🦎 Other</option>
                  </select>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">📏</span>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-green-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary bg-white shadow-sm"
                  >
                    <option value=""> All Sizes</option>
                    <option value="small">🐁 Small</option>
                    <option value="medium">🐕 Medium</option>
                    <option value="large">🐕‍🦺 Large</option>
                    <option value="extra_large">🐘 Extra Large</option>
                  </select>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">⚧️</span>
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-blue-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                  >
                    <option value=""> Any Gender</option>
                    <option value="Male">♂️ Male</option>
                    <option value="Female">♀️ Female</option>
                  </select>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🏙️</span>
                  <input
                    type="text"
                    placeholder="City..."
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-purple-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary bg-white shadow-sm"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🗺️</span>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-orange-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                  >
                    <option value="">🌍 All Provinces</option>
                    <option value="Punjab">🏛️ Punjab</option>
                    <option value="Sindh">🏖️ Sindh</option>
                    <option value="Khyber Pakhtunkhwa">🏔️ Khyber Pakhtunkhwa</option>
                    <option value="Balochistan">🏜️ Balochistan</option>
                    <option value="Gilgit-Baltistan">⛰️ Gilgit-Baltistan</option>
                    <option value="Azad Kashmir">🌲 Azad Kashmir</option>
                    <option value="Islamabad Capital Territory">🏛️ Islamabad</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🎂</span>
                    <input
                      type="number"
                      placeholder="Min age..."
                      value={ageRange.min}
                      onChange={(e) => setAgeRange(prev => ({ ...prev, min: e.target.value }))}
                      min="0"
                      max="20"
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-yellow-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🎈</span>
                    <input
                      type="number"
                      placeholder="Max age..."
                      value={ageRange.max}
                      onChange={(e) => setAgeRange(prev => ({ ...prev, max: e.target.value }))}
                      min="0"
                      max="20"
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-yellow-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedType('')
                      setSelectedSize('')
                      setSelectedGender('')
                      setSelectedCity('')
                      setSelectedState('')
                      setAgeRange({ min: '', max: '' })
                    }}
                    className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 flex items-center justify-center mx-auto shadow-lg border-2 border-gray-300"
                  >
                    🧹 Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden md:block">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🔤</span>
                <input
                  type="text"
                  placeholder="Search by name or breed..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🏷️</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                >
                  <option value="">🌟 All Pet Types</option>
                  <option value="dog">🐕 Dogs</option>
                  <option value="cat">🐱 Cats</option>
                  <option value="bird">🐦 Birds</option>
                  <option value="rabbit">🐰 Rabbits</option>
                  <option value="other">🦎 Other</option>
                </select>
              </div>
              <button
                onClick={() => navigate('/adopter/favorites')}
                className="bg-gradient-to-r from-red-400 to-pink-500 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-lg border-2 border-red-300"
              >
                💖 My Favorites ({favorites.size})
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">📏</span>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-green-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary bg-white shadow-sm"
                >
                  <option value=""> All Sizes</option>
                  <option value="small">🐁 Small</option>
                  <option value="medium">🐕 Medium</option>
                  <option value="large">🐕‍🦺 Large</option>
                  <option value="extra_large">🐘 Extra Large</option>
                </select>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">⚧️</span>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-blue-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                >
                  <option value=""> Any Gender</option>
                  <option value="Male">♂️ Male</option>
                  <option value="Female">♀️ Female</option>
                </select>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🏙️</span>
                <input
                  type="text"
                  placeholder="City..."
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-purple-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary bg-white shadow-sm"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🗺️</span>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-orange-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                >
                  <option value="">🌍 All Provinces</option>
                  <option value="Punjab">🏛️ Punjab</option>
                  <option value="Sindh">🏖️ Sindh</option>
                  <option value="Khyber Pakhtunkhwa">🏔️ Khyber Pakhtunkhwa</option>
                  <option value="Balochistan">🏜️ Balochistan</option>
                  <option value="Gilgit-Baltistan">⛰️ Gilgit-Baltistan</option>
                  <option value="Azad Kashmir">🌲 Azad Kashmir</option>
                  <option value="Islamabad Capital Territory">🏛️ Islamabad</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🎂</span>
                <input
                  type="number"
                  placeholder="Min age..."
                  value={ageRange.min}
                  onChange={(e) => setAgeRange(prev => ({ ...prev, min: e.target.value }))}
                  min="0"
                  max="20"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-yellow-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🎈</span>
                <input
                  type="number"
                  placeholder="Max age..."
                  value={ageRange.max}
                  onChange={(e) => setAgeRange(prev => ({ ...prev, max: e.target.value }))}
                  min="0"
                  max="20"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-yellow-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                />
              </div>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedType('')
                  setSelectedSize('')
                  setSelectedGender('')
                  setSelectedCity('')
                  setSelectedState('')
                  setAgeRange({ min: '', max: '' })
                }}
                className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-lg border-2 border-gray-300"
              >
                🧹 Clear All
              </button>
              <div className="flex items-center justify-center bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl px-4 py-3 border-2 border-green-200">
                <span className="text-emerald-600 font-bold">
                  🎯 {filteredPets.length} pets found
                </span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-bounce text-6xl mb-4">🐾</div>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg font-medium animate-pulse">Finding amazing pets for you... ✨</p>
          </div>
        ) : (
          <>
            <div className={`grid ${mobileViewMode === 'single' ? 'grid-cols-1' : 'grid-cols-2'} md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8 px-6 md:px-0`}>
              {filteredPets.map((pet) => (
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
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(pet.id)
                      }}
                      className={`absolute top-3 right-3 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${
                        favorites.has(pet.id)
                          ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white hover:from-red-500 hover:to-pink-600'
                          : 'bg-white text-gray-400 hover:text-red-500 hover:bg-pink-50 border-2 border-pink-200'
                      }`}
                      aria-label={`${favorites.has(pet.id) ? 'Remove from' : 'Add to'} favorites`}
                    >
                      <span className="text-xl animate-pulse">
                        {favorites.has(pet.id) ? '💖' : '🤍'}
                      </span>
                    </button>
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
                        {pet.age_years > 0 ? `${pet.age_years} ${pet.age_years === 1 ? 'year' : 'years'} old` : 'Baby'} • 
                        {pet.size} size
                      </p>
                    </div>
                    
                    <div className={`flex items-center justify-between ${mobileViewMode === 'double' ? 'gap-1' : 'gap-2'}`}>
                      <div className={`bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl ${mobileViewMode === 'double' ? 'px-1 py-1' : 'px-2 py-1'} md:px-4 md:py-2 border-2 border-green-200`}>
                        <span className={`${mobileViewMode === 'double' ? 'text-xs' : 'text-sm'} md:text-lg font-bold text-emerald-600`}>
                          {pet.adoption_fee && Number(pet.adoption_fee) > 0 ? `PKR ${Number(pet.adoption_fee)}` : 'FREE! 🎉'}
                        </span>
                      </div>
                      <div className={`bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl ${mobileViewMode === 'double' ? 'px-1 py-1' : 'px-2 py-1'} md:px-3 md:py-2 border-2 border-blue-200`}>
                        <span className={`${mobileViewMode === 'double' ? 'text-xs' : 'text-xs'} md:text-sm font-bold text-blue-600`}>
                          ✨ Available!
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!loading && filteredPets.length > 0 && hasMorePets && (
              <div className="text-center mt-8 mb-8 px-4">
                <button
                  onClick={loadMorePets}
                  disabled={loadingMore}
                  className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 md:px-8 md:py-4 rounded-3xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-primary disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-sm mx-auto text-sm md:text-base"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white inline-block mr-2"></div>
                      <span className="hidden sm:inline">Loading more pets... 🐾</span>
                      <span className="sm:hidden">Loading... 🐾</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">🐕 Load More Adorable Friends 🐱</span>
                      <span className="sm:hidden">🐕 Load More 🐱</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {filteredPets.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-6xl text-gray-300 mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No pets found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or browse all available pets</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedType('')
                    }}
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/80"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => navigate('/browse')}
                    className="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-secondary/80"
                  >
                    Browse All Pets
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdopterHome