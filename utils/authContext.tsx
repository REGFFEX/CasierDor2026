import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  UserRole,
  ForgotPasswordData,
  ResetPasswordData,
  AuthState,
  ConnectionMode,
  DeviceType,
  UpdateProfileData,
  DEFAULT_USER_PREFERENCES,
  AUTH_STORAGE_KEYS
} from '../types';
import { authService } from '../utils/authService';
import { activateStorageForUser, clearActiveStorageScope } from '../utils/accountStorage';

// Types d'actions pour le reducer
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_CONNECTION_MODE'; payload: ConnectionMode }
  | { type: 'SET_DEVICE_TYPE'; payload: DeviceType }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'CLEAR_ERROR' }
  | { type: 'INITIALIZE'; payload: User | null };

// État initial
const initialState: AuthState = {
  user: null as any,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  connectionMode: DEFAULT_USER_PREFERENCES.connectionMode,
  deviceType: DEFAULT_USER_PREFERENCES.deviceType,
  isOnline: navigator.onLine
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload as any,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null as any,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case 'SET_CONNECTION_MODE':
      return {
        ...state,
        connectionMode: action.payload
      };

    case 'SET_DEVICE_TYPE':
      return {
        ...state,
        deviceType: action.payload
      };

    case 'SET_ONLINE_STATUS':
      return {
        ...state,
        isOnline: action.payload
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } as any : null as any
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    case 'INITIALIZE':
      return {
        ...state,
        user: action.payload as any,
        isAuthenticated: action.payload !== null,
        isLoading: false
      };

    default:
      return state;
  }
};

// Contexte
interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<AuthResponse>;
  forgotPassword: (data: ForgotPasswordData) => Promise<AuthResponse>;
  resetPassword: (data: ResetPasswordData) => Promise<AuthResponse>;
  updateProfile: (data: UpdateProfileData) => Promise<AuthResponse>;
  setConnectionMode: (mode: ConnectionMode) => void;
  setDeviceType: (type: DeviceType) => void;
  clearError: () => void;
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Détecter le type d'appareil
  const detectDeviceType = (): DeviceType => {
    const width = window.innerWidth;
    if (width < 768) return DeviceType.MOBILE;
    if (width < 1024) return DeviceType.TABLET;
    return DeviceType.DESKTOP;
  };

  // Détecter la langue du navigateur
  const detectLanguage = (): string => {
    const browserLang = navigator.language || navigator.languages?.[0];
    if (browserLang?.startsWith('fr')) return 'fr';
    if (browserLang?.startsWith('en')) return 'en';
    if (browserLang?.startsWith('es')) return 'es';
    return 'fr'; // Par défaut
  };

  // Initialiser au montage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const isSecureAuthForced = localStorage.getItem('casierdor_secure_auth_forced') === 'true';
        const currentUser = authService.getCurrentUser();

        if (currentUser && !isSecureAuthForced) {
          const deviceType = detectDeviceType();
          const language = detectLanguage();

          const updatedUser = {
            ...currentUser,
            preferences: {
              ...(currentUser.preferences || {}),
              deviceType,
              language
            }
          };

          activateStorageForUser(updatedUser);
          dispatch({ type: 'INITIALIZE', payload: updatedUser });
        } else {
          dispatch({ type: 'INITIALIZE', payload: null });
          if (isSecureAuthForced) {
            localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
          }
        }

        const savedConnectionMode = localStorage.getItem(AUTH_STORAGE_KEYS.CONNECTION_MODE) as ConnectionMode;
        if (savedConnectionMode) {
          dispatch({ type: 'SET_CONNECTION_MODE', payload: savedConnectionMode });
        }

        const savedDeviceType = localStorage.getItem(AUTH_STORAGE_KEYS.DEVICE_TYPE) as DeviceType;
        if (savedDeviceType) {
          dispatch({ type: 'SET_DEVICE_TYPE', payload: savedDeviceType });
        }

      } catch (error) {
        console.error('[AuthContext] Erreur initialisation auth:', error);
        dispatch({ type: 'INITIALIZE', payload: null });
      }
    };

    initializeAuth();
  }, []);

  // Écouter les changements de connexion
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Écouter les changements de taille d'écran
  useEffect(() => {
    const handleResize = () => {
      const newDeviceType = detectDeviceType();
      if (newDeviceType !== state.deviceType) {
        dispatch({ type: 'SET_DEVICE_TYPE', payload: newDeviceType });
        localStorage.setItem(AUTH_STORAGE_KEYS.DEVICE_TYPE, newDeviceType);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.deviceType]);

  // Actions
  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await authService.login(credentials);

      if (response.success && response.user) {
        activateStorageForUser(response.user);
        dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.message });
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const register = async (data: RegisterData): Promise<AuthResponse> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await authService.register(data);

      if (response.success && response.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.message });
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur d\'inscription';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const logout = async (): Promise<AuthResponse> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await authService.logout();

      if (response.success) {
        dispatch({ type: 'LOGOUT' });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.message });
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de déconnexion';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const forgotPassword = async (data: ForgotPasswordData): Promise<AuthResponse> => {
    try {
      const response = await authService.forgotPassword(data);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la réinitialisation';
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const resetPassword = async (data: ResetPasswordData): Promise<AuthResponse> => {
    try {
      const response = await authService.resetPassword(data);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la réinitialisation';
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const updateProfile = async (data: UpdateProfileData): Promise<AuthResponse> => {
    if (!state.user) {
      return {
        success: false,
        message: 'Utilisateur non connecté'
      };
    }

    try {
      const response = await authService.updateProfile((state.user as any).id, data);

      if (response.success && response.user) {
        dispatch({ type: 'UPDATE_USER', payload: response.user });
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const setConnectionMode = (mode: ConnectionMode) => {
    dispatch({ type: 'SET_CONNECTION_MODE', payload: mode });
    localStorage.setItem(AUTH_STORAGE_KEYS.CONNECTION_MODE, mode);
  };

  const setDeviceType = (type: DeviceType) => {
    dispatch({ type: 'SET_DEVICE_TYPE', payload: type });
    localStorage.setItem(AUTH_STORAGE_KEYS.DEVICE_TYPE, type);
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const hasRole = (role: UserRole): boolean => {
    return (state.user as any)?.role === role;
  };

  const isAdmin = (): boolean => {
    return (state.user as any)?.role === UserRole.ADMIN;
  };

  const value: AuthContextType = {
    state,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    setConnectionMode,
    setDeviceType,
    clearError,
    hasRole,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};
