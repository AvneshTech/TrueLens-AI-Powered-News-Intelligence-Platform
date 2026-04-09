import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Users,
  Shield,
  TrendingUp,
  TrendingDown,
  Ban,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";

// ✅ FIX: import types from apiService (aligned with backend) not api.types.ts
import apiService, { DashboardResponse } from "../services/apiService";

export const AdminPanel = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, dashboardResponse] = await Promise.all([
        apiService.getAllUsers(),
        apiService.getAdminDashboard(), // ✅ FIX: use dashboard not analytics
      ]);

      if (usersResponse?.success) {
        // Backend wraps users in { users: [...] }
        const userList = usersResponse.data?.users || [];
        setUsers(Array.isArray(userList) ? userList : []);
      }

      if (dashboardResponse?.success) {
        setDashboard(dashboardResponse.data);
      }
    } catch (error) {
      console.error("Failed to load admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    try {
      // ✅ NOTE: banUser calls PUT on backend (dedicated ban endpoint)
      const response = await apiService.banUser(selectedUser.id);
      if (response.success) {
        toast.success(`User ${selectedUser.fullName} banned`);
        setShowBanDialog(false);
        setBanReason("");
        setSelectedUser(null);
        loadData();
      }
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleUnban = async (id: number) => {
    try {
      const response = await apiService.unbanUser(id);
      if (response.success) {
        toast.success("User unbanned");
        loadData();
      }
    } catch (error) {
      toast.error("Failed to unban user");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const response = await apiService.deleteUser(selectedUser.id);
      if (response.success) {
        toast.success(`User ${selectedUser.fullName} deleted`);
        setShowDeleteDialog(false);
        setSelectedUser(null);
        loadData();
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
        <p className="text-zinc-500">Loading Admin Panel...</p>
      </div>
    );
  }

  // ✅ FIX: dashboard.stats comes from backend as StatCard[]
  // Each has: { title, value, change, trend }
  const statsCards = dashboard?.stats || [];

  return (
    <div className="space-y-6 p-6">
      <Alert className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900">
        <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <AlertDescription className="text-purple-900 dark:text-purple-100">
          <strong>Admin Access:</strong> You have full administrative
          privileges.
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-lg">
          <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage users and oversee platform activity
          </p>
        </div>
      </div>

      {/* Stats from backend */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <span
                  className={`text-xs font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 inline" />
                  ) : (
                    <TrendingDown className="w-4 h-4 inline" />
                  )}{" "}
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {stat.title}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage platform users ({users.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-zinc-500"
                      >
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        {/* ✅ FIX: backend sends "fullName" (mapped from name field) */}
                        <TableCell className="font-medium">
                          {user.fullName || user.name || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              user.role?.includes("ADMIN")
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                            }
                          >
                            {user.role?.replace("ROLE_", "") || "USER"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {/* ✅ FIX: backend sends "status" as "ACTIVE" or "BANNED" */}
                          <Badge
                            variant="secondary"
                            className={
                              user.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {user.status === "ACTIVE" ? (
                              <CheckCircle className="w-3 h-3 mr-1 inline" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1 inline" />
                            )}
                            {user.status || "ACTIVE"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-zinc-500">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!user.role?.includes("ADMIN") && (
                              <>
                                {user.status === "ACTIVE" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowBanDialog(true);
                                    }}
                                    className="text-yellow-600 hover:text-yellow-700"
                                    title="Ban user"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUnban(user.id)}
                                    className="text-green-600 hover:text-green-700"
                                    title="Unban user"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pie Chart Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(dashboard?.pieData || []).map((item: any, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-zinc-600">{item.name}</span>
                      <Badge variant="outline">{item.value}</Badge>
                    </div>
                  ))}
                  {(dashboard?.pieData || []).length === 0 && (
                    <p className="text-sm text-zinc-500 text-center py-4">
                      No data yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(dashboard?.categoryData || []).map((item: any, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-zinc-600">{item.name}</span>
                      <div className="flex gap-2 text-xs">
                        <span className="text-green-600">
                          Real: {item.real}
                        </span>
                        <span className="text-red-600">Fake: {item.fake}</span>
                      </div>
                    </div>
                  ))}
                  {(dashboard?.categoryData || []).length === 0 && (
                    <p className="text-sm text-zinc-500 text-center py-4">
                      No data yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Ban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
            <DialogDescription>
              This will delete {selectedUser?.fullName || selectedUser?.name}.
              Provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Reason</Label>
            <Textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBanDialog(false);
                setBanReason("");
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBanUser}
              disabled={!banReason}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Ban className="w-4 h-4 mr-2" />
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Permanently delete {selectedUser?.fullName || selectedUser?.name}?
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
