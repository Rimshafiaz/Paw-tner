import { useState } from 'react'
import validator from 'validator'

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
    country: ''
  })
  
  const [errors, setErrors] = useState({})
  const [notification, setNotification] = useState({ message: '', type: '', show: false })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailValidation, setEmailValidation] = useState({ isValid: true, message: '' })

  const levenshteinDistance = (str1, str2) => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i
    }
    
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[j][i] = matrix[j - 1][i - 1]
        } else {
          matrix[j][i] = Math.min(
            matrix[j - 1][i - 1] + 1,
            matrix[j][i - 1] + 1,
            matrix[j - 1][i] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  const validateEmail = (email) => {
    if (!email) {
      return { isValid: true, message: '' }
    }

    if (!validator.isEmail(email)) {
      return { isValid: false, message: 'Please enter a valid email address' }
    }

    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com']
    const domain = email.split('@')[1]?.toLowerCase()
    
    if (domain && !commonDomains.includes(domain)) {
      let bestMatch = null
      let minDistance = Infinity
      
      commonDomains.forEach(commonDomain => {
        const distance = levenshteinDistance(domain, commonDomain)
        if (distance <= 2 && distance < minDistance) {
          minDistance = distance
          bestMatch = commonDomain
        }
      })
      
      if (bestMatch && minDistance <= 2) {
        return { 
          isValid: false, 
          message: `Did you mean ${email.split('@')[0]}@${bestMatch}?` 
        }
      }
    }

    return { isValid: true, message: '' }
  }

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
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        country: formData.country,
        role: 'adopter'
      }

      const response = await fetch('http://localhost:8000/users', {
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
        console.log('Registration successful:', result)
        showNotification('Account created successfully! Redirecting to login...', 'success')
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else {
        const error = await response.json()
        console.error('Registration error:', error)
        showNotification(error.detail || 'Registration failed. Please check your information and try again.', 'error')
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        showNotification('Request timeout. Please check your connection and try again.', 'error')
      } else {
        console.error('Network error:', error)
        showNotification('Connection failed. Please check your internet and try again.', 'error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {notification.show && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-xl shadow-lg border-l-4 max-w-md w-full mx-4 ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-400 text-green-800' 
            : 'bg-red-50 border-red-400 text-red-800'
        }`}>
          <div className="flex justify-between items-center">
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification({ message: '', type: '', show: false })}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Your Adopter Account</h1>
        <p className="text-gray-600">Find your new best friend today. It's quick and easy!</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg p-8">
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
              placeholder="Country"
              className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
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
            <div>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State"
                className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
                required
              />
            </div>
            <div>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                placeholder="Zip"
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
                : 'bg-primary text-white hover:bg-primary/90'
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