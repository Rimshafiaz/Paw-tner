import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBanner from '../../components/NotificationBanner'
import shelterBg from '../../assets/paw-tner_shelter.jpg'
import API_URL from '../../config/api'

function ViewPet() {
  const navigate = useNavigate()
  const { petId } = useParams()
  const { currentUser } = useAuth()
  
  const [pet, setPet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ message: '', type: '', show: false })

  const showNotification = (message, type) => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification({ message: '', type: '', show: false })
    }, 5000)
  }

  useEffect(() => {
    fetchPetData()
  }, [petId])

  const fetchPetData = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/pets/${petId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const petData = await response.json()
        setPet(petData)
      } else {
        showNotification('Pet not found', 'error')
        navigate('/shelter/pets/manage')
      }
    } catch (error) {
      showNotification('Failed to load pet data', 'error')
      navigate('/shelter/pets/manage')
    } finally {
      setLoading(false)
    }
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
          <p className="text-gray-600 text-lg">Pet not found</p>
        </div>
      </div>
    )
  }

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <NotificationBanner 
          notification={notification} 
          onClose={() => setNotification({ message: '', type: '', show: false })}
        />

        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate('/shelter/pets/manage')}
            className="text-gray-600 hover:text-gray-800 flex items-center"
          >
            ← Back to Manage Pets
          </button>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/shelter/pets/edit/${petId}`)}
              className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-secondary/80"
            >
              Edit Pet
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold from-[#4ECDC4] to-[#2DD4BF] text-transparent bg-clip-text bg-gradient-to-br mb-2">{pet.name}</h1>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  pet.adoption_status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                  pet.adoption_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  pet.adoption_status === 'ADOPTED' ? 'bg-purple-100 text-purple-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {pet.adoption_status?.replace('_', ' ') || 'Available'}
                </span>
                <span className="text-gray-600">
                  {pet.adoption_fee && Number(pet.adoption_fee) > 0 ? `PKR ${Number(pet.adoption_fee)}` : 'Free'}
                </span>
              </div>
            </div>
            {pet.primary_photo_url ? (
              <img 
                src={`${API_URL}${pet.primary_photo_url}`} 
                alt={pet.name}
                className="w-40 h-40 rounded-xl object-cover shadow-lg"
              />
            ) : (
              <div className="w-40 h-40 rounded-xl bg-gray-200 flex items-center justify-center shadow-lg">
                <span className="text-gray-400 text-sm">No photo</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{pet.pet_type || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Breed:</span>
                    <span className="font-medium">{pet.breed || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-medium">
                      {pet.age_years > 0 ? `${pet.age_years} ${pet.age_years === 1 ? 'year' : 'years'}` : pet.age_months ? `${pet.age_months} ${pet.age_months === 1 ? 'month' : 'months'}` : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{pet.size?.replace('_', ' ') || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight:</span>
                    <span className="font-medium">{pet.weight ? `${pet.weight} kg` : 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Color:</span>
                    <span className="font-medium">{pet.color || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gender:</span>
                    <span className="font-medium">{pet.gender || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Spayed/Neutered:</span>
                    <span className="font-medium">{pet.is_spayed_neutered ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Behavior & Compatibility</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Activity Level:</span>
                    <span className="font-medium">{pet.activity_level?.replace('_', ' ') || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Good with Kids:</span>
                    <span className="font-medium">{pet.good_with_kids ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Good with Dogs:</span>
                    <span className="font-medium">{pet.good_with_dogs ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Good with Cats:</span>
                    <span className="font-medium">{pet.good_with_cats ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Good with Other Animals:</span>
                    <span className="font-medium">{pet.good_with_other_animals ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">House Trained:</span>
                    <span className="font-medium">{pet.house_trained ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Health Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vaccination Status:</span>
                    <span className="font-medium">{pet.vaccination_status || 'Not specified'}</span>
                  </div>
                </div>
              </div>
              
              {pet.medical_history && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Medical History</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{pet.medical_history}</p>
                  </div>
                </div>
              )}
              
              {pet.special_needs && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Special Needs</h3>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800 whitespace-pre-wrap">{pet.special_needs}</p>
                  </div>
                </div>
              )}
            </div>

            {(pet.temperament || pet.description) && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">About {pet.name}</h2>
                
                {pet.temperament && (
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Temperament</h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-blue-800 whitespace-pre-wrap">{pet.temperament}</p>
                    </div>
                  </div>
                )}
                
                {pet.description && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Description</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{pet.description}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Pet ID: {pet.id}</span>
                {pet.created_at && (
                  <span>Listed: {new Date(pet.created_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewPet