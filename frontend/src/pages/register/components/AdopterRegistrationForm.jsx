import { useState } from 'react'
import { validateEmail } from '../../../utils/validation'
import NotificationBanner from '../../../components/NotificationBanner'
import API_URL from '../../../config/api'
import { getUserFriendlyError, getNetworkError } from '../../../utils/errorMessages'

function AdopterRegistrationForm() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Pakistan'
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
    showNotification('Creating your account...', 'success')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      const username = formData.email.split('@')[0] + '_' + Date.now()
      
      const registrationData = {
        email: formData.email,
        username: username,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        country: formData.country || null
      }

      console.log('API_URL:', API_URL)
      console.log('Registration endpoint:', `${API_URL}/users`)
      console.log('Registration data:', registrationData)
      
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        const result = await response.json()
        showNotification('Account created successfully!', 'success')
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else {
        const errorData = await response.json()
        const friendlyMessage = getUserFriendlyError(errorData, 'Registration failed. Please check your information and try again.')
        showNotification(friendlyMessage, 'error')
      }
    } catch (error) {
      const friendlyMessage = getNetworkError(error)
      showNotification(friendlyMessage, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <NotificationBanner 
        notification={notification} 
        onClose={() => setNotification({ message: '', type: '', show: false })}
      />
      

      
      <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Create Your Adopter Account</h1>
        <p className="text-gray-600">Your Paw-tner era starts now. Get ready for pure happiness.</p>
      </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
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
                  : 'focus:ring-primary'
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
              className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
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
              className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
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
                className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
                required
              />
            </div>
            <div className="relative">
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors appearance-none cursor-pointer pr-10"
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
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                placeholder="Postal Code"
                className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
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
              className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
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
                  : 'focus:ring-primary'
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
                : 'bg-primary text-white hover:bg-primary/80'
            }`}
          >
            {isSubmitting ? 'Creating Account...' : 'Register'}
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
  )
}

export default AdopterRegistrationForm