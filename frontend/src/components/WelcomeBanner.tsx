import { useAuth } from '../context/AuthContext';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, UserCircle, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

export const WelcomeBanner = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <Alert className={`${isAdmin 
      ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-900' 
      : 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-900'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${isAdmin ? 'bg-purple-100 dark:bg-purple-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
          {isAdmin ? (
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          ) : (
            <UserCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        <div className="flex-1">
          <AlertDescription className={isAdmin ? 'text-purple-900 dark:text-purple-100' : 'text-blue-900 dark:text-blue-100'}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4" />
              <strong>Welcome back, {user.fullName}!</strong>
            </div>
            <p className="text-sm mt-1">
              {isAdmin ? (
                <>
                  You're logged in as an <strong>Administrator</strong>. You have full access to all platform features including user management, content moderation, and system analytics.
                </>
              ) : (
                <>
                  You're logged in as a <strong>User</strong>. Analyze news articles, detect fake news, chat with AI assistant, and manage your notes.
                </>
              )}
            </p>
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 bg-white dark:bg-zinc-900 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950"
                onClick={() => navigate('/admin')}
              >
                <Shield className="w-4 h-4 mr-2" />
                Go to Admin Panel
              </Button>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};
