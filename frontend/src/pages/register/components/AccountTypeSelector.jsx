function AccountTypeSelector({ onSelect }) {
  return (
    <>
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Join Our Community</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Choose how you'd like to get started with Paw-tner.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100"
             onClick={() => onSelect('adopter')}>
          <div className="p-8 text-center">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">❤️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">I'm an Adopter</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Find your perfect furry, scaly, or feathered companion. Browse profiles, connect with shelters, and start your adoption journey.
            </p>
            <button className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              Sign Up as Adopter
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100"
             onClick={() => onSelect('shelter')}>
          <div className="p-8 text-center">
            <div className="bg-secondary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🏠</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">I'm a Shelter</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Connect with potential adopters and find loving homes for your animals. Manage pet profiles and streamline your adoption process.
            </p>
            <button className="w-full bg-secondary text-white py-3 px-6 rounded-lg font-semibold hover:bg-secondary/90 transition-colors">
              Sign Up as Shelter
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default AccountTypeSelector