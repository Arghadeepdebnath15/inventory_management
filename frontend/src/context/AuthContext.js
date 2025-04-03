import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import axios from '../utils/axios';

const AuthContext = createContext({
  user: null,
  loading: true,
  initialized: false,
  signIn: async () => {},
  signUp: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const userRef = useRef(null);

  const updateUser = useCallback((updatedUser) => {
    // Only update if the user data has actually changed
    if (JSON.stringify(userRef.current) !== JSON.stringify(updatedUser)) {
      userRef.current = updatedUser;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    let unsubscribe;
    
    const handleAuthStateChange = async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get or create user in MongoDB
          const response = await axios.post('/api/auth/login', {
            email: firebaseUser.email,
            firebaseUid: firebaseUser.uid,
            name: firebaseUser.displayName,
            shopName: firebaseUser.shopName
          });

          const userData = response.data?.user 
            ? {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: response.data.user.name,
                photoURL: firebaseUser.photoURL,
                shopName: response.data.user.shopName,
                ...response.data.user
              }
            : {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                shopName: firebaseUser.shopName
              };

          // Only update if the user data has changed
          if (JSON.stringify(userRef.current) !== JSON.stringify(userData)) {
            updateUser(userData);
          }
      } catch (error) {
          console.error('Error syncing user data:', error);
          const firebaseUserData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            shopName: firebaseUser.shopName
          };
          // Only update if the user data has changed
          if (JSON.stringify(userRef.current) !== JSON.stringify(firebaseUserData)) {
            updateUser(firebaseUserData);
          }
        }
      } else {
        updateUser(null);
      }
    setLoading(false);
      setInitialized(true);
    };

    try {
      unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);
    } catch (error) {
      console.error('Auth state change error:', error);
      setLoading(false);
      setInitialized(true);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [updateUser]);

  const login = async (email, password, retryCount = 0) => {
    try {
      // Validate email format
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Validate password
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Log the request details in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Attempting login with:', {
          email: email.trim().toLowerCase(),
          hasPassword: !!password,
          timestamp: new Date().toISOString(),
          retryCount
        });
      }

      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      
      // Log successful response in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Login successful:', {
          userId: userCredential.user.uid,
          email: userCredential.user.email,
          timestamp: new Date().toISOString()
        });
      }

      return {
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL
        }
      };
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle specific Firebase errors
      let errorMessage = 'An error occurred during login';
      switch (err.code) {
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/network-request-failed':
          if (retryCount < 3) {
            console.log(`Retrying login attempt ${retryCount + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return login(email, password, retryCount + 1);
          }
          errorMessage = 'Network error. Please check your internet connection';
          break;
        default:
          errorMessage = err.message || 'An unexpected error occurred';
      }
      
      throw new Error(errorMessage);
    }
  };

  const register = async (userData) => {
    try {
      // Validate required fields
      if (!userData.name || !userData.email || !userData.password || !userData.shopName) {
        throw new Error('All fields are required');
      }

      // Validate email format
      if (!userData.email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Validate password
      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Log the request details in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Attempting registration with:', {
          ...userData,
          password: '[REDACTED]',
          timestamp: new Date().toISOString()
        });
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email.trim().toLowerCase(),
        userData.password
      );

      // Update user profile with name
      await updateProfile(userCredential.user, {
        displayName: userData.name
      });

      // Create user in MongoDB with shop name
      try {
        const response = await axios.post('/api/auth/register', {
          email: userData.email,
          firebaseUid: userCredential.user.uid,
          name: userData.name,
          shopName: userData.shopName
        });

        // Update the user state with the MongoDB data
        const mongoUser = response.data.user;
        const combinedUser = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: mongoUser.name,
          photoURL: userCredential.user.photoURL,
          shopName: mongoUser.shopName,
          ...mongoUser
        };
        updateUser(combinedUser);
    } catch (error) {
        console.error('Error creating user in MongoDB:', error);
        // If MongoDB fails, still update with Firebase data
        const firebaseUser = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userData.name,
          photoURL: userCredential.user.photoURL,
          shopName: userData.shopName
        };
        updateUser(firebaseUser);
      }

      return {
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userData.name,
          photoURL: userCredential.user.photoURL,
          shopName: userData.shopName
        }
      };
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle specific error cases
      switch (err.code) {
        case 'auth/email-already-in-use':
          throw new Error('An account with this email already exists');
        case 'auth/invalid-email':
          throw new Error('Invalid email address');
        case 'auth/operation-not-allowed':
          throw new Error('Email/password accounts are not enabled. Please contact support');
        case 'auth/weak-password':
          throw new Error('Password is too weak. Please use a stronger password');
        case 'auth/network-request-failed':
          throw new Error('Network error. Please check your connection and try again');
        default:
          throw new Error(err.message || 'Registration failed. Please try again.');
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
      throw new Error('Failed to log out. Please try again.');
    }
  };

  const value = {
    user,
    loading,
    initialized,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 