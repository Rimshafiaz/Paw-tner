import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBanner from '../../components/NotificationBanner'

function ShelterProfile() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contact_hours: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Pakistan',
    description: '',
    capacity: '',
    license_number: ''
  })

  const [notification, setNotification] = useState({ message: '', type: '', show: false })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState({})

  const showNotification = (message, type) => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification({ message: '', type: '', show: false })
    }, 5000)
  }

  useEffect(() => {
    fetchShelterProfile()
  }, [])

  const fetchShelterProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const shelterId = currentUser?.allUserData?.user_id || currentUser?.allUserData?.id
      
      if (!shelterId) return
      
      const response = await fetch(`http://localhost:8000/shelters/${shelterId}/basic`)

      if (response.ok) {
        const shelter = await response.json()
        setFormData({
          name: shelter.name || '',
          email: shelter.email || '',
          phone: shelter.phone || '',
          contact_hours: shelter.contact_hours || '',
          website: shelter.website || '',
          address: shelter.address || '',
          city: shelter.city || '',
          state: shelter.state || '',
          zip_code: shelter.zip_code || '',
          country: shelter.country || 'Pakistan',
          description: shelter.description || '',
          capacity: shelter.capacity || '',
          license_number: shelter.license_number || ''
        })
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) newErrors.name = 'Shelter name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required for adopter contact'
    } else {
      const phoneRegex = /^(\+92|0)?3[0-9]{9}$/
      if (!phoneRegex.test(formData.phone.replace(/[\s-]/g, ''))) {
        newErrors.phone = 'Please enter a valid Pakistani mobile number (e.g., +92-300-1234567 or 03001234567)'
      }
    }
    
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (!formData.state.trim()) newErrors.state = 'Province is required'
    if (!formData.contact_hours.trim()) newErrors.contact_hours = 'Contact hours are required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm() || isSubmitting) return

    setIsSubmitting(true)
    showNotification('Updating your shelter profile', 'success')

    try {
      const token = localStorage.getItem('auth_token')
      const shelterId = currentUser?.allUserData?.user_id || currentUser?.allUserData?.id

      if (!shelterId) {
        showNotification('Unable to identify shelter. Please log in again.', 'error')
        return
      }

      const profileData = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null
      }

      const response = await fetch(`http://localhost:8000/shelters/${shelterId}/profile`, {
        method: 'PUT',

        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        showNotification('Profile updated successfully!', 'success')
        
        setTimeout(() => {
          navigate('/shelter/dashboard')
        }, 2000)
      } else {
        const error = await response.json()
        let errorMessage = 'Failed to update profile. Please try again.'
        
        if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail
          } else if (Array.isArray(error.detail)) {
            errorMessage = error.detail.map(err => err.msg || err).join(', ')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your profile...</p>
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
            <h1 className="text-3xl font-bold from-[#4ECDC4] to-[#2DD4BF] text-transparent bg-clip-text bg-gradient-to-br">Shelter Profile</h1>
            <p className="text-gray-600 mt-2">
              Complete your shelter profile to start listing pets for adoption
            </p>
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-amber-800 text-sm">
                <strong>Important:</strong> Please provide accurate contact information so adopters can reach you easily.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shelter Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                      errors.name ? 'focus:ring-red-500 ring-2 ring-red-500' : 'focus:ring-secondary'
                    }`}
                    placeholder="Enter shelter name"
                    required
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                      errors.email ? 'focus:ring-red-500 ring-2 ring-red-500' : 'focus:ring-secondary'
                    }`}
                    placeholder="Enter shelter email address"
                    required
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                      errors.phone ? 'focus:ring-red-500 ring-2 ring-red-500' : 'focus:ring-secondary'
                    }`}
                    placeholder="+92..."
                    required
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Hours *
                  </label>
                  <input
                    type="text"
                    name="contact_hours"
                    value={formData.contact_hours}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                      errors.contact_hours ? 'focus:ring-red-500 ring-2 ring-red-500' : 'focus:ring-secondary'
                    }`}
                    placeholder="Mon-Fri 9AM-5PM, Sat 10AM-3PM"
                    required
                  />
                  {errors.contact_hours && <p className="text-red-500 text-sm mt-1">{errors.contact_hours}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                    placeholder="https://www.yourshelter.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Number
                  </label>
                  <input
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                    placeholder="Shelter license number"
                  />
                </div>
              </div>
            </div>

           
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Location</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                      errors.city ? 'focus:ring-red-500 ring-2 ring-red-500' : 'focus:ring-secondary'
                    }`}
                    placeholder="City name"
                    required
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Province *
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                      errors.state ? 'focus:ring-red-500 ring-2 ring-red-500' : 'focus:ring-secondary'
                    }`}
                    required
                  >
                    <option value="">Select Province</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                    <option value="Azad Kashmir">Azad Kashmir</option>
                    <option value="Islamabad Capital Territory">Islamabad Capital Territory</option>
                  </select>
                  {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
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
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                    placeholder="54000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Additional Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                    placeholder="Maximum number of animals"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shelter Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors resize-none"
                    placeholder="Tell potential adopters about your shelter, mission, and approach to animal care..."
                  />
                </div>
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
                {isSubmitting ? 'Updating Profile' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ShelterProfile