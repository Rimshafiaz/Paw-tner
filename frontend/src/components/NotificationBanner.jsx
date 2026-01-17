import { useAuth } from '../contexts/AuthContext'

function NotificationBanner({ notification, onClose, userType: propUserType }) {
  const { currentUser } = useAuth()
  const userType = propUserType || currentUser?.userType || 'adopter'
  
  if (!notification.show) return null

  const isShelter = userType === 'shelter'
  
  const getStyles = () => {
    if (notification.type === 'success') {
      return isShelter
        ? 'bg-teal-50 border-teal-400 text-teal-800'
        : 'bg-blue-50 border-blue-400 text-blue-800'
    }
    if (notification.type === 'warning') {
      return 'bg-yellow-50 border-yellow-400 text-yellow-800'
    }
    return isShelter
      ? 'bg-red-50 border-red-400 text-red-800'
      : 'bg-red-50 border-red-400 text-red-800'
  }

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-xl shadow-lg border-l-4 max-w-md w-full mx-4 transition-all duration-300 ${getStyles()}`}>
      <div className="flex justify-between items-center gap-3">
        <span className="flex-1 font-medium">{notification.message}</span>
        <button 
          onClick={onClose}
          className="flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
          aria-label="Close notification"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default NotificationBanner