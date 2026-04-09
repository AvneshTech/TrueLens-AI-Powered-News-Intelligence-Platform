import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { TrendingUp, Loader2, Plus, Smile, Frown, Meh } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import apiService from "../services/apiService";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

interface SentimentData {
  sentiment: "Positive" | "Neutral" | "Negative";
  count: number;
  percentage: number;
}

interface TrendEntry {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}

interface CategoryEntry {
  category: string;
  positive: number;
  neutral: number;
  negative: number;
}

interface ArticleEntry {
  id: number;
  title: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  score: number;
  category: string;
  date: Date;
}

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case "Positive":
      return "#10b981";
    case "Negative":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

const getSentimentBadge = (sentiment: string) => {
  const colors = {
    Positive:
      "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    Negative: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    Neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  };
  return colors[sentiment as keyof typeof colors] || colors.Neutral;
};

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case "Positive":
      return <Smile className="w-5 h-5 text-green-600" />;
    case "Negative":
      return <Frown className="w-5 h-5 text-red-600" />;
    default:
      return <Meh className="w-5 h-5 text-zinc-600" />;
  }
};

export default function Sentiment() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [inputText, setInputText] = useState("");
  const [inputTitle, setInputTitle] = useState("");
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([
    { sentiment: "Positive", count: 0, percentage: 0 },
    { sentiment: "Neutral", count: 0, percentage: 0 },
    { sentiment: "Negative", count: 0, percentage: 0 },
  ]);
  const [trendData, setTrendData] = useState<TrendEntry[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryEntry[]>([]);
  const [recentArticles, setRecentArticles] = useState<ArticleEntry[]>([]);

  const sentimentCache = useRef<Map<number, { sentiment: "Positive" | "Neutral" | "Negative";
    score: number }>>(new Map());
  const MAX_HISTORY_ANALYSIS = 5;
  const MAX_SENTIMENT_CHARS = 2000;

  const stompClient = useRef<any>(null);


  // ✅ React Query for dynamic prediction history
  const { data: predictionHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ['predictionHistory'],
    queryFn: async () => {
      const history = await apiService.getPredictionHistory();
      return history;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // ✅ WebSocket for real-time updates
  useEffect(() => {
    const connectWebSocket = () => {
      const socket = new SockJS('http://localhost:8080/ws');
      const client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        onConnect: () => {
          client.subscribe('/topic/predictions', () => {
            refetchHistory(); // Refresh data when new prediction is made
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

    connectWebSocket();
    return () => disconnectWebSocket();
  }, [refetchHistory]);

  // ✅ Update sentiment data when prediction history changes
  useEffect(() => {
    if (predictionHistory.length > 0) {
      loadSentimentData();
    }
  }, [predictionHistory]);

  const loadSentimentData = async () => {
    setLoading(true);
    try {
      const limited = predictionHistory.slice(0, MAX_HISTORY_ANALYSIS);

      const analyzed = await Promise.all(
        limited.map(async (item) => {
          const cached = sentimentCache.current.get(item.id);
          if (cached) {
            return {
              id: item.id,
              title: item.newsTitle || item.content.slice(0, 50),
              sentiment: cached.sentiment,
              score: cached.score,
              category: "News",
              date: new Date(item.createdAt),
            };
          }

          const result = await apiService.analyzeSentiment(item.content);
          sentimentCache.current.set(item.id, result);

          return {
            id: item.id,
            title: item.newsTitle || item.content.slice(0, 50),
            sentiment: result.sentiment,
            score: result.score,
            category: "News",
            date: new Date(item.createdAt),
          };
        })
      );

      setRecentArticles(analyzed);
      updateAllCharts(analyzed);

    } catch (error) {
      console.error("Failed to load sentiment data:", error);
      toast.error("Failed to load sentiment analysis data");
    } finally {
      setLoading(false);
    }
  };

  const updateAllCharts = (data: any[]) => {
    const positive = data.filter(a => a.sentiment === "Positive").length;
    const neutral = data.filter(a => a.sentiment === "Neutral").length;
    const negative = data.filter(a => a.sentiment === "Negative").length;

    const total = data.length || 1;

    // ✅ sentiment stats
    setSentimentData([
      { sentiment: "Positive", count: positive, percentage: Math.round((positive/total)*100) },
      { sentiment: "Neutral", count: neutral, percentage: Math.round((neutral/total)*100) },
      { sentiment: "Negative", count: negative, percentage: Math.round((negative/total)*100) },
    ]);

    // ✅ trend (REAL)
    const trendMap: any = {};

    data.forEach((item) => {
      const day = item.date.toLocaleDateString("en-US", { weekday: "short" });

      if (!trendMap[day]) {
        trendMap[day] = { date: day, positive: 0, neutral: 0, negative: 0 };
      }

      trendMap[day][item.sentiment.toLowerCase()]++;
    });

    setTrendData(Object.values(trendMap));

    // ✅ category (REAL)
    const categoryMap: any = {};

    data.forEach((item) => {
      const cat = item.category || "Other";

      if (!categoryMap[cat]) {
        categoryMap[cat] = { category: cat, positive: 0, neutral: 0, negative: 0 };
      }

      categoryMap[cat][item.sentiment.toLowerCase()]++;
    });

    setCategoryBreakdown(Object.values(categoryMap));
  };

  const handleAnalyzeText = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) {
      toast.error("Please enter text to analyze");
      return;
    }

    let analysisText = trimmedInput;
    if (trimmedInput.length > MAX_SENTIMENT_CHARS) {
      const truncated = trimmedInput.slice(0, MAX_SENTIMENT_CHARS);
      const lastSpace = truncated.lastIndexOf(" ");
      analysisText = truncated.slice(0, lastSpace > 0 ? lastSpace : MAX_SENTIMENT_CHARS);
      toast.warning(
        "Text exceeded the sentiment model limit and was truncated for analysis."
      );
    }

    setAnalyzing(true);
    try {
      // ✅ Analyze sentiment and category together
      const [sentimentResult, categoryResult] = await Promise.all([
        apiService.analyzeSentiment(analysisText),
        apiService.categorizeNews(analysisText),
      ]);

      if (!sentimentResult || !sentimentResult.sentiment) {
        toast.error("Invalid response from server");
        return;
      }

      const newArticle: any = {
        id: Date.now(),
        title: inputTitle || trimmedInput.slice(0, 50) + "...",
        sentiment: sentimentResult.sentiment,
        score: sentimentResult.score,
        category: categoryResult.category || "General",
        date: new Date(),
      };

      const updated = [newArticle, ...recentArticles];

      setRecentArticles(updated);
      updateAllCharts(updated);

      setInputText("");
      setInputTitle("");

      toast.success("Sentiment analysis complete!");

    } catch (error) {
      toast.error("Failed to analyze sentiment");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-zinc-500">Loading sentiment analysis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-600 to-red-600 mb-4">
          <TrendingUp className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Sentiment Analysis
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Analyze emotional tone and sentiment in news content.
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Analyze New Text</CardTitle>
          <CardDescription>Enter text to analyze its sentiment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Title (Optional)
            </label>
            <Input
              placeholder="Enter article title..."
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Text Content
            </label>
            <Textarea
              placeholder="Enter the text to analyze..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={4}
            />
          </div>
          <Button
            onClick={handleAnalyzeText}
            disabled={analyzing}
            className="w-full"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Analyze Sentiment
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sentimentData.map((data) => (
          <Card key={data.sentiment}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {data.sentiment}
                  </p>
                  <p className="text-2xl font-bold mt-1">{data.count}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
                    {data.percentage}%
                  </p>
                  {getSentimentIcon(data.sentiment)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Breakdown</CardTitle>
            <CardDescription>Overall sentiment breakdown</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sentimentData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-zinc-200 dark:stroke-zinc-800"
                />
                <XAxis dataKey="sentiment" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {sentimentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getSentimentColor(entry.sentiment)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Trend</CardTitle>
            <CardDescription>7-day sentiment analysis trend</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-zinc-200 dark:stroke-zinc-800"
                />
                <XAxis dataKey="date" className="text-xs" />
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
                  dataKey="positive"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Positive"
                />
                <Line
                  type="monotone"
                  dataKey="neutral"
                  stroke="#6b7280"
                  strokeWidth={2}
                  name="Neutral"
                />
                <Line
                  type="monotone"
                  dataKey="negative"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Negative"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment by Category</CardTitle>
          <CardDescription>
            How sentiment varies across news categories
          </CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={categoryBreakdown} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-zinc-200 dark:stroke-zinc-800"
              />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="category" type="category" className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="positive"
                stackId="a"
                fill="#10b981"
                name="Positive"
              />
              <Bar
                dataKey="neutral"
                stackId="a"
                fill="#6b7280"
                name="Neutral"
              />
              <Bar
                dataKey="negative"
                stackId="a"
                fill="#ef4444"
                name="Negative"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Articles */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sentiment Analysis</CardTitle>
          <CardDescription>
            Latest analyzed articles and their sentiment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentArticles.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">
                No articles analyzed yet. Analyze some text to get started!
              </p>
            ) : (
              recentArticles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-start gap-4 p-3 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {article.title}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      {article.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div>
                      <Badge
                        variant="secondary"
                        className={getSentimentBadge(article.sentiment)}
                      >
                        {article.sentiment}
                      </Badge>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold">
                        {article.score > 0 ? "+" : ""}
                        {article.score.toFixed(2)}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Score
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
