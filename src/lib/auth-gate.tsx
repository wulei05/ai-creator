'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AuthGateContextValue {
  isOpen: boolean;
  require: () => boolean;
  openModal: () => void;
  closeModal: () => void;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({ user, children }: { user: unknown; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  const require = useCallback((): boolean => {
    if (user) return true;
    setIsOpen(true);
    return false;
  }, [user]);

  return (
    <AuthGateContext.Provider value={{ isOpen, require, openModal, closeModal }}>
      {children}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate(): AuthGateContextValue {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error('useAuthGate must be used inside AuthGateProvider');
  return ctx;
}
