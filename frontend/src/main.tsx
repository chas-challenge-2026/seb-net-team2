import { QueryClient, QueryClientProvider} from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, createRootRoute, createRoute, RouterProvider } from '@tanstack/react-router'
import { MainLayout } from './layouts/MainLayout'
import { AuthProvider } from './context/AuthProvider'
import { Overview } from './pages/Overview/Overview'
import { NyBetalning } from './pages/NyBetalning/NyBetalning'
import { SparaInvestera } from './pages/SparaInvestera/SparaInvestera'
import { Mortgage } from './pages/Mortgage/Mortgage'
import { Attestkorg } from './pages/Attestkorg/Attestkorg'
import { Batch } from './pages/Batch/Batch'
import { Granskningslogg } from './pages/Granskningslogg/Granskningslogg'
import { Profil } from './pages/Profil/Profil'
import { LoggaUt } from './pages/LoggaUt/LoggaUt'
import { LoggaIn } from './pages/LoggaIn/LoggaIn'
import { ProtectedRoute } from './components/ProtectedRoute'
import './styles/reset.css'
import './styles/variables.css'
import './styles/globals.css'
import './index.css'

const rootRoute = createRootRoute({ component: MainLayout })

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Overview })
const loggaInRoute = createRoute({ getParentRoute: () => rootRoute, path: '/logga-in', component: LoggaIn })
const nyBetalningRoute = createRoute({ getParentRoute: () => rootRoute, path: '/ny-betalning', component: () => <ProtectedRoute><NyBetalning /></ProtectedRoute> })
const sparaInvesteraRoute = createRoute({ getParentRoute: () => rootRoute, path: '/spara-investera', component: () => <ProtectedRoute><SparaInvestera /></ProtectedRoute> })
const mortgageRoute = createRoute({ getParentRoute: () => rootRoute, path: '/bolan', component: () => <ProtectedRoute><Mortgage /></ProtectedRoute> })
const attestkorgRoute = createRoute({ getParentRoute: () => rootRoute, path: '/attestkorg', component: () => <ProtectedRoute><Attestkorg /></ProtectedRoute> })
const batchRoute = createRoute({ getParentRoute: () => rootRoute, path: '/batch', component: () => <ProtectedRoute><Batch /></ProtectedRoute> })
const granskningsloggRoute = createRoute({ getParentRoute: () => rootRoute, path: '/granskningslogg', component: () => <ProtectedRoute><Granskningslogg /></ProtectedRoute> })
const profilRoute = createRoute({ getParentRoute: () => rootRoute, path: '/profil', component: () => <ProtectedRoute><Profil /></ProtectedRoute> })
const loggaUtRoute = createRoute({ getParentRoute: () => rootRoute, path: '/logga-ut', component: () => <ProtectedRoute><LoggaUt /></ProtectedRoute> })

const routeTree = rootRoute.addChildren([
    indexRoute,
    loggaInRoute,
    nyBetalningRoute,
    sparaInvesteraRoute,
    mortgageRoute,
    attestkorgRoute,
    batchRoute,
    granskningsloggRoute,
    profilRoute,
    loggaUtRoute,
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