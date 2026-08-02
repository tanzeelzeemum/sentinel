import { createContext, useContext, useEffect, useState } from 'react'
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, firebaseConfigured } from '../firebase'

const AuthContext = createContext()
const configurationError = () => Promise.reject(new Error('Firebase configuration is missing. Add the values in .env and restart the app.'))

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firebaseConfigured) { setLoading(false); return }
    return onAuthStateChanged(auth, currentUser => {
      setUser(currentUser)
      setLoading(false)
    })
  }, [])

  return <AuthContext.Provider value={{
    user, loading,
    register: (email, password) => firebaseConfigured ? createUserWithEmailAndPassword(auth, email, password) : configurationError(),
    login: (email, password) => firebaseConfigured ? signInWithEmailAndPassword(auth, email, password) : configurationError(),
    logout: () => auth ? signOut(auth) : Promise.resolve(),
    forgotPassword: email => firebaseConfigured ? sendPasswordResetEmail(auth, email) : configurationError()
  }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
