import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isShelterProfileComplete, getMissingRequiredFields } from '../../utils/shelterProfile'
import shelterBg from '../../assets/paw-tner_shelter.jpg'

function ShelterDashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    recentPets: [],
    shelter: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      const shelterId = currentUser?.allUserData?.user_id || currentUser?.allUserData?.id
      if (!shelterId) return

      const token = localStorage.getItem('auth_token')
      if (!token) {
        setDashboardData(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'No authentication token found' 
        }))
        return
      }

      try {
        const [statsResponse, petsResponse, shelterResponse] = await Promise.all([
          fetch(`http://localhost:8000/shelters/${shelterId}/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`http://localhost:8000/pets?shelter_id=${shelterId}&limit=6`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`http://localhost:8000/shelters/${shelterId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        if (!statsResponse.ok) {
          throw new Error(`Stats API error: ${statsResponse.status}`)
        }

        const stats = await statsResponse.json()
        const petsData = petsResponse.ok ? await petsResponse.json() : { pets: [] }
        const shelter = shelterResponse.ok ? await shelterResponse.json() : null

        setDashboardData({
          stats,
          recentPets: petsData.pets || [],
          shelter,
          loading: false,
          error: null
        })
      } catch (error) {
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }))
      }
    }

    fetchDashboardData()
  }, [currentUser])

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

  if (dashboardData.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (dashboardData.error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-red-800 font-semibold mb-2">Unable to load dashboard</h2>
            <p className="text-red-600">{dashboardData.error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { stats, shelter } = dashboardData
  const isProfileComplete = isShelterProfileComplete(shelter)
  const missingFields = getMissingRequiredFields(shelter)

  return (
    <div 
      className="min-h-screen py-8 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(240, 253, 252, 0.85), rgba(236, 252, 250, 0.85)), url(${shelterBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold from-[#4ECDC4] to-[#2DD4BF] text-transparent bg-clip-text bg-gradient-to-br">
             {(stats?.shelter_name || currentUser?.name).toUpperCase()}
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your shelter and help pets find loving homes.
          </p>
        </div>

        {!isProfileComplete && (
          <div className="mb-8 bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-amber-800">
                  Complete Your Profile to Start Listing Pets
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    Your shelter profile is missing some required information. Adopters need this information to contact you about pets.
                  </p>
                  <div className="mt-2">
                    <p className="font-medium">Missing information:</p>
                    <ul className="list-disc list-inside mt-1">
                      {missingFields.map((field, index) => (
                        <li key={index}>{field}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => navigate('/shelter/profile')}
                    className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors"
                  >
                    Complete Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white/95 backdrop-blur-sm p-4 md:p-6 rounded-xl shadow-lg border-l-4 border-secondary hover:shadow-xl hover:scale-105 transition-all duration-200">
            <h3 className="text-sm md:text-lg font-semibold text-gray-800 mb-2">Total Pets</h3>
            <div className="text-2xl md:text-3xl font-bold text-secondary mb-1">
              {stats?.total_pets || 0}
            </div>
            <p className="text-gray-600 text-xs md:text-sm">All pets in your shelter</p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm p-4 md:p-6 rounded-xl shadow-lg border-l-4 border-green-500 hover:shadow-xl hover:scale-105 transition-all duration-200">
            <h3 className="text-sm md:text-lg font-semibold text-gray-800 mb-2">Available</h3>
            <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">
              {stats?.available_pets || 0}
            </div>
            <p className="text-gray-600 text-xs md:text-sm">Ready for adoption</p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm p-4 md:p-6 rounded-xl shadow-lg border-l-4 border-amber-500 hover:shadow-xl hover:scale-105 transition-all duration-200">
            <h3 className="text-sm md:text-lg font-semibold text-gray-800 mb-2">Pending</h3>
            <div className="text-2xl md:text-3xl font-bold text-amber-600 mb-1">
              {stats?.pending_pets || 0}
            </div>
            <p className="text-gray-600 text-xs md:text-sm">In adoption process</p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm p-4 md:p-6 rounded-xl shadow-lg border-l-4 border-purple-500 hover:shadow-xl hover:scale-105 transition-all duration-200">
            <h3 className="text-sm md:text-lg font-semibold text-gray-800 mb-2">Adopted</h3>
            <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">
              {stats?.adopted_pets || 0}
            </div>
            <p className="text-gray-600 text-xs md:text-sm">Successfully adopted</p>
          </div>
        </div>
        
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="bg-white/95 backdrop-blur-sm p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group border border-secondary/10">
            <div className="flex items-center mb-3">
              <div className="bg-secondary/10 p-2 rounded-lg mr-3">
                <span className="text-xl">➕</span>
              </div>
              <h3 className="text-sm md:text-lg font-semibold text-gray-800 group-hover:text-secondary transition-colors duration-200">Add New Pet</h3>
            </div>
            <p className="text-gray-600 text-xs md:text-sm mb-4">
              List a new pet for adoption
            </p>
            <button 
              onClick={() => {
                if (isProfileComplete) {
                  navigate('/shelter/pets/add')
                } else {
                  navigate('/shelter/profile')
                }
              }}
              className={`w-full py-2 px-4 rounded-xl font-medium transition-all duration-200 ${
                isProfileComplete 
                  ? 'bg-gradient-to-r from-secondary to-secondary/80 text-white hover:shadow-md' 
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              {isProfileComplete ? 'Add Pet' : 'Complete Profile First'}
            </button>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group border border-secondary/10">
            <div className="flex items-center mb-3">
              <div className="bg-secondary/10 p-2 rounded-lg mr-3">
                <span className="text-xl">📋</span>
              </div>
              <h3 className="text-sm md:text-lg font-semibold text-gray-800 group-hover:text-secondary transition-colors duration-200">Manage Pets</h3>
            </div>
            <p className="text-gray-600 text-xs md:text-sm mb-4">
              View and edit your pet listings
            </p>
            <button 
              onClick={() => navigate('/shelter/pets/manage')}
              className="w-full bg-gradient-to-r from-secondary to-secondary/80 text-white py-2 px-4 rounded-xl hover:shadow-md transition-all duration-200"
            >
              Manage Pets
            </button>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm p-4 md:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group border border-secondary/10">
            <div className="flex items-center mb-3">
              <div className="bg-secondary/10 p-2 rounded-lg mr-3">
                <span className="text-xl">🏢</span>
              </div>
              <h3 className="text-sm md:text-lg font-semibold text-gray-800 group-hover:text-secondary transition-colors duration-200">Shelter Profile</h3>
            </div>
            <p className="text-gray-600 text-xs md:text-sm mb-4">
              Update your contact information and details
            </p>
            <button 
              onClick={() => navigate('/shelter/profile')}
              className={`w-full py-2 px-4 rounded-xl font-medium transition-all duration-200 ${
                isProfileComplete
                  ? 'bg-gradient-to-r from-secondary to-secondary/80 text-white hover:shadow-md'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200 ring-2 ring-amber-300'
              }`}
            >
              {isProfileComplete ? 'Edit Profile' : 'Complete Profile'}
            </button>
          </div>
        </div>

        
        {dashboardData.recentPets.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Recent Pet Listings</h2>
              <button 
                onClick={() => navigate('/shelter/pets/manage')}
                className="text-secondary hover:text-secondary/80 hover:underline text-sm font-medium transition-colors duration-200"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboardData.recentPets.slice(0, 3).map((pet) => (
                <div key={pet.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-secondary/30 transition-all duration-200 cursor-pointer group">
                  <div onClick={() => navigate(`/shelter/pets/view/${pet.id}`)}>
                    {pet.primary_photo_url ? (
                      <div className="w-full h-40 bg-gray-50 rounded-t-lg flex items-center justify-center">
                        <img 
                          src={`http://localhost:8000${pet.primary_photo_url}`} 
                          alt={pet.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-gray-100 flex items-center justify-center rounded-t-lg">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🐾</div>
                          <span className="text-gray-400 text-sm">No photo</span>
                        </div>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800">{pet.name}</h3>
                      <p className="text-gray-600 text-sm">{pet.breed} • {pet.age_years > 0 ? `${pet.age_years} ${pet.age_years === 1 ? 'year' : 'years'}` : `${pet.age_months || 0} ${pet.age_months === 1 ? 'month' : 'months'}`}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(pet.adoption_status)}`}>
                          {pet.adoption_status?.charAt(0).toUpperCase() + pet.adoption_status?.slice(1).toLowerCase() || 'Available'}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/shelter/pets/edit/${pet.id}`);
                          }}
                          className="text-secondary text-sm hover:underline"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        
        {dashboardData.recentPets.length === 0 && stats?.total_pets === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">🐾</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No pets listed yet</h3>
            <p className="text-gray-600 mb-6">
              Get started by adding your first pet for adoption
            </p>
            <button 
              onClick={() => {
                if (isProfileComplete) {
                  navigate('/shelter/pets/add')
                } else {
                  navigate('/shelter/profile')
                }
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isProfileComplete 
                  ? 'bg-secondary text-white hover:bg-secondary/90' 
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              {isProfileComplete ? 'Add Your First Pet' : 'Complete Profile First'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ShelterDashboard