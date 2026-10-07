import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, createRootRoute, createRoute, RouterProvider } from '@tanstack/react-router'
import './i18n/i18n';
import "flag-icons/css/flag-icons.min.css";
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
import ApprovalLimits from './pages/Admin/ApprovalLimits/ApprovalLimits'
import CreateApprovalLimit from './pages/Admin/ApprovalLimits/CreateApprovalLimit'
import EditApprovalLimit from './pages/Admin/ApprovalLimits/EditApprovalLimit'
import AdminDashboard from './pages/Admin/AdminDashboard/AdminDashboard';

const rootRoute = createRootRoute({ component: MainLayout })

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Login })
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: Login })
const overviewRoute = createRoute({ getParentRoute: () => rootRoute, path: '/dashboard', component: () => <ProtectedRoute><Dashboard /></ProtectedRoute> })
const nyBetalningRoute = createRoute({ getParentRoute: () => rootRoute, path: '/ny-betalning', component: () => <RoleProtectedRoute allowedRoles={["Initiator"]}><NyBetalning /></RoleProtectedRoute> })
const sparaInvesteraRoute = createRoute({ getParentRoute: () => rootRoute, path: '/spara-investera', component: () => <ProtectedRoute><SaveInvest /></ProtectedRoute> })
const mortgageRoute = createRoute({ getParentRoute: () => rootRoute, path: '/bolan', component: () => <ProtectedRoute><Mortgage /></ProtectedRoute> })
const attestkorgRoute = createRoute({ getParentRoute: () => rootRoute, path: '/attestkorg', component: () => <RoleProtectedRoute allowedRoles={["Attestant", "Admin"]}><Attestkorg /></RoleProtectedRoute> })
const batchRoute = createRoute({ getParentRoute: () => rootRoute, path: '/batch', component: () => <RoleProtectedRoute allowedRoles={["Initiator"]}><Batch /></RoleProtectedRoute> })
const granskningsloggRoute = createRoute({ getParentRoute: () => rootRoute, path: '/granskningslogg', component: () => <RoleProtectedRoute allowedRoles={["Admin"]}><Granskningslogg /></RoleProtectedRoute> })
const profilRoute = createRoute({ getParentRoute: () => rootRoute, path: '/profil', component: () => <ProtectedRoute><Profil /></ProtectedRoute> })
const loggaUtRoute = createRoute({ getParentRoute: () => rootRoute, path: '/logout', component: () => <ProtectedRoute><Logout /></ProtectedRoute> })
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: "/register", component: () => <Register /> })

// ADMIN ROUTES
const adminRoute = createRoute({ getParentRoute: () => rootRoute, path: "/admin", component: () => <RoleProtectedRoute allowedRoles={["Admin"]}><AdminLayout /></RoleProtectedRoute> })
const adminDashboardRoute = createRoute({ getParentRoute: () => adminRoute, path: "/", component: AdminDashboard });
const createUserRoute = createRoute({ getParentRoute: () => adminRoute, path: "/users/create", component: CreateUser })
const usersRoute = createRoute({ getParentRoute: () => adminRoute, path: "/users", component: Users })
const userDetailRoute = createRoute({ getParentRoute: () => adminRoute, path: "/users/$userId", component: UserDetails })
const editUserRoute = createRoute({ getParentRoute: () => adminRoute, path: "/users/$userId/edit", component: EditUserDetails })
const approvalLimitsRoute = createRoute({ getParentRoute: () => adminRoute, path: "/approval-limits", component: ApprovalLimits })
const createApprovalLimitsRoute = createRoute({ getParentRoute: () => adminRoute, path: "/approval-limits/create", component: CreateApprovalLimit })
const editApprovalLimitRoute = createRoute({ getParentRoute: () => adminRoute, path: "/approval-limits/$limitId/edit", component: EditApprovalLimit })

const adminRouteTree = adminRoute.addChildren([
  adminDashboardRoute,
  createUserRoute,
  usersRoute,
  userDetailRoute,
  editUserRoute,
  approvalLimitsRoute,
  createApprovalLimitsRoute,
  editApprovalLimitRoute,
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