import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBanner from '../../components/NotificationBanner'
import PhotoUpload from '../../components/PhotoUpload'

function EditPet() {
  const navigate = useNavigate()
  const { petId } = useParams()
  const { currentUser } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    pet_type: 'DOG',
    breed: '',
    age_years: '',
    age_months: 0,
    size: 'MEDIUM',
    weight: '',
    color: '',
    gender: 'Male',
    is_spayed_neutered: false,
    temperament: '',
    activity_level: 'MODERATE',
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
    adoption_status: 'AVAILABLE',
    shelter_id: currentUser?.allUserData?.id || 0
  })

  const [notification, setNotification] = useState({ message: '', type: '', show: false })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState({})
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(null)

  const showNotification = (message, type) => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification({ message: '', type: '', show: false })
    }, 5000)
  }

  const handlePhotoUploaded = (photoUrl) => {
    setCurrentPhotoUrl(photoUrl)
    showNotification('Photo updated successfully!', 'success')
  }

  const handlePhotoError = (errorMessage) => {
    showNotification(errorMessage, 'error')
  }

  useEffect(() => {
    fetchPetData()
  }, [petId])

  const fetchPetData = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:8000/pets/${petId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const pet = await response.json()
        setFormData({
          name: pet.name || '',
          pet_type: pet.pet_type ? pet.pet_type.toUpperCase() : 'DOG',
          breed: pet.breed || '',
          age_years: pet.age_years || '',
          age_months: pet.age_months || 0,
          size: pet.size ? pet.size.toUpperCase() : 'MEDIUM',
          weight: pet.weight || '',
          color: pet.color || '',
          gender: pet.gender || 'Male',
          is_spayed_neutered: pet.is_spayed_neutered || false,
          temperament: pet.temperament || '',
          activity_level: pet.activity_level ? pet.activity_level.toUpperCase() : 'MODERATE',
          good_with_kids: pet.good_with_kids || false,
          good_with_dogs: pet.good_with_dogs || false,
          good_with_cats: pet.good_with_cats || false,
          good_with_other_animals: pet.good_with_other_animals || false,
          house_trained: pet.house_trained || false,
          medical_history: pet.medical_history || '',
          special_needs: pet.special_needs || '',
          vaccination_status: pet.vaccination_status || 'Up to date',
          adoption_fee: pet.adoption_fee ? pet.adoption_fee.toString() : '',
          description: pet.description || '',
          adoption_status: pet.adoption_status ? pet.adoption_status.toUpperCase() : 'AVAILABLE',
          shelter_id: pet.shelter_id
        })
        
        setCurrentPhotoUrl(pet.primary_photo_url)
      } else {
        showNotification('Pet not found or access denied', 'error')
        navigate('/shelter/pets/manage')
      }
    } catch (error) {
      showNotification('Failed to load pet data', 'error')
      navigate('/shelter/pets/manage')
    } finally {
      setLoading(false)
    }
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
    showNotification('Updating pet information...', 'success')

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
        adoption_status: formData.adoption_status.toLowerCase(),
        age_years: parseInt(formData.age_years),
        age_months: parseInt(formData.age_months) || 0,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        adoption_fee: parseFloat(formData.adoption_fee)
      }

      const response = await fetch(`http://localhost:8000/pets/${petId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(petData)
      })

      if (response.ok) {
        showNotification(`${formData.name} has been updated successfully!`, 'success')
        
        setTimeout(() => {
          navigate('/shelter/pets/manage')
        }, 2000)
      } else {
        const error = await response.json()
        showNotification(error.detail || 'Failed to update pet. Please try again.', 'error')
      }
    } catch (error) {
      showNotification('Network error. Please check your connection and try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading pet information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <NotificationBanner 
          notification={notification} 
          onClose={() => setNotification({ message: '', type: '', show: false })}
        />

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary">Edit Pet: {formData.name}</h1>
            <p className="text-gray-600 mt-2">Update your pet's information</p>
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
                    <option value="DOG">Dog</option>
                    <option value="CAT">Cat</option>
                    <option value="BIRD">Bird</option>
                    <option value="RABBIT">Rabbit</option>
                    <option value="OTHER">Other</option>
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
                    <option value="SMALL">Small</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LARGE">Large</option>
                    <option value="EXTRA_LARGE">Extra Large</option>
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
                    Adoption Status
                  </label>
                  <select
                    name="adoption_status"
                    value={formData.adoption_status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="PENDING">Pending</option>
                    <option value="ADOPTED">Adopted</option>
                    <option value="ON_HOLD">On Hold</option>
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
                    step="1"
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
                    <option value="LOW">Low</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="HIGH">High</option>
                    <option value="VERY_HIGH">Very High</option>
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
              
              <PhotoUpload 
                petId={petId}
                currentPhotoUrl={currentPhotoUrl}
                onPhotoUploaded={handlePhotoUploaded}
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
                onClick={() => navigate('/shelter/pets/manage')}
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
                {isSubmitting ? 'Updating Pet...' : 'Update Pet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditPet