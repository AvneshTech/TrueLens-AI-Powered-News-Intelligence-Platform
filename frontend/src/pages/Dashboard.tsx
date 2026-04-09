import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Users,
  Shield,
  Flag,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/ui/badge";
import { apiService } from "../services/apiService";
import { toast } from "sonner"; // Ensure toast is imported!
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useQuery } from "@tanstack/react-query";

// Map of icons for dynamic stats
const iconMap: Record<string, any> = {
  "Total Articles Analyzed": Activity,
  "Fake News Detected": AlertTriangle,
  "Real News Verified": TrendingUp,
  "AI Predictions Today": Activity,
  "Total Users": Users,
  "Articles Flagged": Flag,
  "Platform Health": Shield,
  "Active Sessions": Activity,
};

export const Dashboard = () => {
  const { user, isAdmin } = useAuth();

  const [stats, setStats] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const stompClient = useRef<any>(null);

  // ✅ React Query for dashboard data
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', isAdmin],
    queryFn: async () => {
      if (!user) return null;
      let response;
      if (isAdmin) {
        response = await apiService.getAdminDashboard();
      } else {
        response = await apiService.getDashboardStats();
      }
      return response;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (dashboardData && dashboardData.success && dashboardData.data) {
      setStats(dashboardData.data.stats || []);
      setActivityData(dashboardData.data.activityData || []);
      setPieData(dashboardData.data.pieData || []);
      setCategoryData(dashboardData.data.categoryData || []);
      setRecentActivity(dashboardData.data.recentActivity || []);
    }
  }, [dashboardData]);

  const connectWebSocket = () => {
    const socket = new SockJS('http://localhost:8080/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/predictions', () => {
          refetch();
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame.headers['message'], frame.body);
      },
      debug: () => {},
    });

    stompClient.current = client;
    client.activate();
  };

  const disconnectWebSocket = () => {
    if (stompClient.current) {
      stompClient.current.deactivate();
    }
  };

  useEffect(() => {
    if (user) {
      connectWebSocket();
    }
    return () => {
      disconnectWebSocket();
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-zinc-500">Connecting to server...</p>
      </div>
    );
  }

  // ... (The rest of your return statement/JSX remains exactly the same below) ...

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          {isAdmin ? (
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 text-xs sm:text-sm"
            >
              Admin View
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 text-xs sm:text-sm"
            >
              User View
            </Badge>
          )}
        </div>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
          {isAdmin
            ? "System overview and administrative insights"
            : "Overview of your AI news intelligence analytics"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const IconComponent = iconMap[stat.title] || Activity;

          return (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${isAdmin ? "bg-purple-100 dark:bg-purple-950" : "bg-blue-100 dark:bg-blue-950"}`}
                    >
                      <IconComponent
                        className={`w-4 sm:w-5 h-4 sm:h-5 ${isAdmin ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"}`}
                      />
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs sm:text-sm font-medium ${
                      stat.trend === "up"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {stat.trend === "up" ? (
                      <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4" />
                    ) : (
                      <TrendingDown className="w-3 sm:w-4 h-3 sm:h-4" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-xl sm:text-2xl font-bold">{stat.value}</h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {stat.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Line Chart */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">News Analysis Activity</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Article analysis over the past week
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-zinc-200 dark:stroke-zinc-800"
                />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Total Articles"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Fake vs Real Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Overall analysis results</CardDescription>
          </CardHeader>
          <CardContent className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || "#8884d8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Top Categories</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Articles analyzed by category</CardDescription>
        </CardHeader>
        <CardContent className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-zinc-200 dark:stroke-zinc-800"
              />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="real" fill="#10b981" radius={[8, 8, 0, 0]} name="Real" />
              <Bar dataKey="fake" fill="#ef4444" radius={[8, 8, 0, 0]} name="Fake" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Recent News Analysis Activity</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Latest articles analyzed by the AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${activity.result === "Real" ? "bg-green-500" : "bg-red-500"}`}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm sm:text-base truncate">{activity.title}</h4>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {activity.source}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200 dark:border-zinc-800">
                  <div className="text-right">
                    <div
                      className={`text-xs sm:text-sm font-medium ${activity.result === "Real" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {activity.result}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {activity.confidence}% confidence
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {activity.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};