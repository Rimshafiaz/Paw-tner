import { useState } from 'react'
import { validateEmail } from '../../../utils/validation'
import NotificationBanner from '../../../components/NotificationBanner'
import shelterBg from '../../../assets/paw-tner_shelter.jpg'
import API_URL from '../../../config/api'

function ShelterRegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    country: 'Pakistan',
    city: '',
    state: '',
    zip_code: ''
  })
  
  const [errors, setErrors] = useState({})
  const [notification, setNotification] = useState({ message: '', type: '', show: false })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailValidation, setEmailValidation] = useState({ isValid: true, message: '' })


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    
    if (e.target.name === 'email') {
      const validation = validateEmail(e.target.value)
      setEmailValidation(validation)
    }
    
    if (e.target.name === 'confirm_password' || e.target.name === 'password') {
      setErrors({
        ...errors,
        password_match: formData.password !== formData.confirm_password
      })
    }
  }

  const showNotification = (message, type) => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification({ message: '', type: '', show: false })
    }, 5000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isSubmitting) return
    
    if (formData.password !== formData.confirm_password) {
      showNotification('Passwords do not match', 'error')
      return
    }

    if (!emailValidation.isValid) {
      showNotification('Please enter a valid email address', 'error')
      return
    }

    setIsSubmitting(true)
    showNotification('Creating your shelter account...', 'success')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      const registrationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        country: formData.country
      }

      const response = await fetch(`${API_URL}/shelters/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (response.ok) {
        const result = await response.json()
        showNotification('Shelter registered successfully!', 'success')
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else {
        const error = await response.json()
        showNotification(error.detail || 'Registration failed. Please check your information and try again.', 'error')
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        showNotification('Request timeout. Please check your connection and try again.', 'error')
      } else {
        showNotification('Connection failed. Please check your internet and try again.', 'error')
      }
    } finally {
      setIsSubmitting(false)
    }
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
      <div className="max-w-lg mx-auto px-4">
        <NotificationBanner 
          notification={notification} 
          onClose={() => setNotification({ message: '', type: '', show: false })}
        />
        
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-8 border border-secondary/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary mb-2">Register Your Shelter</h1>
          <p className="text-gray-600">Turn your rescue missions into family reunions.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Shelter Name"
              className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
              required
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              className={`w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                formData.email && !emailValidation.isValid
                  ? 'focus:ring-error ring-2 ring-error'
                  : 'focus:ring-secondary'
              }`}
              required
            />
            {formData.email && !emailValidation.isValid && (
              <p className="text-error text-sm mt-1">{emailValidation.message}</p>
            )}
          </div>

          <div>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
              required
            />
          </div>

          <div>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Pakistan"
              className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
              readOnly
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
                className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                required
              />
            </div>
            <div>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
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
            </div>
            <div>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                placeholder="Postal Code"
                className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-colors"
              required
            />
          </div>

          <div>
            <input
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="Confirm Password"
              className={`w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                formData.confirm_password && formData.password !== formData.confirm_password 
                  ? 'focus:ring-error ring-2 ring-error' 
                  : 'focus:ring-secondary'
              }`}
              required
            />
            {formData.confirm_password && formData.password !== formData.confirm_password && (
              <p className="text-error text-sm mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-colors mt-4 ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed opacity-75' 
                : 'bg-secondary text-white hover:bg-secondary/80'
            }`}
          >
            {isSubmitting ? 'Creating Shelter Account...' : 'Register Shelter'}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-secondary font-medium hover:underline">
              Sign in
            </a>
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}

export default ShelterRegistrationForm