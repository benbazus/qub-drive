
import { User } from '@/types/auth'
import Cookies from 'js-cookie'
import { create } from 'zustand'

const ACCESS_TOKEN_KEY = 'auth_access_token'
const USER_DATA_KEY = 'auth_user_data'
const COOKIE_EXPIRES_DAYS = 7

interface AuthActions {
  setUser: (user: User | null) => void
  setAccessToken: (accessToken: string) => void
  resetAccessToken: () => void
  reset: () => void
  isTokenExpired: () => boolean
  logout: () => void
}

interface AuthState {
  user: User | null
  accessToken: string
  isAuthenticated: boolean
}

type AuthStore = AuthState & AuthActions

// Helper function to safely parse token from cookie
const getTokenFromCookie = (): string => {
  try {
    const cookieValue = Cookies.get(ACCESS_TOKEN_KEY)
    return cookieValue ? JSON.parse(cookieValue) : ''
  } catch (error) {
    console.warn('Failed to parse access token from cookie:', error)
    Cookies.remove(ACCESS_TOKEN_KEY)
    return ''
  }
}

// Helper function to safely parse user data from cookie
const getUserFromCookie = (): User | null => {
  try {
    const cookieValue = Cookies.get(USER_DATA_KEY)
    return cookieValue ? JSON.parse(cookieValue) : null
  } catch (error) {
    console.warn('Failed to parse user data from cookie:', error)
    Cookies.remove(USER_DATA_KEY)
    return null
  }
}

// Helper function to check if user token is expired
const isUserTokenExpired = (user: User | null): boolean => {
  if (!user?.exp) return true
  return Date.now() >= user.exp * 1000
}

export const useAuthStore = create<AuthStore>()((set, get) => {
  const initialToken = getTokenFromCookie()
  const initialUser = getUserFromCookie()

  console.log('Auth store initialization:', {
    hasToken: !!initialToken,
    hasUser: !!initialUser,
    userId: initialUser?.id,
    userExp: initialUser?.exp,
    isExpired: initialUser ? isUserTokenExpired(initialUser) : 'no user',
    currentTime: Math.floor(Date.now() / 1000)
  })
  localStorage.setItem('userId', initialUser?.id!);
  localStorage.setItem('userName', initialUser?.email!);


  // console.log(" +++++++++++++++++++++++++++ ")
  // console.log(localStorage.getItem('userId'))
  // console.log(localStorage.getItem('userName'))
  // console.log(" +++++++++++++++++++++++++++ ")

  return {
    // State
    user: initialUser,
    accessToken: initialToken,
    isAuthenticated: !!initialUser && !!initialToken && !isUserTokenExpired(initialUser),

    // Actions
    setUser: (user) =>
      set((state) => {
        try {
          if (user) {
            Cookies.set(USER_DATA_KEY, JSON.stringify(user), {
              expires: COOKIE_EXPIRES_DAYS,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
            })
          } else {
            Cookies.remove(USER_DATA_KEY)
          }

          return {
            user,
            isAuthenticated: !!user && !!state.accessToken && !isUserTokenExpired(user),
          }
        } catch (error) {
          console.error('Failed to set user data:', error)
          return state
        }
      }),

    setAccessToken: (accessToken) =>
      set((state) => {
        try {
          Cookies.set(ACCESS_TOKEN_KEY, JSON.stringify(accessToken), {
            expires: COOKIE_EXPIRES_DAYS,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
          })

          return {
            accessToken,
            isAuthenticated: !!state.user && !!accessToken && !isUserTokenExpired(state.user),
          }
        } catch (error) {
          console.error('Failed to set access token:', error)
          return state
        }
      }),

    resetAccessToken: () =>
      set((_state) => {
        Cookies.remove(ACCESS_TOKEN_KEY)
        return {
          accessToken: '',
          isAuthenticated: false,
        }
      }),

    isTokenExpired: () => {
      const { user } = get()
      return isUserTokenExpired(user)
    },

    reset: () =>
      set(() => {
        Cookies.remove(ACCESS_TOKEN_KEY)
        Cookies.remove(USER_DATA_KEY)
        return {
          user: null,
          accessToken: '',
          isAuthenticated: false,
        }
      }),

    logout: () => {
      const { reset } = get()
      reset()
    },
  }
})

// Selector hooks for better performance
export const useAuthUser = () => useAuthStore((state) => state.user)
export const useAccessToken = () => useAuthStore((state) => state.accessToken)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)

// Individual action hooks - FIXED VERSION
export const useSetUser = () => useAuthStore((state) => state.setUser)
export const useSetAccessToken = () => useAuthStore((state) => state.setAccessToken)
export const useResetAccessToken = () => useAuthStore((state) => state.resetAccessToken)
export const useReset = () => useAuthStore((state) => state.reset)
export const useLogout = () => useAuthStore((state) => state.logout)
export const useIsTokenExpired = () => useAuthStore((state) => state.isTokenExpired)

// Alternative: If you need all actions together, use this pattern
export const useAuthActions = () => {
  const setUser = useAuthStore((state) => state.setUser)
  const setAccessToken = useAuthStore((state) => state.setAccessToken)
  const resetAccessToken = useAuthStore((state) => state.resetAccessToken)
  const reset = useAuthStore((state) => state.reset)
  const logout = useAuthStore((state) => state.logout)
  const isTokenExpired = useAuthStore((state) => state.isTokenExpired)

  return {
    setUser,
    setAccessToken,
    resetAccessToken,
    reset,
    logout,
    isTokenExpired,
  }
}
