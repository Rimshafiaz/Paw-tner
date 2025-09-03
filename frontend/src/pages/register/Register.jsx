import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AccountTypeSelector from './components/AccountTypeSelector'
import AdopterRegistrationForm from './components/AdopterRegistrationForm'
import ShelterRegistrationForm from './components/ShelterRegistrationForm'

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
    <div className="min-h-screen bg-background py-8 px-4">
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

      </div>
    </div>
  )
}

export default Register