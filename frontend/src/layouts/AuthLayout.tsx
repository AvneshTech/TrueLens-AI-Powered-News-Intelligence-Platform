import { Outlet } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 mb-4">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            TrueLens
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            AI News Intelligence Platform
          </p>
        </div>

        {/* Auth Form */}
        <Outlet />
      </div>
    </div>
  );
};
