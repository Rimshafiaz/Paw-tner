import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBanner from '../../components/NotificationBanner'

function PetBrowsing() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ message: '', type: '', show: false })
  const [totalPets, setTotalPets] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [favorites, setFavorites] = useState(new Set())
  const [favoritesLoading, setFavoritesLoading] = useState({})
  const [filters, setFilters] = useState({
    pet_type: '',
    size: '',
    gender: '',
    age_min: '',
    age_max: '',
    city: '',
    state: '',
    breed: ''
  })

  const showNotification = (message, type) => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification({ message: '', type: '', show: false })
    }, 5000)
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPets()
    }, 500) 
    
    return () => clearTimeout(timeoutId)
  }, [currentPage, filters])

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

  const fetchPets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        skip: (currentPage - 1) * 12,
        limit: 12,
        adoption_status: 'AVAILABLE'
      })

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await fetch(`http://localhost:8000/pets?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setPets(data.pets || [])
        setTotalPets(data.total || 0)
      } else {
        showNotification('Failed to load pets', 'error')
      }
    } catch (error) {
      showNotification('Network error. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
    setCurrentPage(1)
  }

  const handleTextInputChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      pet_type: '',
      size: '',
      gender: '',
      age_min: '',
      age_max: '',
      city: '',
      state: '',
      breed: ''
    })
    setCurrentPage(1)
  }

  const fetchFavorites = async () => {
    try {
      const userId = currentUser?.allUserData?.id
      const token = localStorage.getItem('auth_token')
      
      if (!userId || !token) {
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
        const favoriteIds = new Set(favoritesArray.map(fav => fav.pet_id || fav.id))
        setFavorites(favoriteIds)
      } else {
        setFavorites(new Set())
      }
    } catch (error) {
      setFavorites(new Set())
    }
  }

  const toggleFavorite = async (petId) => {
    try {
      setFavoritesLoading(prev => ({ ...prev, [petId]: true }))
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
      } else {
        showNotification('Failed to update favorites', 'error')
      }
    } catch (error) {
      showNotification('Network error', 'error')
    } finally {
      setFavoritesLoading(prev => ({ ...prev, [petId]: false }))
    }
  }

  const totalPages = Math.ceil(totalPets / 12)

  if (loading && pets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Finding your perfect companions...</p>
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
          <h1 className="text-3xl font-bold from-[#FF8C42] to-[#FE8B02] text-transparent bg-clip-text bg-gradient-to-br">Find Your Perfect Pet</h1>
          <p className="text-gray-600 mt-2">
            Discover amazing pets looking for their forever homes
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Filter Pets</h2>
            <button
              onClick={clearFilters}
              className="text-primary hover:text-primary/80 font-medium text-sm"
            >
              Clear All Filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pet Type</label>
              <select
                value={filters.pet_type}
                onChange={(e) => handleFilterChange('pet_type', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Any pet type</option>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="bird">Bird</option>
                <option value="rabbit">Rabbit</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
              <select
                value={filters.size}
                onChange={(e) => handleFilterChange('size', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Any size</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra_large">Extra Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Any gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
              <select
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All provinces</option>
                <option value="Punjab">Punjab</option>
                <option value="Sindh">Sindh</option>
                <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                <option value="Balochistan">Balochistan</option>
                <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                <option value="Azad Kashmir">Azad Kashmir</option>
                <option value="Islamabad Capital Territory">Islamabad Capital Territory</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => handleTextInputChange('city', e.target.value)}
                placeholder="Enter city"
                className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Breed</label>
              <input
                type="text"
                value={filters.breed}
                onChange={(e) => handleTextInputChange('breed', e.target.value)}
                placeholder="Enter breed"
                className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Age (years)</label>
              <input
                type="number"
                value={filters.age_min}
                onChange={(e) => handleFilterChange('age_min', e.target.value)}
                min="0"
                max="20"
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Age (years)</label>
              <input
                type="number"
                value={filters.age_max}
                onChange={(e) => handleFilterChange('age_max', e.target.value)}
                min="0"
                max="20"
                placeholder="20"
                className="w-full px-3 py-2 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {loading ? 'Searching...' : `Found ${totalPets} pets available for adoption`}
          </p>
        </div>

        {/* Pet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {pets.map((pet) => (
            <div 
              key={pet.id} 
              className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/adopter/pets/${pet.id}`)}
            >
              <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                {pet.primary_photo_url ? (
                  <img
                    src={pet.primary_photo_url.startsWith('http') 
                      ? pet.primary_photo_url 
                      : `http://localhost:8000${pet.primary_photo_url}`}
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
                    toggleFavorite(pet.id)
                  }}
                  disabled={favoritesLoading[pet.id]}
                  className={`absolute top-3 right-3 w-10 h-10 rounded-full shadow-sm flex items-center justify-center transition-colors ${
                    favorites.has(pet.id)
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-white text-gray-400 hover:text-red-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">
                    {favoritesLoading[pet.id] ? '...' : (favorites.has(pet.id) ? '♥' : '♡')}
                  </span>
                </button>
              </div>
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{pet.name}</h3>
                  <span className="text-sm text-gray-500 capitalize">{pet.pet_type?.toLowerCase()}</span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">
                  {pet.breed && `${pet.breed} • `}
                  {pet.age_years ? `${pet.age_years} ${pet.age_years === 1 ? 'year' : 'years'} old` : 'Age unknown'} • {pet.size}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    {pet.adoption_fee && Number(pet.adoption_fee) > 0 ? `PKR ${Number(pet.adoption_fee)}` : 'Free'}
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
          ))}
        </div>

        {/* Empty State */}
        {!loading && pets.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl text-gray-300 mb-4">🐾</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No pets found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters to see more results</p>
            <button
              onClick={clearFilters}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/80"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {[...Array(Math.min(5, totalPages))].map((_, index) => {
              const pageNumber = currentPage <= 3 ? index + 1 : currentPage - 2 + index
              if (pageNumber > totalPages) return null
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === pageNumber
                      ? 'bg-primary text-white'
                      : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              )
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PetBrowsing