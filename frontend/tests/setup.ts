import { beforeEach, jest } from '@jest/globals'
import '@testing-library/jest-dom/jest-globals'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import sv from '../src/i18n/locales/sv.json'

void i18n.use(initReactI18next).init({
  lng: 'sv', resources: { sv: { translation: sv } }, initAsync: false,
})

beforeEach(() => {
  sessionStorage.clear()
  // An unmocked request fails instead of contacting a real backend.
  globalThis.fetch = jest.fn<typeof fetch>().mockRejectedValue(new Error('Unmocked request'))
})
