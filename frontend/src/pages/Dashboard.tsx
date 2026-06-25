import { useEffect, useRef } from "react";
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
  ServerCrash,
  Inbox,
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
import { Button } from "../components/ui/button";
import { apiService, DashboardRecentActivity } from "../services/apiService";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { useQuery } from "@tanstack/react-query";
import { getWebSocketUrl } from "../utils/websocket";

// WS endpoint is resolved centrally (normalized, scheme-correct) in config/env.ts.
const WS_URL = getWebSocketUrl();

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

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "";
  const then = new Date(dateString).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// PHASE 8 FIX: the backend serializes PredictionResult as the raw uppercase enum
// name ("REAL" / "FAKE" / "UNCERTAIN"), not "Real" — comparing against "Real"
// (as this page previously did) never matched, so every activity row rendered
// with "fake" styling regardless of its actual result.
function isRealResult(result: DashboardRecentActivity["result"]): boolean {
  return result === "REAL";
}

export const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const stompClient = useRef<any>(null);

  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["dashboard", isAdmin],
    queryFn: async () => {
      const response = isAdmin
        ? await apiService.getAdminDashboard()
        : await apiService.getDashboardStats();

      // The backend wraps every response in ApiResult — success:false here means
      // the request reached the server but it declined to serve real data (e.g.
      // a validation problem), which is a genuine error state, not "no data yet".
      if (!response.success) {
        throw new Error(response.message || "Failed to load dashboard data");
      }
      return response.data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const stats = dashboardData?.stats ?? [];
  const activityData = dashboardData?.activityData ?? [];
  const pieData = dashboardData?.pieData ?? [];
  const categoryData = dashboardData?.categoryData ?? [];
  const recentActivity = dashboardData?.recentActivity ?? [];

  // PHASE 8: the backend sends raw counts in pieData (e.g. {name: "Real", value: 42}),
  // not percentages — this page's label previously rendered the raw count with a
  // misleading "%" suffix. Percentages are now computed client-side for display only.
  const pieTotal = pieData.reduce((sum, slice) => sum + (slice.value || 0), 0);

  const connectWebSocket = () => {
    const socket = new SockJS(WS_URL);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe("/topic/predictions", () => {
          refetch();
        });
      },
      onStompError: (frame) => {
        console.error("STOMP error", frame.headers["message"], frame.body);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p className="text-zinc-500">Loading your dashboard...</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <ServerCrash className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold mb-1">Couldn't load the dashboard</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 max-w-sm">
            {error instanceof Error ? error.message : "Something went wrong fetching your stats."}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : recentActivity.length === 0 && categoryData.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Inbox className="w-12 h-12 text-zinc-400 mb-4" />
          <h3 className="text-lg font-semibold mb-1">No activity yet</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
            Analyze your first article on the Detector page and your stats will show
            up here.
          </p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat) => {
              const IconComponent = iconMap[stat.title] || Activity;
              // PHASE 8 FIX: trend is "neutral" for every stat today (no
              // period-over-period baseline exists yet) — previously this fell
              // through to the "down" branch and showed a red ↓ on every card
              // with an empty change string. Only render the trend indicator
              // when there's an actual trend and change text to show.
              const hasTrend =
                (stat.trend === "up" || stat.trend === "down") && !!stat.change;

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
                      {hasTrend && (
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
                      )}
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
                {activityData.length === 0 ? (
                  <EmptyChartState label="No activity in the last 7 days yet" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={activityData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-zinc-200 dark:stroke-zinc-800"
                      />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" allowDecimals={false} />
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
                )}
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Fake vs Real Distribution</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Overall analysis results</CardDescription>
              </CardHeader>
              <CardContent className="h-64 sm:h-80">
                {pieTotal === 0 ? (
                  <EmptyChartState label="No analyzed articles yet" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        // PHASE 8 FIX: pieData carries raw counts, not percentages —
                        // compute the share of the total here instead of printing
                        // the raw count with a misleading "%" appended to it.
                        label={({ name, value }) =>
                          `${name}: ${Math.round((value / pieTotal) * 100)}%`
                        }
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
                )}
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
              {categoryData.length === 0 ? (
                <EmptyChartState label="No categorized articles yet" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-zinc-200 dark:stroke-zinc-800"
                    />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" allowDecimals={false} />
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
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Recent News Analysis Activity</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Latest articles analyzed by the AI</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 py-8 text-center">
                  No predictions yet — analyzed articles will show up here.
                </p>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {recentActivity.map((activity, index) => {
                    const real = isRealResult(activity.result);
                    return (
                      // PHASE 8 FIX: the backend's recentActivity items have no `id`
                      // field — keying on it always evaluated to `key={undefined}`.
                      // createdAt + index is stable enough for a read-only list that
                      // re-renders wholesale on each refetch.
                      <div
                        key={`${activity.createdAt}-${index}`}
                        className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${real ? "bg-green-500" : "bg-red-500"}`}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm sm:text-base truncate">
                            {activity.title}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200 dark:border-zinc-800">
                          <div className="text-right">
                            <div
                              className={`text-xs sm:text-sm font-medium ${real ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                            >
                              {activity.result}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              {/* PHASE 8 FIX: confidence is a 0-1 fraction from the ML
                                  service, not a percentage — this previously rendered
                                  e.g. "0.91% confidence" instead of "91% confidence". */}
                              {Math.round(activity.confidence * 100)}% confidence
                            </div>
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                            {formatRelativeTime(activity.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

function EmptyChartState({ label }: { label: string }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
      {label}
    </div>
  );
}
