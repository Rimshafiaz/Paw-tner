import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AccountTypeSelector from './components/AccountTypeSelector'
import AdopterRegistrationForm from './components/AdopterRegistrationForm'
import ShelterRegistrationForm from './components/ShelterRegistrationForm'
import pawtnerLoveImage from '../../assets/paw-tner love.jpg'

function Register() {
  const [selectedAccountType, setSelectedAccountType] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/register/adopter') {
      setSelectedAccountType('adopter')
    } else if (location.pathname === '/register/shelter') {
      setSelectedAccountType('shelter')
    } else {
      setSelectedAccountType(null)
    }
  }, [location.pathname])

  const handleAccountTypeSelect = (type) => {
    setSelectedAccountType(type)
    navigate(`/register/${type}`)
  }

  return (
    <div 
      className="min-h-screen py-8 px-4 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 248, 240, 0.85), rgba(240, 255, 248, 0.85)), url(${pawtnerLoveImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-6xl mx-auto">
        
        {!selectedAccountType && (
          <AccountTypeSelector onSelect={handleAccountTypeSelect} />
        )}
        
        {selectedAccountType === 'adopter' && (
          <AdopterRegistrationForm />
        )}
        
        {selectedAccountType === 'shelter' && (
          <ShelterRegistrationForm />
        )}

        <div className="text-center mt-8 mb-6">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <span className="text-xl">🐾</span>
            <span className="text-gray-600 text-sm font-medium">Already part of our family?</span>
            <span className="text-xl">🏠</span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-full text-sm font-medium hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Welcome back! 🎉
          </button>
        </div>

      </div>
    </div>
  )
}

export default Register