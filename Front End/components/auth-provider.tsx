"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface UserData {
  email: string
  name?: string
  city?: string
}

interface AuthContextType {
  user: UserData | null
  isAuthenticated: boolean
  signIn: (email: string, userData?: Omit<UserData, "email">) => void
  signOut: () => void
  updateUserData: (data: Partial<UserData>) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  signIn: () => {},
  signOut: () => {},
  updateUserData: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Clear any stored user data on initial load
  useEffect(() => {
    setIsMounted(true)
    localStorage.removeItem("flu-app-user")
  }, [])

  const signIn = (email: string, userData?: Omit<UserData, "email">) => {
    const newUser = { email, ...userData }
    setUser(newUser)
    if (isMounted) {
      localStorage.setItem("flu-app-user", JSON.stringify(newUser))
    }
  }

  const signOut = () => {
    setUser(null)
    if (isMounted) {
      localStorage.removeItem("flu-app-user")
    }
  }

  const updateUserData = (data: Partial<UserData>) => {
    if (!user) return

    const updatedUser = { ...user, ...data }
    setUser(updatedUser)
    if (isMounted) {
      localStorage.setItem("flu-app-user", JSON.stringify(updatedUser))
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signIn, signOut, updateUserData }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
