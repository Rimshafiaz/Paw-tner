import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import pawtnerLoveImage from '../assets/paw-tner love.jpg'

function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const [featuredPets, setFeaturedPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchLocation, setSearchLocation] = useState('')
  const [searchType, setSearchType] = useState('')
  const [searchState, setSearchState] = useState('')
  const [isSearchActive, setIsSearchActive] = useState(false)

  useEffect(() => {
    fetchFeaturedPets()
    
    const params = new URLSearchParams(location.search)
    if (params.get('city')) setSearchLocation(params.get('city'))
    if (params.get('state')) setSearchState(params.get('state'))
    if (params.get('pet_type')) setSearchType(params.get('pet_type'))
  }, [])

  const fetchFeaturedPets = async (filters = {}) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: 12,
        adoption_status: 'AVAILABLE'
      })

      if (filters.city) params.append('city', filters.city)
      if (filters.state) params.append('state', filters.state)
      if (filters.pet_type) params.append('pet_type', filters.pet_type)

      const response = await fetch(`http://localhost:8000/pets?${params}`)
      if (response.ok) {
        const data = await response.json()
        setFeaturedPets(Array.isArray(data) ? data : data.pets || [])
      }
    } catch (error) {
      console.error('Failed to fetch featured pets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const filters = {}
    if (searchLocation.trim()) filters.city = searchLocation.trim()
    if (searchState) filters.state = searchState
    if (searchType) filters.pet_type = searchType
    
    setIsSearchActive(true)
    fetchFeaturedPets(filters)
  }

  const clearSearch = () => {
    setSearchLocation('')
    setSearchType('')
    setSearchState('')
    setIsSearchActive(false)
    fetchFeaturedPets()
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getImageUrl = (photoUrl) => {
    if (!photoUrl) return null
    return photoUrl.startsWith('http') ? photoUrl : `http://localhost:8000${photoUrl}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section 
        className="py-20 relative"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 248, 240, 0.85), rgba(240, 255, 248, 0.85)), url(${pawtnerLoveImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
            <div className="text-center lg:text-left">
              <h1 className="text-7xl font-extrabold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#FF5733] to-[#069494] mb-6">
                Paw-tner
              </h1>
              <p className="text-lg text-gray-700 mb-8">
                Connecting hearts and paws. Start your adoption journey today and bring home a friend for life.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-gradient-to-r from-[#FF8C42] to-[#FF6B6B] text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-orange-300"
                >
                  🐾 Find Your Pet
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="bg-secondary text-white px-8 py-3 rounded-lg font-medium hover:bg-secondary/90 transform transition-all duration-200 ease-in-out hover:scale-105 flex items-center justify-center"
                >
                  🏢 List Your Pets
                </button>
              </div>
            </div>
            
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <img
                  src={pawtnerLoveImage}
                  alt="Paw-tner Love - Happy pets and families"
                  className="rounded-3xl shadow-2xl max-w-full h-auto max-h-96 object-cover border-4 border-white"
                />
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl shadow-lg p-8 max-w-4xl mx-auto mb-8 border-2 border-orange-200">
            <h3 className="text-xl font-bold text-center text-gray-800 mb-6">🔍 Find Your Perfect Pet</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🏙️</span>
                <input
                  type="text"
                  placeholder="Enter city..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm"
                />
              </div>
              
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🗺️</span>
                <select
                  value={searchState}
                  onChange={(e) => setSearchState(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm"
                >
                  <option value=""> All provinces</option>
                  <option value="Punjab">🏛️ Punjab</option>
                  <option value="Sindh">🏖️ Sindh</option>
                  <option value="Khyber Pakhtunkhwa">🏔️ Khyber Pakhtunkhwa</option>
                  <option value="Balochistan">🏜️ Balochistan</option>
                  <option value="Gilgit-Baltistan">⛰️ Gilgit-Baltistan</option>
                  <option value="Azad Kashmir">🌲 Azad Kashmir</option>
                  <option value="Islamabad Capital Territory">🏛️ Islamabad</option>
                </select>
              </div>
              
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🏷️</span>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm"
                >
                  <option value="">🌟 All Pets</option>
                  <option value="dog">🐕 Dogs</option>
                  <option value="cat">🐱 Cats</option>
                  <option value="bird">🐦 Birds</option>
                  <option value="rabbit">🐰 Rabbits</option>
                  <option value="other">🦎 Other</option>
                </select>
              </div>
              
              <button
                onClick={handleSearch}
                className="bg-gradient-to-r from-[#FF8C42] to-[#FF6B6B] text-white px-4 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-orange-500"
              >
                🔍 Search Pets
              </button>
            </div>
          </div>
        </div>
      </section>

      <section 
        className="py-6 relative"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 248, 240, 0.85), rgba(240, 255, 248, 0.85)), url(${pawtnerLoveImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF8C42] to-[#FF6B6B]">
              {isSearchActive ? 'Search Results' : 'Featured Pets Waiting for a Home'}
            </h2>
            {isSearchActive && (
              <button
                onClick={clearSearch}
                className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-4 py-2 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-gray-300"
              >
                🧹 Clear Search
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredPets.map((pet) => (
                <div
                  key={pet.id}
                  className="bg-gradient-to-br from-white to-orange-50 rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 border-2 border-orange-200 group relative"
                  onClick={() => navigate(`/pets/${pet.id}`)}
                >
                  <div className="relative h-48 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                    {pet.primary_photo_url ? (
                      <img
                        src={getImageUrl(pet.primary_photo_url)}
                        alt={pet.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-gray-400 text-6xl">🐾</div>
                    )}
                    
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 transform rotate-45 translate-x-8 -translate-y-8">
                        <span className="absolute bottom-1 right-1 text-white text-xs">❤️</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors duration-200">
                        {pet.name}
                      </h3>
                      <span className="text-2xl">
                        {pet.pet_type === 'dog' ? '🐕' : 
                         pet.pet_type === 'cat' ? '🐱' : 
                         pet.pet_type === 'bird' ? '🐦' : 
                         pet.pet_type === 'rabbit' ? '🐰' : '🐾'}
                      </span>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-2xl px-3 py-2 mb-3 border border-orange-200">
                      <p className="text-sm text-gray-700 font-medium capitalize">
                        {pet.breed || 'Mixed breed'} • {pet.age_years > 0 ? 
                          `${pet.age_years} ${pet.age_years === 1 ? 'year' : 'years'}` : 
                          `${pet.age_months || 0} ${pet.age_months === 1 ? 'month' : 'months'}`}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl px-3 py-1 inline-block border-2 border-green-200 mb-3">
                      <span className="text-sm font-bold text-emerald-600">
                        ✨ Available for adoption!
                      </span>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/pets/${pet.id}`)
                      }}
                      className="w-full bg-gradient-to-r from-orange-400 to-amber-500 text-white py-2 px-4 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-orange-300 group-hover:from-orange-500 group-hover:to-amber-600"
                    >
                      👀 Meet {pet.name}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && featuredPets.length === 0 && isSearchActive && (
            <div className="text-center py-12">
              <div className="text-6xl text-gray-300 mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No pets found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search criteria or browse all available pets</p>
              <button
                onClick={clearSearch}
                className="bg-gradient-to-r from-[#FF8C42] to-[#FF6B6B] text-white px-6 py-2 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-orange-500"
              >
                Show All Pets
              </button>
            </div>
          )}

          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/register')}
              className="bg-gradient-to-r from-[#FF8C42] to-[#FF6B6B] text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 shadow-lg border-2 border-orange-500"
            >
              View All Pets
            </button>
          </div>
        </div>
      </section>

      <section 
        className="py-16 relative"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 248, 240, 0.85), rgba(240, 255, 248, 0.85)), url(${pawtnerLoveImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-[#FF8C42] to-[#FF6B6B] mb-12">
            Adoption Made Easy
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center bg-gradient-to-b from-orange-50 to-white p-6 rounded-3xl shadow-lg hover:shadow-xl transform transition-all duration-200 ease-in-out hover:scale-105 border-2 border-orange-200">
              <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">🔍</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-blue-700">1. Browse & Filter</h3>
              <p className="text-gray-600"> and filter by type, breed, age, and location to find your match.
              </p>
            </div>

            <div className="text-center bg-gradient-to-b from-amber-50 to-white p-6 rounded-3xl shadow-lg hover:shadow-xl transform transition-all duration-200 ease-in-out hover:scale-105 border-2 border-amber-200">
               <div className="bg-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">❤️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-primary">2. Find Perfect Match</h3>
              <p className="text-gray-600">
                Use our smart matching system to get personalized pet recommendations based on your preferences.
              </p>
            </div>

            <div className="text-center bg-gradient-to-b from-red-50 to-white p-6 rounded-3xl shadow-lg hover:shadow-xl transform transition-all duration-200 ease-in-out hover:scale-105 border-2 border-red-200">
             <div className="bg-secondary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">📞</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-secondary">3. Contact Shelter</h3>
              <p className="text-gray-600">
                View shelter contact details and reach out directly to arrange meetings and complete the adoption process.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gradient-to-r from-orange-100 to-amber-200 border-t border-orange-200 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#FF8C42] to-[#FF6B6B]">
                Paw-tner
              </h3>
              <p className="text-gray-700 text-sm">
                Your partner in pet adoption. Connecting hearts and paws to create forever families.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-gray-800">Quick Links</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate('/about')}
                  className="text-left text-gray-700 hover:text-orange-600 font-medium transition-colors text-sm"
                >
                  About
                </button>
                <button
                  onClick={() => navigate('/browse')}
                  className="text-left text-gray-700 hover:text-orange-600 font-medium transition-colors text-sm"
                >
                  Browse Pets
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="text-left text-gray-700 hover:text-orange-600 font-medium transition-colors text-sm"
                >
                  Register
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="text-left text-gray-700 hover:text-orange-600 font-medium transition-colors text-sm"
                >
                  Login
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-gray-700 text-sm">© 2025 Paw-tner. All rights reserved. Made with ❤️ for our furry friends.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home