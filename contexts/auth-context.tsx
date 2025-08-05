"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type User as FirebaseUser,
} from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

interface UserData {
  uid: string
  email: string
  name: string
  role: "admin" | "agronomist" | "client" | "operator"
  properties?: string[]
  avatar?: string
  phone?: string
  lastLogin?: Date
}

interface AuthContextType {
  user: UserData | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser): Promise<UserData | null> => {
    try {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          name: userData.name || firebaseUser.displayName || "Usuário",
          role: userData.role || "client",
          properties: userData.properties || [],
          avatar: userData.avatar || firebaseUser.photoURL,
          phone: userData.phone,
          lastLogin: userData.lastLogin?.toDate(),
        }
      }
      return null
    } catch (error) {
      console.error("Error fetching user data:", error)
      return null
    }
  }, [])

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      const userData = await fetchUserData(auth.currentUser)
      setUser(userData)
    }
  }, [fetchUserData])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence)
      } catch (error) {
        console.error("Error setting persistence:", error)
      }
    }

    initializeAuth()

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return

      if (firebaseUser) {
        const userData = await fetchUserData(firebaseUser)
        if (mounted) {
          setUser(userData)
        }
      } else {
        if (mounted) {
          setUser(null)
        }
      }

      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [fetchUserData])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const result = await signInWithEmailAndPassword(auth, email, password)

      // Update last login
      if (result.user) {
        const userData = await fetchUserData(result.user)
        setUser(userData)
      }

      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo de volta, ${result.user.displayName || "usuário"}!`,
      })
    } catch (error: any) {
      console.error("Sign in error:", error)

      let errorMessage = "Email ou senha incorretos"

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "Usuário não encontrado"
          break
        case "auth/wrong-password":
          errorMessage = "Senha incorreta"
          break
        case "auth/too-many-requests":
          errorMessage = "Muitas tentativas. Tente novamente mais tarde"
          break
        case "auth/network-request-failed":
          errorMessage = "Erro de conexão. Verifique sua internet"
          break
      }

      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      toast({
        title: "Logout realizado com sucesso!",
        description: "Até logo!",
      })
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Erro no logout",
        description: "Tente novamente",
        variant: "destructive",
      })
    }
  }

  const value = {
    user,
    loading,
    signIn,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
