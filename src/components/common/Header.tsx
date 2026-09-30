import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  rightAction,
  subtitle,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-header safe-top px-4 pb-3 flex items-center justify-between transition-all">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all text-slate-700"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <div className="flex flex-col truncate">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate leading-tight">
            {title}
          </h1>
          {subtitle && (
            <span className="text-xs text-slate-500 font-medium truncate">{subtitle}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {rightAction ? (
          rightAction
        ) : user ? (
          <div className="flex items-center gap-1">
            {user.role === 'USER' && (
              <button
                onClick={() => navigate('/user/notifications')}
                className="p-2 rounded-full text-slate-600 hover:bg-slate-100 relative active:scale-95 transition-all"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={logout}
              title="Log out"
              className="p-2 rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-all"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};
