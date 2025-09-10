import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBanner from '../../components/NotificationBanner'

function UserProfile() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  
  const [formData, setFormData] = useState({
    preferred_pet_type: '',
    preferred_age_min: '',
    preferred_age_max: '',
    activity_level: '',
    has_children: false,
    preferred_breeds: [],
    house_type: '',
    has_yard: false,
    experience_level: '',
    has_other_pets: false,
    preferred_pet_size: '',
    max_adoption_fee: '',
    preferred_temperament: [],
    city: '',
    state: '',
    zip_code: '',
    country: 'Pakistan'
  })

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState({ message: '', type: '', show: false })
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState({})

  const showNotification = (message, type) => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification({ message: '', type: '', show: false })
    }, 5000)
  }

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const userId = currentUser?.allUserData?.id

      if (!userId) {
        showNotification('User not found. Please log in again.', 'error')
        return
      }

      const response = await fetch(`http://localhost:8000/users/${userId}/preferences`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const userData = await response.json()
        setFormData({
          preferred_pet_type: userData.preferred_pet_type || '',
          preferred_age_min: userData.preferred_age_min || '',
          preferred_age_max: userData.preferred_age_max || '',
          activity_level: userData.activity_level || '',
          has_children: userData.has_children || false,
          preferred_breeds: userData.preferred_breeds ? (typeof userData.preferred_breeds === 'string' ? JSON.parse(userData.preferred_breeds) : userData.preferred_breeds) : [],
          house_type: userData.house_type || '',
          has_yard: userData.has_yard || false,
          experience_level: userData.experience_level || '',
          has_other_pets: userData.has_other_pets || false,
          preferred_pet_size: userData.preferred_pet_size || '',
          max_adoption_fee: userData.max_adoption_fee || '',
          preferred_temperament: userData.preferred_temperament ? (typeof userData.preferred_temperament === 'string' ? JSON.parse(userData.preferred_temperament) : userData.preferred_temperament) : [],
          city: userData.city || '',
          state: userData.state || '',
          zip_code: userData.zip_code || '',
          country: userData.country || 'Pakistan'
        })
      }
    } catch (error) {
      showNotification('Failed to load profile', 'error')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isSubmitting) return

    setIsSubmitting(true)
    showNotification('Updating your preferences...', 'success')

    try {
      const token = localStorage.getItem('auth_token')
      const userId = currentUser?.allUserData?.id

      if (!userId) {
        showNotification('User not found. Please log in again.', 'error')
        return
      }

      const updateData = {
        ...formData,
        preferred_pet_type: formData.preferred_pet_type || null,
        preferred_pet_size: formData.preferred_pet_size || null,
        activity_level: formData.activity_level || null,
        house_type: formData.house_type || null,
        experience_level: formData.experience_level || null,
        preferred_breeds: formData.preferred_breeds,
        preferred_temperament: formData.preferred_temperament,
        max_adoption_fee: formData.max_adoption_fee ? parseFloat(formData.max_adoption_fee) : null,
        preferred_age_min: formData.preferred_age_min ? parseInt(formData.preferred_age_min) : null,
        preferred_age_max: formData.preferred_age_max ? parseInt(formData.preferred_age_max) : null
      }

      const response = await fetch(`http://localhost:8000/users/${userId}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        showNotification('Preferences updated successfully!', 'success')
        setTimeout(() => {
          navigate('/adopter/dashboard')
        }, 2000)
      } else {
        const error = await response.json()
        const errorMessage = typeof error.detail === 'string' 
          ? error.detail 
          : Array.isArray(error.detail) 
            ? error.detail.map(e => e.msg || e).join(', ')
            : 'Failed to update preferences'
        showNotification(errorMessage, 'error')
      }
    } catch (error) {
      showNotification('Network error. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your preferences...</p>
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold from-[#FF8C42] to-[#FE8B02] text-transparent bg-clip-text bg-gradient-to-br">Your Pet Preferences</h1>
          <p className="text-gray-600 mt-2">
            Help us find the perfect pet for you by sharing your preferences
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Pet Preferences</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Pet Type
                  </label>
                  <select
                    name="preferred_pet_type"
                    value={formData.preferred_pet_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Size
                  </label>
                  <select
                    name="preferred_pet_size"
                    value={formData.preferred_pet_size}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
                  >
                    <option value="">Any size</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra_large">Extra Large</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Age (years)
                  </label>
                  <input
                    type="number"
                    name="preferred_age_min"
                    value={formData.preferred_age_min}
                    onChange={handleChange}
                    min="0"
                    max="20"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
                    placeholder="Any age"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Age (years)
                  </label>
                  <input
                    type="number"
                    name="preferred_age_max"
                    value={formData.preferred_age_max}
                    onChange={handleChange}
                    min="0"
                    max="20"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
                    placeholder="Any age"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Adoption Fee (PKR)
                  </label>
                  <input
                    type="number"
                    name="max_adoption_fee"
                    value={formData.max_adoption_fee}
                    onChange={handleChange}
                    min="0"
                    step="100"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
                    placeholder="No limit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Level
                  </label>
                  <select
                    name="activity_level"
                    value={formData.activity_level}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
                  >
                    <option value="">Any activity level</option>
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                    <option value="very_high">Very High</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Lifestyle & Housing</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Housing Type
                  </label>
                  <select
                    name="house_type"
                    value={formData.house_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
                  >
                    <option value="">Select housing type</option>
                    <option value="apartment">Flat/Apartment</option>
                    <option value="house">House</option>
                    <option value="farm">Farmhouse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    name="experience_level"
                    value={formData.experience_level}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
                  >
                    <option value="">Select experience level</option>
                    <option value="first_time">First-time pet owner</option>
                    <option value="beginner">Some experience with pets</option>
                    <option value="experienced">Very experienced pet owner</option>
                    <option value="professional">Professional/Breeder experience</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="has_children"
                    checked={formData.has_children}
                    onChange={handleChange}
                    className="h-5 w-5 text-primary accent-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <label className="ml-3 text-sm font-medium text-gray-700">
                    I have children at home
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="has_yard"
                    checked={formData.has_yard}
                    onChange={handleChange}
                    className="h-5 w-5 text-primary border-gray-300 rounded accent-primary focus:ring-primary focus:ring-2"
                  />
                  <label className="ml-3 text-sm font-medium text-gray-700">
                    I have a yard or outdoor space
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="has_other_pets"
                    checked={formData.has_other_pets}
                    onChange={handleChange}
                    className="h-5 w-5 text-primary accent-secondary border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <label className="ml-3 text-sm font-medium text-gray-700">
                    I already have other pets
                  </label>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Location</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
                    placeholder="Your city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Province
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
                  >
                    <option value="">Select province</option>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
                    placeholder="54000"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/adopter/dashboard')}
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-300/80 transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-medium transition-colors ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed opacity-75' 
                    : 'bg-primary text-white hover:bg-primary/80'
                }`}
              >
                {isSubmitting ? 'Saving Preferences' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UserProfile