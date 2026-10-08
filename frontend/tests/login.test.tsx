import { expect, jest, test } from '@jest/globals'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import PrivateLogin from '../src/pages/Login/PrivateLogin'
import { ProtectedRoute } from '../src/components/ProtectedRoute'
import { AuthContext } from '../src/context/AuthContext'
import { AppError } from '../src/errors/AppError'
import sv from '../src/i18n/locales/sv.json'

// Replace navigation so these small component tests do not need a router.
const mockNavigate = jest.fn()
jest.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: { to: string }) => <p>Redirect: {to}</p>,
}))

const login = jest.fn<(email: string, password: string) => Promise<void>>()
const auth = {
  user: null, isAuthenticated: false, isInitializing: false,
  isLoggingIn: false, sessionExpired: false, login, logout: jest.fn(),
}

function submitLogin() {
  fireEvent.change(screen.getByLabelText(sv.login.email), { target: { value: 'alex@example.com' } })
  fireEvent.change(screen.getByLabelText(sv.login.password), { target: { value: 'secret' } })
  fireEvent.click(screen.getByRole('button', { name: sv.login.login }))
}

test('US-67: lyckad inloggning går till dashboard', async () => {
  login.mockResolvedValueOnce(undefined)
  render(<AuthContext.Provider value={auth}><PrivateLogin /></AuthContext.Provider>)

  submitLogin()

  expect(login).toHaveBeenCalledWith('alex@example.com', 'secret')
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' }))
})

test('US-67: fel lösenord visar ett fel och går inte vidare', async () => {
  login.mockRejectedValueOnce(new AppError('Unauthorized', 401))
  render(<AuthContext.Provider value={auth}><PrivateLogin /></AuthContext.Provider>)

  submitLogin()

  expect(await screen.findByText(sv.login.invalidCredentials)).toBeVisible()
  expect(mockNavigate).not.toHaveBeenCalled()
})

test('US-67: en utloggad användare får inte se en skyddad sida', () => {
  render(
    <AuthContext.Provider value={auth}>
      <ProtectedRoute><h1>Hemlig sida</h1></ProtectedRoute>
    </AuthContext.Provider>,
  )

  expect(screen.queryByText('Hemlig sida')).not.toBeInTheDocument()
  expect(screen.getByText('Redirect: /login')).toBeVisible()
})
