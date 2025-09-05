import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Register from './pages/register/Register'
import Login from './pages/login/Login'
import Navbar from './components/Navbar'
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

