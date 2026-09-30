import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { SiteConfigProvider } from './context/SiteConfigContext.js';
import { AppLayout } from './layouts/AppLayout.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';

// Auth Pages
import { Login } from './pages/auth/Login.js';
import { AdminRegister } from './pages/auth/AdminRegister.js';
import { UserRegister } from './pages/auth/UserRegister.js';

// Super Admin Pages
import { SuperAdminDashboard } from './pages/superadmin/Dashboard.js';
import { AdminsList } from './pages/superadmin/AdminsList.js';
import { AdminDetail } from './pages/superadmin/AdminDetail.js';
import { SaaSPlanCreator } from './pages/superadmin/SaaSPlanCreator.js';
import { AdminPayments } from './pages/superadmin/AdminPayments.js';
import { SuperAdminPaymentConfig } from './pages/superadmin/PaymentConfig.js';
import { ActivityLogs } from './pages/superadmin/ActivityLogs.js';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard.js';
import { SaaSPurchase } from './pages/admin/SaaSPurchase.js';
import { BranchList } from './pages/admin/BranchList.js';
import { ManagerList } from './pages/admin/ManagerList.js';
import { SeatList } from './pages/admin/SeatList.js';
import { UserList } from './pages/admin/UserList.js';
import { UserPlanCreator } from './pages/admin/UserPlanCreator.js';
import { PaymentApproval } from './pages/admin/PaymentApproval.js';
import { Expenses } from './pages/admin/Expenses.js';
import { WhatsAppReminders } from './pages/admin/WhatsAppReminders.js';
import { QueueManagement } from './pages/admin/QueueManagement.js';
import { AdminSettings } from './pages/admin/Settings.js';
import { AdminAuditLogs } from './pages/admin/AuditLogs.js';
import { MoreMenu } from './pages/admin/MoreMenu.js';

// Manager Pages
import { ManagerDashboard } from './pages/manager/Dashboard.js';
import { ManagerUsers } from './pages/manager/Users.js';
import { ManagerSeats } from './pages/manager/Seats.js';
import { ManagerQueue } from './pages/manager/Queue.js';
import { ManagerExpenses } from './pages/manager/Expenses.js';

// User Pages
import { UserDashboard } from './pages/user/Dashboard.js';
import { MySubscription } from './pages/user/MySubscription.js';
import { MySeat } from './pages/user/MySeat.js';
import { UserNotifications } from './pages/user/Notifications.js';
import { UserProfile } from './pages/user/Profile.js';

// Protected Route Guard
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-ios-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's authorized home
    if (user.role === 'SUPER_ADMIN') return <Navigate to="/superadmin" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'MANAGER') return <Navigate to="/manager" replace />;
    return <Navigate to="/user/dashboard" replace />;
  }

  return <>{children}</>;
}

// Root Redirector
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-ios-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'SUPER_ADMIN') return <Navigate to="/superadmin" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'MANAGER') return <Navigate to="/manager" replace />;
  return <Navigate to="/user/dashboard" replace />;
}

export function App() {
  return (
    <ErrorBoundary>
      <SiteConfigProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
              {/* Root */}
              <Route path="/" element={<RootRedirect />} />

              {/* Public Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/login/user" element={<Login />} />
              <Route path="/user/login" element={<Login />} />
              <Route path="/register" element={<UserRegister />} />
              <Route path="/register/admin" element={<AdminRegister />} />
              <Route path="/register/user" element={<UserRegister />} />

              {/* Super Admin Protected Routes */}
              <Route
                path="/superadmin"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/admins"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <AdminsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/admins/:adminId"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <AdminDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/plans"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <SaaSPlanCreator />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/plans/new"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <SaaSPlanCreator />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plan-creator"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <SaaSPlanCreator />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/payments"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <AdminPayments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-payments"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <AdminPayments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/settings"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <SuperAdminPaymentConfig />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/activity"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <ActivityLogs />
                  </ProtectedRoute>
                }
              />

              {/* Library Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/subscription"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <SaaSPurchase />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/plans"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <SaaSPurchase />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/saas-purchase"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <SaaSPurchase />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/branches"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <BranchList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/managers"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <ManagerList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/seats"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <SeatList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <UserList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/plans"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <UserPlanCreator />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/payments"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <PaymentApproval />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/expenses"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Expenses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reminders"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <WhatsAppReminders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/queue"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <QueueManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminAuditLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/more"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <MoreMenu />
                  </ProtectedRoute>
                }
              />

              {/* Manager Protected Routes */}
              <Route
                path="/manager"
                element={
                  <ProtectedRoute allowedRoles={['MANAGER']}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/users"
                element={
                  <ProtectedRoute allowedRoles={['MANAGER']}>
                    <ManagerUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/seats"
                element={
                  <ProtectedRoute allowedRoles={['MANAGER']}>
                    <ManagerSeats />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/queue"
                element={
                  <ProtectedRoute allowedRoles={['MANAGER']}>
                    <ManagerQueue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/expenses"
                element={
                  <ProtectedRoute allowedRoles={['MANAGER']}>
                    <ManagerExpenses />
                  </ProtectedRoute>
                }
              />

              {/* Student/Patron Protected Routes */}
              <Route
                path="/user/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['USER']}>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/subscription"
                element={
                  <ProtectedRoute allowedRoles={['USER']}>
                    <MySubscription />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/seat"
                element={
                  <ProtectedRoute allowedRoles={['USER']}>
                    <MySeat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/notifications"
                element={
                  <ProtectedRoute allowedRoles={['USER']}>
                    <UserNotifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/profile"
                element={
                  <ProtectedRoute allowedRoles={['USER']}>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  </SiteConfigProvider>
</ErrorBoundary>
  );
}

export default App;
