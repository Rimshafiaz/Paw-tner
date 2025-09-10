import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBanner from '../../components/NotificationBanner'
import adopterPawtnerImage from '../../assets/adopter paw-tner.jpg'

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
        showNotification('Preferences updated successfully! 🎉', 'success')
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
      <div className="min-h-screen flex items-center justify-center" style={{
        backgroundImage: `linear-gradient(rgba(255, 248, 240, 0.85), rgba(240, 255, 248, 0.85)), url(${adopterPawtnerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading your preferences... ✨</p>
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <NotificationBanner 
          notification={notification} 
          onClose={() => setNotification({ message: '', type: '', show: false })}
        />

        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <span className="text-6xl animate-bounce">🎯</span>
            <span className="text-6xl animate-pulse mx-4">⚙️</span>
            <span className="text-6xl animate-bounce">✨</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] mb-4 drop-shadow-lg animate-pulse">
            Your Pet Preferences
          </h1>
          <p className="text-xl text-gray-700 mb-8 font-medium">
            🌟 Help us find the perfect pet for you by sharing your preferences 🌟
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/adopter/dashboard')}
            className="bg-gradient-to-r from-purple-400 to-pink-500 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all duration-200 flex items-center shadow-lg border-2 border-purple-300"
          >
            🏠 ← Back to Dashboard
          </button>
        </div>

        <div className="bg-gradient-to-br from-white to-pink-50 rounded-3xl shadow-xl p-8 border-2 border-pink-200">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Pet Preferences Section */}
            <div className="border-b border-pink-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-3">🐕</span>
                Pet Preferences
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🏷️</span>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Pet Type
                  </label>
                  <select
                    name="preferred_pet_type"
                    value={formData.preferred_pet_type}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-pink-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                  >
                    <option value="">🌟 Any pet type</option>
                    <option value="dog">🐕 Dog</option>
                    <option value="cat">🐱 Cat</option>
                    <option value="bird">🐦 Bird</option>
                    <option value="rabbit">🐰 Rabbit</option>
                    <option value="other">🦎 Other</option>
                  </select>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">📏</span>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Size
                  </label>
                  <select
                    name="preferred_pet_size"
                    value={formData.preferred_pet_size}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-green-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary bg-white shadow-sm"
                  >
                    <option value="">📏 Any size</option>
                    <option value="small">🐁 Small</option>
                    <option value="medium">🐕 Medium</option>
                    <option value="large">🐕‍🦺 Large</option>
                    <option value="extra_large">🐘 Extra Large</option>
                  </select>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🎂</span>
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
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-yellow-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                    placeholder="Any age"
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🎈</span>
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
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-yellow-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                    placeholder="Any age"
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">💰</span>
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
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-green-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary bg-white shadow-sm"
                    placeholder="No limit"
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">⚡</span>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Level
                  </label>
                  <select
                    name="activity_level"
                    value={formData.activity_level}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-blue-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                  >
                    <option value="">⚡ Any activity level</option>
                    <option value="low">😴 Low</option>
                    <option value="moderate">🚶 Moderate</option>
                    <option value="high">🏃 High</option>
                    <option value="very_high">⚡ Very High</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lifestyle & Housing Section */}
            <div className="border-b border-pink-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-3">🏠</span>
                Lifestyle & Housing
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🏡</span>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Housing Type
                  </label>
                  <select
                    name="house_type"
                    value={formData.house_type}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-purple-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary bg-white shadow-sm"
                  >
                    <option value="">🏡 Select housing type</option>
                    <option value="apartment">🏢 Flat/Apartment</option>
                    <option value="house">🏠 House</option>
                    <option value="farm">🌾 Farmhouse</option>
                  </select>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🎓</span>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    name="experience_level"
                    value={formData.experience_level}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-orange-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                  >
                    <option value="">🎓 Select experience level</option>
                    <option value="first_time">👶 First-time pet owner</option>
                    <option value="beginner">🙂 Some experience with pets</option>
                    <option value="experienced">👍 Very experienced pet owner</option>
                    <option value="professional">🏆 Professional/Breeder experience</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-4 border-2 border-pink-200">
                  <input
                    type="checkbox"
                    name="has_children"
                    checked={formData.has_children}
                    onChange={handleChange}
                    className="h-6 w-6 text-primary accent-primary border-gray-300 rounded-full focus:ring-primary focus:ring-2"
                  />
                  <label className="ml-3 text-sm font-medium text-gray-700">
                    👶 I have children at home
                  </label>
                </div>

                <div className="flex items-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-200">
                  <input
                    type="checkbox"
                    name="has_yard"
                    checked={formData.has_yard}
                    onChange={handleChange}
                    className="h-6 w-6 text-primary accent-primary border-gray-300 rounded-full focus:ring-primary focus:ring-2"
                  />
                  <label className="ml-3 text-sm font-medium text-gray-700">
                    🌳 I have a yard or outdoor space
                  </label>
                </div>

                <div className="flex items-center bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200">
                  <input
                    type="checkbox"
                    name="has_other_pets"
                    checked={formData.has_other_pets}
                    onChange={handleChange}
                    className="h-6 w-6 text-primary accent-primary border-gray-300 rounded-full focus:ring-primary focus:ring-2"
                  />
                  <label className="ml-3 text-sm font-medium text-gray-700">
                    🐾 I already have other pets
                  </label>
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="border-b border-pink-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-3">📍</span>
                Location
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🏙️</span>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-purple-200 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary bg-white shadow-sm"
                    placeholder="Your city"
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🗺️</span>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Province
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-orange-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                  >
                    <option value="">🗺️ Select province</option>
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
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">📮</span>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-blue-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white shadow-sm"
                    placeholder="54000"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-pink-200">
              <button
                type="button"
                onClick={() => navigate('/adopter/dashboard')}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-2xl font-bold hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-lg border-2 border-gray-300"
              >
                ❌ Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center shadow-lg border-2 ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed opacity-75 border-gray-300' 
                    : 'bg-gradient-to-r from-primary to-secondary text-white hover:scale-105 border-primary'
                }`}
              >
                {isSubmitting ? '💾 Saving Preferences...' : '💾 Save Preferences'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UserProfile