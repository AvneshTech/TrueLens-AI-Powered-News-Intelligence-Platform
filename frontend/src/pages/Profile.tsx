import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield } from 'lucide-react';

export const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500 dark:text-zinc-400">No user found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Profile
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Your account information
        </p>
      </div>

      {/* Card */}
      <Card
        className="
        rounded-2xl
        border border-zinc-200 dark:border-zinc-800
        bg-white dark:bg-gradient-to-br dark:from-zinc-900 dark:to-black
        shadow-lg dark:shadow-[0_10px_40px_rgba(0,0,0,0.6)]
        transition-all
      "
      >
        <CardContent className="p-8 space-y-8">

          {/* Avatar + Name */}
          <div className="flex items-center gap-6">

            {/* Avatar Glow */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 blur-xl opacity-30 dark:opacity-40"></div>

              <Avatar className="relative w-20 h-20 border border-zinc-300 dark:border-zinc-700">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-semibold">
                  {user.fullName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                {user.fullName}
              </h2>

              <Badge className="mt-2 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none shadow">
                <Shield className="w-3 h-3 mr-1" />
                {user.role}
              </Badge>
            </div>
          </div>

          {/* Fields */}
          <div className="grid gap-6">

            {/* Full Name */}
            <div className="space-y-2">
              <Label className="text-zinc-600 dark:text-zinc-400 text-sm">
                Full Name
              </Label>

              <div className="
                flex items-center gap-3 px-4 py-3 rounded-xl
                bg-zinc-100 dark:bg-zinc-900
                border border-zinc-200 dark:border-zinc-800
                focus-within:border-blue-500 transition
              ">
                <User className="w-4 h-4 text-zinc-500" />

                <Input
                  value={user.fullName}
                  disabled
                  className="bg-transparent border-none focus-visible:ring-0 text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-zinc-600 dark:text-zinc-400 text-sm">
                Email
              </Label>

              <div className="
                flex items-center gap-3 px-4 py-3 rounded-xl
                bg-zinc-100 dark:bg-zinc-900
                border border-zinc-200 dark:border-zinc-800
                focus-within:border-blue-500 transition
              ">
                <Mail className="w-4 h-4 text-zinc-500" />

                <Input
                  value={user.email}
                  disabled
                  className="bg-transparent border-none focus-visible:ring-0 text-zinc-900 dark:text-white"
                />
              </div>
            </div>

          </div>

        </CardContent>
      </Card>
    </div>
  );
};