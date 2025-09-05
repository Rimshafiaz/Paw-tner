function NotificationBanner({ notification, onClose }) {
  if (!notification.show) return null

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-xl shadow-lg border-l-4 max-w-md w-full mx-4 ${
      notification.type === 'success' 
        ? 'bg-green-50 border-green-400 text-green-800' 
        : 'bg-red-50 border-red-400 text-red-800'
    }`}>
      <div className="flex justify-between items-center">
        <span>{notification.message}</span>
        <button 
          onClick={onClose}
          className="ml-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default NotificationBanner