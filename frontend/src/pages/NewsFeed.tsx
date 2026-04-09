import { useState, useEffect } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Search, Loader2, ExternalLink, Filter } from "lucide-react";
import { toast } from "sonner";
import apiService, { NewsArticle } from "../services/apiService";

const categories = ["All", "Technology", "Politics", "Health", "Business"];

export const NewsFeed = () => {
  // ✅ Date formatter
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest");

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // ✅ Load on category change
  useEffect(() => {
    loadNews(0);
  }, [selectedCategory]);

  const loadNews = async (pageNumber = 0) => {
    try {
      setLoading(true);

      const res = await apiService.getNews({
        category: selectedCategory !== "All" ? selectedCategory : undefined,
        search: searchQuery || undefined,
        page: pageNumber,
        size: 10,
      });

      const data = res.data || [];

      setArticles(data);
      setPage(pageNumber);

      // ✅ pagination logic
      setHasMore(data.length === 10);
    } catch (error) {
      console.error("Failed to load news:", error);
      toast.error("Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Search
  const handleSearch = () => {
    loadNews(0);
  };

  // ✅ Sorting
  const processedArticles = [...articles].sort((a, b) => {
    if (sortBy === "latest") {
      return (
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    }
    if (sortBy === "oldest") {
      return (
        new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      );
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="px-2">
        <h1 className="text-2xl sm:text-3xl font-bold">News Feed</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">Latest headlines from India</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:gap-4 px-2">
        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />

            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(); // ✅ search on Enter
                }
              }}
              className="pl-10 text-sm"
            />
          </div>
          <Button onClick={handleSearch} className="text-xs sm:text-sm px-2 sm:px-4">Search</Button>
        </div>

        {/* Category & Sort Row */}
        <div className="flex gap-3 sm:gap-4">
          {/* Category */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="flex-1 text-xs sm:text-sm">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-xs sm:text-sm">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1 text-xs sm:text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button onClick={() => loadNews(0)} variant="outline" size="sm" className="text-xs sm:text-sm">
            Refresh
          </Button>
          <Button onClick={() => loadNews(page - 1)} disabled={page === 0} size="sm" className="text-xs sm:text-sm">
            Previous
          </Button>
          <Button onClick={() => loadNews(page + 1)} disabled={!hasMore} size="sm" className="text-xs sm:text-sm">
            Next
          </Button>
        </div>
      </div>

      {/* Count */}
      <div className="text-xs sm:text-sm text-zinc-500 px-2">
        Showing {processedArticles.length} articles
      </div>

      {/* Articles */}
      {processedArticles.length === 0 ? (
        <Card className="mx-2">
          <CardContent className="py-12 text-center text-zinc-500 text-sm">
            No articles found.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 px-2">
            {processedArticles.map((article, i) => (
              <Card key={i} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                {/* ✅ FIXED IMAGE */}
                <img
                  src={article.imageUrl || "/fallback-news.jpg"}
                  alt={article.title}
                  className="w-full h-32 sm:h-40 object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "/fallback-news.jpg";
                  }}
                />

                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-sm sm:text-base line-clamp-2">{article.title}</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col gap-2 sm:gap-3 flex-1">
                  <p className="text-xs sm:text-sm text-zinc-500 line-clamp-2 sm:line-clamp-3">
                    {article.description || "No description available"}
                  </p>

                  <div className="mt-auto flex justify-between items-center gap-2">
                    <span className="text-xs text-zinc-400 line-clamp-1">
                      {formatDateTime(article.publishedAt)}
                    </span>

                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-xs sm:text-sm flex items-center gap-1 flex-shrink-0"
                    >
                      Read <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ✅ No more articles message */}
          {!hasMore && (
            <p className="text-center text-xs sm:text-sm text-zinc-500 mt-4">No more articles</p>
          )}
        </>
      )}
    </div>
  );
};
