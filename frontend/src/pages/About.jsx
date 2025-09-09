import catImage from '../assets/cat.jpg'
import dogImage from '../assets/dog.png'
import pawTnerImage from '../assets/paw-tner.jpg'

function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50">
      
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="w-16 h-16 bg-gradient-to-r from-[#FF5733] to-[#00FFEA]  rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-12 shadow-lg">
                <span className="text-2xl">🐾</span>
              </div>
              <h1 className=" text-7xl font-extrabold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#FF5733] to-[#00FFEA]  animate-bounce mb-6">
                Paw-tner
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Ready to find your Paw-tner in crime? Whether you're adopting your next fur baby or you're a shelter on the lookout for the perfect hooman for your pets, we're here to make it happen.
              </p>
            </div>
            <div className="flex justify-center">
              <img 
                src={pawTnerImage} 
                alt="Happy pets" 
                className="w-80 h-80 object-cover rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-6">
          
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-6  from-[#FF5733] to-[#FE8B02] text-transparent bg-clip-text bg-gradient-to-br">
                Where the Magic Happens ✨
              </h2>
              <div className="max-w-4xl mx-auto">
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  Paw-tner is where the magic happens-whether you're on the hunt for a playful pup who'll never stop fetching, or a cat who'll side-eye you like it's their full-time job. We're all about making sure every pet gets the love they paw-solutely deserve, and every hooman finds the paw-tner they've been dreaming of (or stalking on insta).
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  So let's get those tail wags, purrs, and snuggles going. Your new bestie is just a few clicks away. 🐾💕
                </p>
              </div>
            </div>

          </div>
          
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-12 from-[#FF5733] to-[#FE8B02] text-transparent bg-clip-text bg-gradient-to-br">
              How it Works 🚀
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 transform transition-all duration-200 ease-in-out hover:scale-135">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Create Profile</h3>
              <p className="text-gray-600 text-sm">Tell us about your perfect pet match</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 transform transition-all duration-200 ease-in-out hover:scale-135">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Browse Pets</h3>
              <p className="text-gray-600 text-sm">Discover amazing pets waiting for homes</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center mx-auto mb-4  transform transition-all duration-200 ease-in-out hover:scale-135">
                <span className="text-2xl">💕</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Find Love</h3>
              <p className="text-gray-600 text-sm">Connect with shelters and adopt</p>
            </div>
          </div>


        </div>
      </section>

    </div>
  )
}

export default About