import LoginForm from './components/LoginForm'
import pawtnerLoveImage from '../../assets/paw-tner love.jpg'
import shelterBg from '../../assets/paw-tner_shelter.jpg'

function Login() {
  return (
    <div 
      className="min-h-screen py-12 px-2 relative flex items-center justify-center"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 248, 240, 0.85), rgba(240, 255, 248, 0.85)), url(${pawtnerLoveImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <LoginForm />
    </div>
  )
}

export default Login