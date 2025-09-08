import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import NotificationBanner from '../../components/NotificationBanner'

function ManagePets() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState({ message: '', type: '', show: false })
  const [deleteModal, setDeleteModal] = useState({ show: false, pet: null })

  const showNotification = (message, type) => {
    setNotification({ message, type, show: true })
    setTimeout(() => {
      setNotification({ message: '', type: '', show: false })
    }, 5000)
  }

  useEffect(() => {
    fetchPets()
  }, [])

  const fetchPets = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const shelterId = currentUser?.allUserData?.user_id || currentUser?.allUserData?.id
      const response = await fetch(`http://localhost:8000/pets?shelter_id=${shelterId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setPets(data.pets || [])
      }
    } catch (error) {
      showNotification('Failed to load pets', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (petId, newStatus) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:8000/pets/${petId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adoption_status: newStatus })
      })

      if (response.ok) {
        setPets(pets.map(pet => 
          pet.id === petId ? { ...pet, adoption_status: newStatus } : pet
        ))
        showNotification('Pet status updated successfully', 'success')
      } else {
        showNotification('Failed to update pet status', 'error')
      }
    } catch (error) {
      showNotification('Error updating pet status', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.pet) return

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:8000/pets/${deleteModal.pet.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setPets(pets.filter(pet => pet.id !== deleteModal.pet.id))
        showNotification(`${deleteModal.pet.name} has been deleted`, 'success')
        setDeleteModal({ show: false, pet: null })
      } else {
        showNotification('Failed to delete pet', 'error')
      }
    } catch (error) {
      showNotification('Error deleting pet', 'error')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ADOPTED': return 'bg-purple-100 text-purple-800'
      case 'ON_HOLD': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your pets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NotificationBanner 
          notification={notification} 
          onClose={() => setNotification({ message: '', type: '', show: false })}
        />

        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-secondary">Manage Pets</h1>
              <p className="text-gray-600 mt-2">View and manage all your pet listings</p>
            </div>
            <button
              onClick={() => navigate('/shelter/pets/add')}
              className="bg-secondary text-white px-6 py-3 rounded-xl font-medium hover:bg-secondary/80 transition-colors"
            >
              Add New Pet
            </button>
          </div>
        </div>

        {pets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🐾</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No pets listed yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first pet for adoption</p>
            <button 
              onClick={() => navigate('/shelter/pets/add')}
              className="bg-secondary text-white px-6 py-3 rounded-xl hover:bg-secondary/80 font-medium"
            >
              Add Your First Pet
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Pet</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Details</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pets.map((pet) => (
                    <tr key={pet.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {pet.primary_photo_url ? (
                            <img 
                              src={`http://localhost:8000${pet.primary_photo_url}`} 
                              alt={pet.name}
                              className="w-16 h-16 rounded-xl object-cover mr-4"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center mr-4">
                              <span className="text-gray-400 text-xs">No photo</span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900">{pet.name}</h3>
                            <p className="text-sm text-gray-600">{pet.breed}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900">{pet.pet_type} • {pet.age_years} years</p>
                          <p className="text-gray-600">{pet.size} • {pet.adoption_fee && Number(pet.adoption_fee) > 0 ? `PKR ${Number(pet.adoption_fee)}` : 'Free'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={pet.adoption_status}
                          onChange={(e) => handleStatusChange(pet.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border-0 focus:outline-none focus:ring-2 focus:ring-primary ${getStatusColor(pet.adoption_status)}`}
                        >
                          <option value="AVAILABLE">Available</option>
                          <option value="PENDING">Pending</option>
                          <option value="ADOPTED">Adopted</option>
                          <option value="ON_HOLD">On Hold</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/shelter/pets/view/${pet.id}`)}
                            className="text-gray-600 hover:bg-gray-600 hover:text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/shelter/pets/edit/${pet.id}`)}
                            className="text-primary hover:bg-primary/80 hover:text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteModal({ show: true, pet })}
                            className="text-red-600 hover:bg-red-600 hover:text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {deleteModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Pet</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{deleteModal.pet?.name}</strong>? 
                This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteModal({ show: false, pet: null })}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManagePets