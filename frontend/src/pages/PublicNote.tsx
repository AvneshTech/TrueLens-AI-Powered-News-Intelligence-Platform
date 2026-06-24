import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Loader2, ShieldAlert, FileX } from "lucide-react";
import apiService, { PublicNoteResponse } from "../services/apiService";

export const PublicNote = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [note, setNote] = useState<PublicNoteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareToken) {
      setError("This share link is missing or malformed.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await apiService.getPublicNote(shareToken);
        if (res.success && res.data) {
          setNote(res.data);
        } else {
          setError(res.message || "This share link is invalid or has been revoked.");
        }
      } catch (err: any) {
        console.error("Failed to load shared note:", err);
        const backendMessage = err?.response?.data?.message;
        setError(backendMessage || "This share link is invalid or has been revoked.");
      } finally {
        setLoading(false);
      }
    })();
  }, [shareToken]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-blue-950 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Branding header — links home, but doesn't require login to view this page */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 mb-4">
            <ShieldAlert className="w-8 h-8 text-white" />
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            TrueLens
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Shared note</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : error || !note ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileX className="w-16 h-16 text-zinc-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Link unavailable</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-sm">
                {error || "This share link is invalid or has been revoked."}
              </p>
              <Button asChild>
                <Link to="/">Go to TrueLens</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl break-words">{note.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                {note.category && <Badge variant="secondary">{note.category}</Badge>}
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {formatDate(note.createdAt)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed whitespace-pre-wrap break-words text-zinc-800 dark:text-zinc-200">
                {note.content}
              </p>

              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  {note.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-8">
          Shared via TrueLens — an AI-powered news verification platform.
        </p>
      </div>
    </div>
  );
};
