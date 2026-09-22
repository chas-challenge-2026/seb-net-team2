import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, createRootRoute, createRoute, RouterProvider } from '@tanstack/react-router'
import { MainLayout } from './layouts/MainLayout'
import { AuthProvider } from './context/AuthProvider'
import { Dashboard } from './pages/Dashboard/Dashboard';
import { NyBetalning } from './pages/NyBetalning/NyBetalning'
import { SaveInvest } from './pages/SaveInvest/SaveInvest'
import { Mortgage } from './pages/Mortgage/Mortgage'
import { Attestkorg } from './pages/Attestkorg/Attestkorg'
import { Batch } from './pages/Batch/Batch'
import { Granskningslogg } from './pages/Granskningslogg/Granskningslogg'
import { Profil } from './pages/Profil/Profil'
import { Logout } from './pages/Logout/Logout';
import Login from './pages/Login/Login';
import { ProtectedRoute } from './components/ProtectedRoute'
import Register from './pages/Register/Register'
import './styles/reset.css'
import './styles/variables.css'
import './styles/globals.css'
import './index.css'

const rootRoute = createRootRoute({ component: MainLayout })

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Login })
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: Login })
const overviewRoute = createRoute({ getParentRoute: () => rootRoute, path: '/dashboard', component: () => <ProtectedRoute><Dashboard /></ProtectedRoute> })
const nyBetalningRoute = createRoute({ getParentRoute: () => rootRoute, path: '/ny-betalning', component: () => <ProtectedRoute><NyBetalning /></ProtectedRoute> })
const sparaInvesteraRoute = createRoute({ getParentRoute: () => rootRoute, path: '/spara-investera', component: () => <ProtectedRoute><SaveInvest /></ProtectedRoute> })
const mortgageRoute = createRoute({ getParentRoute: () => rootRoute, path: '/bolan', component: () => <ProtectedRoute><Mortgage /></ProtectedRoute> })
const attestkorgRoute = createRoute({ getParentRoute: () => rootRoute, path: '/attestkorg', component: () => <ProtectedRoute><Attestkorg /></ProtectedRoute> })
const batchRoute = createRoute({ getParentRoute: () => rootRoute, path: '/batch', component: () => <ProtectedRoute><Batch /></ProtectedRoute> })
const granskningsloggRoute = createRoute({ getParentRoute: () => rootRoute, path: '/granskningslogg', component: () => <ProtectedRoute><Granskningslogg /></ProtectedRoute> })
const profilRoute = createRoute({ getParentRoute: () => rootRoute, path: '/profil', component: () => <ProtectedRoute><Profil /></ProtectedRoute> })
const loggaUtRoute = createRoute({ getParentRoute: () => rootRoute, path: '/logout', component: () => <ProtectedRoute><Logout /></ProtectedRoute> })
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: "register", component: () => <Register /> })

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
])
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