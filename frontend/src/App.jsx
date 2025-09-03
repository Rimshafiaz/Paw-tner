import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Register from './pages/register/Register'
import Navbar from './components/Navbar'

// Layout component with navigation
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
      }
    ]
  }
])

function App() {
  return <RouterProvider router={router} />
}

export default App
