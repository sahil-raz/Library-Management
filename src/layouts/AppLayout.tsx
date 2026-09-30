import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomNav } from '../components/common/BottomNav.js';
import { ErrorBoundary } from '../components/common/ErrorBoundary.js';
import { useAuth } from '../context/AuthContext.js';

export const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Hide bottom nav and control scroll on auth pages
  const isLoginPage =
    location.pathname === '/login' ||
    location.pathname === '/login/user' ||
    location.pathname === '/user/login';

  const isAuthPage =
    isLoginPage ||
    location.pathname.startsWith('/register');

  return (
    <div className="mobile-viewport">
      <main
        className={`flex-1 flex flex-col min-h-0 ${
          isLoginPage
            ? 'overflow-hidden'
            : 'overflow-y-auto overscroll-contain'
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`flex-1 flex flex-col ${isLoginPage ? 'h-full min-h-0' : 'min-h-full'}`}
          >
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
            {!isAuthPage && user && (
              <div className="h-28 w-full shrink-0 pointer-events-none" aria-hidden="true" />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {!isAuthPage && user && <BottomNav />}
    </div>
  );
};
