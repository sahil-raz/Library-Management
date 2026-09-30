import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Layers,
  Activity,
  Building2,
  Armchair,
  MoreHorizontal,
  Clock,
  Receipt,
  Bell,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
}

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  let items: NavItem[] = [];

  if (user.role === 'SUPER_ADMIN') {
    items = [
      { id: 'home', label: 'Home', path: '/superadmin', icon: LayoutDashboard },
      { id: 'admins', label: 'Admins', path: '/superadmin/admins', icon: Users },
      { id: 'payments', label: 'Payments', path: '/superadmin/payments', icon: CreditCard },
      { id: 'plans', label: 'Plans', path: '/superadmin/plans', icon: Layers },
      { id: 'activity', label: 'Activity', path: '/superadmin/activity', icon: Activity },
    ];
  } else if (user.role === 'ADMIN') {
    items = [
      { id: 'home', label: 'Home', path: '/admin', icon: LayoutDashboard },
      { id: 'branches', label: 'Branches', path: '/admin/branches', icon: Building2 },
      { id: 'users', label: 'Users', path: '/admin/users', icon: Users },
      { id: 'seats', label: 'Seats', path: '/admin/seats', icon: Armchair },
      { id: 'more', label: 'More', path: '/admin/more', icon: MoreHorizontal },
    ];
  } else if (user.role === 'MANAGER') {
    items = [
      { id: 'home', label: 'Home', path: '/manager', icon: LayoutDashboard },
      { id: 'users', label: 'Users', path: '/manager/users', icon: Users },
      { id: 'seats', label: 'Seats', path: '/manager/seats', icon: Armchair },
      { id: 'queue', label: 'Queue', path: '/manager/queue', icon: Clock },
      { id: 'expenses', label: 'Expenses', path: '/manager/expenses', icon: Receipt },
    ];
  } else if (user.role === 'USER') {
    items = [
      { id: 'home', label: 'Home', path: '/user/dashboard', icon: LayoutDashboard },
      { id: 'subscription', label: 'Plan', path: '/user/subscription', icon: CreditCard },
      { id: 'seat', label: 'Seat', path: '/user/seat', icon: Armchair },
      { id: 'notifications', label: 'Alerts', path: '/user/notifications', icon: Bell },
      { id: 'profile', label: 'Profile', path: '/user/profile', icon: UserIcon },
    ];
  }

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-40 w-full glass-nav safe-bottom">
      <div className="flex items-center justify-around px-2 py-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' &&
              item.path !== '/superadmin' &&
              item.path !== '/admin' &&
              item.path !== '/manager' &&
              item.path !== '/user/dashboard' &&
              location.pathname.startsWith(item.path));

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center flex-1 py-1 text-center transition-all select-none active:scale-90"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute -inset-1.5 bg-blue-50/90 rounded-2xl -z-10"
                  />
                )}
                <Icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? 'text-ios-blue stroke-[2.4]' : 'text-slate-400 stroke-[1.8]'
                  }`}
                />
              </div>
              <span
                className={`text-[10px] mt-1 font-semibold transition-colors duration-200 ${
                  isActive ? 'text-ios-blue' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
