function RoleSelector({ selectedRole, onRoleChange }) {
  return (
    <div className="mb-6">
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          type="button"
          onClick={() => onRoleChange('adopter')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            selectedRole === 'adopter'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <span className="mr-2">❤️</span>
          I'm an Adopter
        </button>
        <button
          type="button"
          onClick={() => onRoleChange('shelter')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            selectedRole === 'shelter'
              ? 'bg-white text-secondary shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <span className="mr-2">🏠</span>
          I'm a Shelter
        </button>
      </div>
    </div>
  )
}

export default RoleSelector