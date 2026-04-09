import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import apiService, { PredictionHistory as PredictionHistoryType } from '../services/apiService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export default function PredictionHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'REAL' | 'FAKE'>('ALL');
  const [stats, setStats] = useState({ total: 0, real: 0, fake: 0, avgConfidence: 0 });

  const stompClient = useRef<any>(null);

  // ✅ React Query for dynamic data
  const { data: predictions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['predictionHistory'],
    queryFn: async () => {
      const preds = await apiService.getPredictionHistory();
      return preds;
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
            refetch(); // Refresh data when new prediction is made
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
  }, [refetch]);

  // ✅ Filtered predictions using useMemo
  const filteredPredictions = useMemo(() => {
    let filtered = [...predictions];

    if (filterType !== 'ALL') {
      filtered = filtered.filter(p => p.result === filterType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.newsTitle?.toLowerCase().includes(query) ||
          p.content?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [predictions, searchQuery, filterType]);

  // ✅ Update stats when data changes
  useEffect(() => {
    if (predictions.length > 0) {
      const total = predictions.length;
      const real = predictions.filter(p => p.result === 'REAL').length;
      const fake = predictions.filter(p => p.result === 'FAKE').length;
      const avgConfidence = total > 0
        ? predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / total
        : 0;

      setStats({ total, real, fake, avgConfidence });
    }
  }, [predictions]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Prediction History</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Your past fact-check analyses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Calendar },
          { label: 'Real', value: stats.real, icon: CheckCircle },
          { label: 'Fake', value: stats.fake, icon: XCircle },
          { label: 'Avg Confidence', value: `${(stats.avgConfidence * 100).toFixed(0)}%`, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-zinc-500" />
                <span className="text-sm text-zinc-500">{label}</span>
              </div>
              <p className="text-2xl font-bold mt-1">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search predictions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {(['ALL', 'REAL', 'FAKE'] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
              filterType === type
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredPredictions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-zinc-500">
              No predictions found.
            </CardContent>
          </Card>
        ) : (
          filteredPredictions.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* ✅ FIX: use newsTitle not headline */}
                    <p className="font-medium truncate">{p.newsTitle}</p>
                    <p className="text-sm text-zinc-500 mt-1">{formatDate(p.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* ✅ FIX: use result not prediction */}
                    <Badge variant={p.result === 'REAL' ? 'default' : 'destructive'}>
                      {p.result === 'REAL' ? (
                        <><TrendingUp className="w-3 h-3 mr-1" />REAL</>
                      ) : (
                        <><TrendingDown className="w-3 h-3 mr-1" />FAKE</>
                      )}
                    </Badge>
                    <span className="text-sm text-zinc-500">
                      {((p.confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
