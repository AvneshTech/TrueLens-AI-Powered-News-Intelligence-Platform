import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// 🔥 Skeleton Loader Component
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-zinc-800/60 rounded-xl ${className}`} />
);

// 🔥 Safe fallback data
const fallback = {
  monthly: [{ month: "...", real: 0, fake: 0, total: 0 }],
  distribution: [{ name: "Loading", value: 100 }],
  category: [{ category: "...", accuracy: 0 }],
  accuracy: [{ subject: "...", A: 0 }],
  daily: [{ day: "...", analyses: 0 }],
  stats: []
};

export const Analytics = () => {

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(false);

    fetch("http://localhost:8080/api/analytics")
      .then(res => res.json())
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const d = data || fallback;

  return (
    <div className="space-y-6 transition-all duration-500">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>

        {error && (
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
          >
            Retry
          </button>
        )}
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="text-center text-zinc-400 py-10">
          Failed to load analytics data
        </div>
      )}

      {/* CHART GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* AREA CHART */}
        <Card className="relative overflow-hidden">
          {loading && <Skeleton className="absolute inset-0 z-10" />}

          <CardHeader>
            <CardTitle>Monthly Analysis</CardTitle>
          </CardHeader>

          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={d.monthly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-800" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />

                <Area
                  dataKey="real"
                  stroke={loading ? "#444" : "#10b981"}
                  fill={loading ? "#222" : "#10b981"}
                />

                <Area
                  dataKey="fake"
                  stroke={loading ? "#555" : "#ef4444"}
                  fill={loading ? "#333" : "#ef4444"}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* PIE */}
        <Card className="relative overflow-hidden">
          {loading && <Skeleton className="absolute inset-0 z-10" />}

          <CardHeader>
            <CardTitle>Distribution</CardTitle>
          </CardHeader>

          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={d.distribution} dataKey="value">
                  {d.distribution.map((_: any, i: number) => (
                    <Cell
                      key={i}
                      fill={loading ? "#222" : ["#10b981", "#ef4444"][i % 2]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* BAR */}
        <Card className="relative overflow-hidden">
          {loading && <Skeleton className="absolute inset-0 z-10" />}

          <CardHeader>
            <CardTitle>Category Accuracy</CardTitle>
          </CardHeader>

          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={d.category}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-800" />
                <XAxis dataKey="category" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />

                <Bar
                  dataKey="accuracy"
                  fill={loading ? "#333" : "#3b82f6"}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RADAR */}
        <Card className="relative overflow-hidden">
          {loading && <Skeleton className="absolute inset-0 z-10" />}

          <CardHeader>
            <CardTitle>AI Accuracy</CardTitle>
          </CardHeader>

          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={d.accuracy}>
                <PolarGrid stroke="#444" />
                <PolarAngleAxis dataKey="subject" stroke="#666" />
                <PolarRadiusAxis stroke="#666" />

                <Radar
                  dataKey="A"
                  stroke={loading ? "#444" : "#3b82f6"}
                  fill={loading ? "#222" : "#3b82f6"}
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* LINE */}
        <Card className="relative overflow-hidden lg:col-span-2">
          {loading && <Skeleton className="absolute inset-0 z-10" />}

          <CardHeader>
            <CardTitle>Trend Analysis</CardTitle>
          </CardHeader>

          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={d.monthly}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-800" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Legend />

                <Line
                  dataKey="total"
                  stroke={loading ? "#444" : "#3b82f6"}
                  strokeWidth={2}
                />
                <Line
                  dataKey="real"
                  stroke={loading ? "#444" : "#10b981"}
                />
                <Line
                  dataKey="fake"
                  stroke={loading ? "#444" : "#ef4444"}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* EMPTY STATE */}
      {!loading && data && data.monthly?.length === 0 && (
        <div className="text-center text-zinc-500 py-10">
          No analytics data available yet
        </div>
      )}

    </div>
  );
};