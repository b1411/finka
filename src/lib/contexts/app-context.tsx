'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Notification } from '@/components/ui/enhanced-ui';

interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

interface NotificationContextType {
  notifications: NotificationData[];
  addNotification: (notification: Omit<NotificationData, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = useCallback((notification: Omit<NotificationData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      
      {/* Рендер уведомлений */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            show={true}
            onClose={() => removeNotification(notification.id)}
            autoClose={notification.autoClose}
            autoCloseDelay={notification.autoCloseDelay}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Хуки для быстрого добавления уведомлений разных типов
export function useNotificationHelpers() {
  const { addNotification } = useNotifications();

  const showSuccess = useCallback((title: string, message: string) => {
    addNotification({
      type: 'success',
      title,
      message,
      autoClose: true,
      autoCloseDelay: 3000
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string) => {
    addNotification({
      type: 'error',
      title,
      message,
      autoClose: true,
      autoCloseDelay: 5000
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string) => {
    addNotification({
      type: 'warning',
      title,
      message,
      autoClose: true,
      autoCloseDelay: 4000
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string) => {
    addNotification({
      type: 'info',
      title,
      message,
      autoClose: true,
      autoCloseDelay: 3000
    });
  }, [addNotification]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}

// Глобальное состояние приложения
interface AppState {
  isLoading: boolean;
  currentUser: any | null;
  selectedPeriod: string;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
}

interface AppContextType extends AppState {
  setLoading: (loading: boolean) => void;
  setCurrentUser: (user: any | null) => void;
  setSelectedPeriod: (period: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    isLoading: false,
    currentUser: null,
    selectedPeriod: new Date().getFullYear().toString() + String(new Date().getMonth() + 1).padStart(2, '0'),
    sidebarCollapsed: false,
    theme: 'light'
  });

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const contextValue: AppContextType = {
    ...state,
    setLoading: useCallback((loading: boolean) => updateState({ isLoading: loading }), [updateState]),
    setCurrentUser: useCallback((user: any | null) => updateState({ currentUser: user }), [updateState]),
    setSelectedPeriod: useCallback((period: string) => updateState({ selectedPeriod: period }), [updateState]),
    setSidebarCollapsed: useCallback((collapsed: boolean) => updateState({ sidebarCollapsed: collapsed }), [updateState]),
    setTheme: useCallback((theme: 'light' | 'dark') => updateState({ theme }), [updateState])
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}

// Хук для управления локальным состоянием с персистентностью
export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prevValue: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prevValue: T) => T)) => {
    setState(prevValue => {
      const newValue = typeof value === 'function' 
        ? (value as (prevValue: T) => T)(prevValue)
        : value;
      
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(key, JSON.stringify(newValue));
        } catch (error) {
          console.warn(`Error setting localStorage key "${key}":`, error);
        }
      }
      
      return newValue;
    });
  }, [key]);

  return [state, setValue];
}

// Хук для дебаунсинга значений
export function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  });

  return debouncedValue;
}

// Хук для управления асинхронными операциями
export function useAsync<T, P extends any[]>(
  asyncFunction: (...args: P) => Promise<T>
) {
  const [state, setState] = useState<{
    loading: boolean;
    error: Error | null;
    data: T | null;
  }>({
    loading: false,
    error: null,
    data: null
  });

  const execute = useCallback(async (...args: P) => {
    setState({ loading: true, error: null, data: null });
    
    try {
      const result = await asyncFunction(...args);
      setState({ loading: false, error: null, data: result });
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      setState({ loading: false, error: errorObj, data: null });
      throw errorObj;
    }
  }, [asyncFunction]);

  return {
    ...state,
    execute
  };
}