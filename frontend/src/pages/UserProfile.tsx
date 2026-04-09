import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { User, Mail, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UserProfile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500">No user found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-zinc-500">Your account information</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* Avatar + Role */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
              {user.fullName?.charAt(0) || "U"}
            </div>

            <div>
              <h2 className="text-xl font-semibold">{user.fullName}</h2>

              <Badge variant="secondary" className="mt-1">
                <Shield className="w-3 h-3 mr-1" />
                {user.role}
              </Badge>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label>Full Name</Label>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-zinc-500" />
              <Input value={user.fullName} disabled />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-zinc-500" />
              <Input value={user.email} disabled />
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}