import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { validateEmail } from '../../../utils/validation'
import NotificationBanner from '../../../components/NotificationBanner'
import RoleSelector from './RoleSelector'
import { useAuth } from '../../../contexts/AuthContext'
import API_URL from '../../../config/api'
import { getUserFriendlyError, getNetworkError } from '../../../utils/errorMessages'

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'adopter'
  })
  
  const [notification, setNotification] = useState({ message: '', type: '', show: false })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailValidation, setEmailValidation] = useState({ isValid: true, message: '' })
  const [showPassword, setShowPassword] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()
  
  

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    
    if (e.target.name === 'email') {
      const validation = validateEmail(e.target.value)
      setEmailValidation(validation)
    }
  }

  const handleRoleChange = (role) => {
    setFormData({ ...formData, userType: role })
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

    if (!emailValidation.isValid) {
      showNotification('Please enter a valid email address', 'error')
      return
    }

    setIsSubmitting(true)
    showNotification('Signing you in...', 'success')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      const endpoint = formData.userType === 'adopter' 
        ? `${API_URL}/login`
        : `${API_URL}/shelters/login`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (response.ok) {
        const result = await response.json()
        
        login({
          name: result.user.full_name || result.user.name,
          email: result.user.email,
          userType: formData.userType,
          allUserData: result.user
        }, result.access_token)
        
        showNotification('Login successful!', 'success')
        
        
        setTimeout(() => {
          if (formData.userType === 'shelter') {
            navigate('/shelter/dashboard')
          } else {
            navigate('/adopter/home')
          }
        }, 1000)
        
      } else {
        const errorData = await response.json()
        const friendlyMessage = getUserFriendlyError(errorData, 'Invalid email or password. Please try again.')
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
    <div className="w-full max-w-md mx-auto px-4 md:px-0">
      <NotificationBanner 
        notification={notification} 
        onClose={() => setNotification({ message: '', type: '', show: false })}
      />
      
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FF2C00] to-[#00FF94] mb-2 drop-shadow-lg">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your Paw-tner account</p>
        </div>

        <RoleSelector 
          selectedRole={formData.userType}
          onRoleChange={handleRoleChange}
        />
        
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full px-4 py-4 pr-12 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-colors ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed opacity-75' 
                : formData.userType === 'adopter' ? 'bg-primary text-white hover:bg-primary/80' : 'bg-secondary text-white hover:bg-secondary/80'
            }`}
          >
            {isSubmitting ? 'Signing In' : 'Sign In'}
          </button>
        </form>
        
        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
            <span>Don't have an account?</span>
            <a href="/register" className="text-primary font-semibold hover:text-primary/80 transition-colors">
              Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginForm