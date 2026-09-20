import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, createRootRoute, createRoute, RouterProvider } from '@tanstack/react-router'
import { MainLayout } from './layouts/MainLayout'
import { AuthProvider } from './context/AuthProvider'
import { Dashboard } from './pages/Dashboard/Dashboard';
import { NyBetalning } from './pages/NyBetalning/NyBetalning'
import { SparaInvestera } from './pages/SparaInvestera/SparaInvestera'
import { Mortgage } from './pages/Mortgage/Mortgage'
import { Attestkorg } from './pages/Attestkorg/Attestkorg'
import { Batch } from './pages/Batch/Batch'
import { Granskningslogg } from './pages/Granskningslogg/Granskningslogg'
import { Profil } from './pages/Profil/Profil'
import { Logout } from './pages/Logout/Logout';
import Login from './pages/Login/Login';
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleProtectedRoute } from './components/Routes/RoleProtectedRoute'
import Register from './pages/Register/Register'
import CreateUser from './pages/Admin/Users/CreateUser';
import Users from './pages/Admin/Users/Users'
import './styles/reset.css'
import './styles/variables.css'
import './styles/globals.css'
import './index.css'
import { AdminLayout } from './layouts/AdminLayout/AdminLayout'
import UserDetails from './pages/Admin/Users/UserDetails'
import EditUserDetails from './pages/Admin/Users/EditUserDetails'

const rootRoute = createRootRoute({ component: MainLayout })

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Login })
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: Login })
const overviewRoute = createRoute({ getParentRoute: () => rootRoute, path: '/dashboard', component: () => <ProtectedRoute><Dashboard /></ProtectedRoute> })
const nyBetalningRoute = createRoute({ getParentRoute: () => rootRoute, path: '/ny-betalning', component: () => <ProtectedRoute><NyBetalning /></ProtectedRoute> })
const sparaInvesteraRoute = createRoute({ getParentRoute: () => rootRoute, path: '/spara-investera', component: () => <ProtectedRoute><SparaInvestera /></ProtectedRoute> })
const mortgageRoute = createRoute({ getParentRoute: () => rootRoute, path: '/bolan', component: () => <ProtectedRoute><Mortgage /></ProtectedRoute> })
const attestkorgRoute = createRoute({ getParentRoute: () => rootRoute, path: '/attestkorg', component: () => <ProtectedRoute><Attestkorg /></ProtectedRoute> })
const batchRoute = createRoute({ getParentRoute: () => rootRoute, path: '/batch', component: () => <ProtectedRoute><Batch /></ProtectedRoute> })
const granskningsloggRoute = createRoute({ getParentRoute: () => rootRoute, path: '/granskningslogg', component: () => <ProtectedRoute><Granskningslogg /></ProtectedRoute> })
const profilRoute = createRoute({ getParentRoute: () => rootRoute, path: '/profil', component: () => <ProtectedRoute><Profil /></ProtectedRoute> })
const loggaUtRoute = createRoute({ getParentRoute: () => rootRoute, path: '/logout', component: () => <ProtectedRoute><Logout /></ProtectedRoute> })
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: "/register", component: () => <Register /> })

// ADMIN ROUTES
const adminRoute = createRoute({ getParentRoute: () => rootRoute, path: "/admin", component: () => <RoleProtectedRoute allowedRoles={["Admin"]}><AdminLayout /></RoleProtectedRoute> })
const createUserRoute = createRoute({ getParentRoute: () => adminRoute, path: "/users/create", component: CreateUser })
const usersRoute = createRoute({ getParentRoute: () => adminRoute, path: "/users", component: Users })
const userDetailRoute = createRoute({ getParentRoute: () => adminRoute, path: "/users/$userId", component: UserDetails })
const editUserRoute = createRoute({ getParentRoute: () => adminRoute, path: "/users/$userId/edit", component: EditUserDetails })

const adminRouteTree = adminRoute.addChildren([
  createUserRoute,
  usersRoute,
  userDetailRoute,
  editUserRoute
]);

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  overviewRoute,
  nyBetalningRoute,
  sparaInvesteraRoute,
  mortgageRoute,
  attestkorgRoute,
  batchRoute,
  granskningsloggRoute,
  profilRoute,
  loggaUtRoute,
  registerRoute,
  adminRouteTree,
]);


const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)