import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { validateEmail } from '../../../utils/validation'
import NotificationBanner from '../../../components/NotificationBanner'
import RoleSelector from './RoleSelector'
import { useAuth } from '../../../contexts/AuthContext'

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'adopter'
  })
  
  const [notification, setNotification] = useState({ message: '', type: '', show: false })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailValidation, setEmailValidation] = useState({ isValid: true, message: '' })
  
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
        ? 'http://localhost:8000/login'
        : 'http://localhost:8000/shelters/login'

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
        const error = await response.json()
        showNotification(error.detail || 'Invalid email or password. Please try again.', 'error')
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