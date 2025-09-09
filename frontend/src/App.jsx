import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Register from './pages/register/Register'
import Login from './pages/login/Login'
import AdopterDashboard from './pages/adopter/AdopterDashboard'
import UserProfile from './pages/adopter/UserProfile'
import PetBrowsing from './pages/adopter/PetBrowsing'
import PetDetail from './pages/adopter/PetDetail'
import Favorites from './pages/adopter/Favorites'
import PerfectPawtner from './pages/adopter/PerfectPawtner'
import ShelterDashboard from './pages/shelter/ShelterDashboard'
import AddPet from './pages/shelter/AddPet'
import ManagePets from './pages/shelter/ManagePets'
import EditPet from './pages/shelter/EditPet'
import ShelterProfile from './pages/shelter/ShelterProfile'
import ViewPet from './pages/shelter/ViewPet'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: "about",
        element: <About />
      },
      {
        path: "register", 
        element: <Register />
      },
      {
        path: "register/adopter",
        element: <Register />
      },
      {
        path: "register/shelter", 
        element: <Register />
      },
      {
        path: "login",
        element: <Login />
      },
      {
        path: "adopter/dashboard",
        element: (
          <ProtectedRoute requiredRole="adopter">
            <AdopterDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: "adopter/profile",
        element: (
          <ProtectedRoute requiredRole="adopter">
            <UserProfile />
          </ProtectedRoute>
        )
      },
      {
        path: "adopter/browse",
        element: (
          <ProtectedRoute requiredRole="adopter">
            <PetBrowsing />
          </ProtectedRoute>
        )
      },
      {
        path: "adopter/pets/:petId",
        element: (
          <ProtectedRoute requiredRole="adopter">
            <PetDetail />
          </ProtectedRoute>
        )
      },
      {
        path: "adopter/favorites",
        element: (
          <ProtectedRoute requiredRole="adopter">
            <Favorites />
          </ProtectedRoute>
        )
      },
      {
        path: "adopter/perfect-pawtner",
        element: (
          <ProtectedRoute requiredRole="adopter">
            <PerfectPawtner />
          </ProtectedRoute>
        )
      },
      {
        path: "shelter/dashboard", 
        element: (
          <ProtectedRoute requiredRole="shelter">
            <ShelterDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: "shelter/pets/add",
        element: (
          <ProtectedRoute requiredRole="shelter">
            <AddPet />
          </ProtectedRoute>
        )
      },
      {
        path: "shelter/pets/manage",
        element: (
          <ProtectedRoute requiredRole="shelter">
            <ManagePets />
          </ProtectedRoute>
        )
      },
      {
        path: "shelter/pets/edit/:petId",
        element: (
          <ProtectedRoute requiredRole="shelter">
            <EditPet />
          </ProtectedRoute>
        )
      },
      {
        path: "shelter/pets/view/:petId",
        element: (
          <ProtectedRoute requiredRole="shelter">
            <ViewPet />
          </ProtectedRoute>
        )
      },
      {
        path: "shelter/profile",
        element: (
          <ProtectedRoute requiredRole="shelter">
            <ShelterProfile />
          </ProtectedRoute>
        )
      }
    ]
  }
])

function AppContent() {
  const { isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Checking if you're logged in...</p>
        </div>
      </div>
    )
  }
  
  return <RouterProvider router={router} />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

