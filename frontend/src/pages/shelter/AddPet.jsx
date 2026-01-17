import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBanner from '../../components/NotificationBanner'
import PhotoSelector from '../../components/PhotoSelector'
import shelterBg from '../../assets/paw-tner_shelter.jpg'
import API_URL from '../../config/api'

function AddPet() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    pet_type: 'dog',
    breed: '',
    age_years: '',
    age_months: 0,
    size: 'medium',
    weight: '',
    color: '',
    gender: 'Male',
    is_spayed_neutered: false,
    temperament: '',
    activity_level: 'moderate',
    good_with_kids: false,
    good_with_dogs: false,
    good_with_cats: false,
    good_with_other_animals: false,
    house_trained: false,
    medical_history: '',
    special_needs: '',
    vaccination_status: 'Up to date',
    adoption_fee: '',
    description: '',
    shelter_id: currentUser?.allUserData?.id || 0
  })

  const [notification, setNotification] = useState({ message: '', type: '', show: false })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [overrideDuplicate, setOverrideDuplicate] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [createdPetId, setCreatedPetId] = useState(null)

  const showNotification = (message, type) => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification({ message: '', type: '', show: false })
    }, 5000)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handlePhotoSelected = (file) => {
    setSelectedPhoto(file)
  }

  const handlePhotoError = (errorMessage) => {
    showNotification(errorMessage, 'error')
  }

  const uploadPhotoAfterPetCreated = async (petId, photoFile) => {
    try {
      const token = localStorage.getItem('auth_token')
      const formData = new FormData()
      formData.append('file', photoFile)
      
      const response = await fetch(`${API_URL}/pets/${petId}/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        return await response.json()
      } else {
        throw new Error('Photo upload failed')
      }
    } catch (error) {
      throw error
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) newErrors.name = 'Pet name is required'
    if (!formData.age_years || formData.age_years < 0) newErrors.age_years = 'Valid age is required'
    if (!formData.temperament.trim()) newErrors.temperament = 'Temperament is required'
    if (!formData.adoption_fee || formData.adoption_fee < 0) newErrors.adoption_fee = 'Valid adoption fee is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm() || isSubmitting) return

    setIsSubmitting(true)
    showNotification('Adding pet to your shelter...', 'success')

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Authentication required')
      }

      const petData = {
        ...formData,
        pet_type: formData.pet_type.toLowerCase(),
        size: formData.size.toLowerCase(),
        activity_level: formData.activity_level.toLowerCase(),
        age_years: parseInt(formData.age_years),
        age_months: parseInt(formData.age_months) || 0,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        adoption_fee: parseFloat(formData.adoption_fee),
        shelter_id: currentUser?.allUserData?.user_id || currentUser?.allUserData?.id
      }

      
      const url = `${API_URL}/pets${overrideDuplicate ? '?override_duplicate=true' : ''}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(petData)
      })

      if (response.ok) {
        const petResponse = await response.json()
        const petId = petResponse.pet_id || petResponse.id
        
        if (selectedPhoto && petId) {
          try {
            showNotification(`${formData.name} added! Now uploading photo...`, 'success')
            await uploadPhotoAfterPetCreated(petId, selectedPhoto)
            showNotification(`${formData.name} has been added successfully with photo!`, 'success')
          } catch (photoError) {
            showNotification(`${formData.name} was added, but photo upload failed. You can add a photo later by editing the pet.`, 'warning')
          }
        } else {
          showNotification(`${formData.name} has been added successfully!`, 'success')
        }
        
        setTimeout(() => {
          navigate('/shelter/dashboard')
        }, 2000)
      } else if (response.status === 409) {
        const duplicateData = await response.json()
        setDuplicateWarning(duplicateData.detail)
        showNotification('Similar pets found. Please review and confirm.', 'warning')
      } else if (response.status === 403) {
        const limitData = await response.json()
        if (limitData.detail.type === 'similarity_limit_exceeded') {
          showNotification(`Cannot add pet: ${limitData.detail.message}`, 'error')
        } else {
          showNotification('Access denied. Please check your permissions.', 'error')
        }
      } else {
        const error = await response.json()
        let errorMessage = 'Failed to add pet. Please try again.'
        
        if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail
          } else if (Array.isArray(error.detail)) {
            errorMessage = error.detail.map(err => err.msg || err).join(', ')
          } else if (error.detail.message) {
            errorMessage = error.detail.message
          }
        }
        
        showNotification(errorMessage, 'error')
      }
    } catch (error) {
      showNotification('Network error. Please check your connection and try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOverride = () => {
    setOverrideDuplicate(true)
    setDuplicateWarning(null)
    handleSubmit({ preventDefault: () => {} })
  }

  const handleCancelOverride = () => {
    setDuplicateWarning(null)
    setOverrideDuplicate(false)
  }

  const DuplicateWarningModal = ({ duplicateData, onOverride, onCancel }) => {
    if (!duplicateData) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-secondary mb-2">Similar Pets Found</h2>
            <p className="text-gray-600">
              We found {duplicateData.similar_pets?.length || 0} pet(s) that are very similar to the one you're trying to add.
              Please review them to make sure you're not creating a duplicate listing.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Similar Pets:</h3>
            <div className="space-y-3">
              {duplicateData.similar_pets?.map((pet) => (
                <div key={pet.pet_id} className="bg-gray-50 rounded-xl p-4 border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{pet.name}</h4>
                      <p className="text-sm text-gray-600">{pet.breed}</p>
                      <p className="text-sm text-gray-600">{pet.age_display}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                        {pet.similarity_score}% similar
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {duplicateData.high_similarity_count !== undefined && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> You currently have {duplicateData.high_similarity_count} pet(s) with 90%+ similarity. 
                Adding more highly similar pets may affect your listing visibility.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel & Review
            </button>
            <button
              onClick={onOverride}
              className="flex-1 px-6 py-3 bg-secondary text-white rounded-xl font-medium hover:bg-secondary/80 transition-colors"
            >
              Continue Anyway
            </button>
          </div>
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

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold from-[#4ECDC4] to-[#2DD4BF] text-transparent bg-clip-text bg-gradient-to-br">Add New Pet</h1>
            <p className="text-gray-600 mt-2">List a new pet for adoption at your shelter</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pet Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                      errors.name ? 'focus:ring-red-500 ring-2 ring-red-500' : 'focus:ring-secondary'
                    }`}
                    placeholder="Enter pet's name"
                    required
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pet Type *
                  </label>
                  <select
                    name="pet_type"
                    value={formData.pet_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                    required
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="bird">Bird</option>
                    <option value="rabbit">Rabbit</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Breed
                  </label>
                  <input
                    type="text"
                    name="breed"
                    value={formData.breed}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                    placeholder="Enter breed (e.g., Golden Retriever)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age (Years) *
                  </label>
                  <input
                    type="number"
                    name="age_years"
                    value={formData.age_years}
                    onChange={handleChange}
                    min="0"
                    max="25"
                    className={`w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                      errors.age_years ? 'focus:ring-red-500 ring-2 ring-red-500' : 'focus:ring-secondary'
                    }`}
                    placeholder="Age in years"
                    required
                  />
                  {errors.age_years && <p className="text-red-500 text-sm mt-1">{errors.age_years}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age (Months)
                  </label>
                  <input
                    type="number"
                    name="age_months"
                    value={formData.age_months}
                    onChange={handleChange}
                    min="0"
                    max="11"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                    placeholder="Additional months"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size *
                  </label>
                  <select
                    name="size"
                    value={formData.size}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                    required
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra_large">Extra Large</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                    placeholder="Weight in kilograms"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                    placeholder="Primary color (e.g., Brown, Black, White)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adoption Fee (PKR) *
                  </label>
                  <input
                    type="number"
                    name="adoption_fee"
                    value={formData.adoption_fee}
                    onChange={handleChange}
                    min="0"
                    step="100"
                    className={`w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                      errors.adoption_fee ? 'focus:ring-red-500 ring-2 ring-red-500' : 'focus:ring-secondary'
                    }`}
                    placeholder="Enter amount in PKR (e.g., 5000)"
                    required
                  />
                  {errors.adoption_fee && <p className="text-red-500 text-sm mt-1">{errors.adoption_fee}</p>}
                </div>
              </div>
            </div>

            
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Characteristics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperament *
                  </label>
                  <input
                    type="text"
                    name="temperament"
                    value={formData.temperament}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                      errors.temperament ? 'focus:ring-red-500 ring-2 ring-red-500' : 'focus:ring-secondary'
                    }`}
                    placeholder="e.g., Friendly, Energetic, Calm"
                    required
                  />
                  {errors.temperament && <p className="text-red-500 text-sm mt-1">{errors.temperament}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Level
                  </label>
                  <select
                    name="activity_level"
                    value={formData.activity_level}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                  >
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                    <option value="very_high">Very High</option>
                  </select>
                </div>
              </div>

              
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Pet Compatibility</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="good_with_kids"
                      checked={formData.good_with_kids}
                      onChange={handleChange}
                      className="w-5 h-5 accent-secondary focus:ring-secondary border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">Good with children</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="good_with_dogs"
                      checked={formData.good_with_dogs}
                      onChange={handleChange}
                      className="w-5 h-5 accent-secondary focus:ring-secondary border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">Good with dogs</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="good_with_cats"
                      checked={formData.good_with_cats}
                      onChange={handleChange}
                      className="w-5 h-5 accent-secondary focus:ring-secondary border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">Good with cats</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="good_with_other_animals"
                      checked={formData.good_with_other_animals}
                      onChange={handleChange}
                      className="w-5 h-5 accent-secondary focus:ring-secondary border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">Good with other animals</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="house_trained"
                      checked={formData.house_trained}
                      onChange={handleChange}
                      className="w-5 h-5 accent-secondary focus:ring-secondary border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">House trained</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_spayed_neutered"
                      checked={formData.is_spayed_neutered}
                      onChange={handleChange}
                      className="w-5 h-5 accent-secondary focus:ring-secondary border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">Spayed/Neutered</span>
                  </label>
                </div>
              </div>
            </div>

            
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Health & Medical</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vaccination Status
                  </label>
                  <select
                    name="vaccination_status"
                    value={formData.vaccination_status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                  >
                    <option value="Up to date">Up to date</option>
                    <option value="Partially vaccinated">Partially vaccinated</option>
                    <option value="Not vaccinated">Not vaccinated</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical History
                  </label>
                  <textarea
                    name="medical_history"
                    value={formData.medical_history}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors resize-none"
                    placeholder="Any medical conditions, treatments, or health notes..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Needs
                  </label>
                  <textarea
                    name="special_needs"
                    value={formData.special_needs}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors resize-none"
                    placeholder="Any special care requirements, disabilities, or accommodations needed..."
                  />
                </div>
              </div>
            </div>

            
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Pet Photo</h2>
              
              <PhotoSelector 
                onPhotoSelected={handlePhotoSelected}
                onError={handlePhotoError}
              />
            </div>

           
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Pet Description</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="5"
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors resize-none"
                  placeholder="Tell potential adopters about this pet's personality, favorite activities, ideal home, and what makes them special..."
                />
              </div>
            </div>

            
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/shelter/dashboard')}
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-medium transition-colors ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed opacity-75' 
                    : 'bg-secondary text-white hover:bg-secondary/80'
                }`}
              >
                {isSubmitting ? 'Adding Pet' : 'Add Pet'}
              </button>
            </div>
          </form>
        </div>

        <DuplicateWarningModal 
          duplicateData={duplicateWarning}
          onOverride={handleOverride}
          onCancel={handleCancelOverride}
        />
      </div>
    </div>
  )
}

export default AddPet