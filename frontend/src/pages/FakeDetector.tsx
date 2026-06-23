import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Search,
  Upload,
  Link2,
  FileText,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import apiService, { DetectionResult } from "../services/apiService";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

const ACCEPTED_FILE_TYPES = ".txt,.pdf,.docx,.csv,.json";

export const FakeDetector = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [activeTab, setActiveTab] = useState<"text" | "url" | "file">("text");
  const [headline, setHeadline] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);

  // Derive the text to analyze from the text tab specifically (used only for the
  // "text" tab — url/file are handled by their own branches in handleAnalyze).
  const getTextToAnalyze = (): string => {
    if (content) return content;
    if (headline && headline.split(" ").length > 10) return headline;
    return "";
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setResult(null);

    try {
      let data: DetectionResult;

      if (activeTab === "url") {
        if (!url.trim()) {
          toast.error("Please enter a URL to analyze");
          return;
        }
        data = await apiService.detectFromUrl(url.trim());
      } else if (activeTab === "file") {
        if (!file) {
          toast.error("Please choose a file to analyze");
          return;
        }
        data = await apiService.detectFromFile(file);
      } else {
        const text = getTextToAnalyze();
        if (!text || text.split(" ").length < 30) {
          toast.error("Please enter at least 30 words of content");
          return;
        }
        data = await apiService.detectFakeNews(text);
      }

      setResult(data);
      addNotification(`Analysis complete: ${resultLabel(data.label)}`);
      toast.success("Analysis complete!");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Analysis failed. Is the ML service running?";
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const resultLabel = (label: DetectionResult["label"]) => {
    if (label === "REAL") return "Real";
    if (label === "UNCERTAIN") return "Uncertain";
    return "Fake";
  };

  const handleSave = async () => {
    if (!result) {
      toast.error("No result to save");
      return;
    }

    // FIX H-9: analyses are persisted automatically server-side by /api/detect for
    // the logged-in user. The old explicit savePrediction() POST created a duplicate
    // row per analysis (double-save) and inflated every analytics count, so it has
    // been removed. This handler now just confirms the result is already in history.
    setSaving(true);
    try {
      toast.success("Saved — this analysis is already in your history.");
      addNotification("Prediction saved to history");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
  };

  const confidencePct = result ? Math.round(result.confidence * 100) : 0;
  const isReal = result?.label === "REAL";
  const isUncertain = result?.label === "UNCERTAIN";

  const currentInput = content || (headline && headline.split(" ").filter(Boolean).length > 10 ? headline : "");
  const currentWordCount = currentInput.trim().split(/\s+/).filter(Boolean).length;

  const isInvalidInput =
    activeTab === "text"
      ? !currentInput || currentWordCount < 30
      : activeTab === "url"
        ? !url.trim()
        : !file;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="text-center px-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Fake News Detector</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-2">
          Powered by ML — paste text, a URL, or upload a file
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* INPUT */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">
              Analyze Content
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Paste full article text, link to an article, or upload a document.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "text" | "url" | "file")}>
              <TabsList className="grid grid-cols-3 w-full text-xs sm:text-sm">
                <TabsTrigger value="text" className="gap-1 sm:gap-2">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Text</span>
                </TabsTrigger>
                <TabsTrigger value="url" className="gap-1 sm:gap-2">
                  <Link2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">URL</span>
                </TabsTrigger>
                <TabsTrigger value="file" className="gap-1 sm:gap-2">
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">File</span>
                </TabsTrigger>
              </TabsList>

              {/* TEXT */}
              <TabsContent value="text" className="space-y-3 mt-4">
                <Input
                  placeholder="Headline (optional)..."
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="text-sm"
                />
                <Textarea
                  placeholder="Paste full article content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-32 sm:min-h-40 text-sm"
                />
              </TabsContent>

              {/* URL */}
              <TabsContent value="url" className="space-y-3 mt-4">
                <Input
                  placeholder="https://example.com/news/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-zinc-500">
                  We'll fetch the page and extract the article text automatically.
                </p>
              </TabsContent>

              {/* FILE */}
              <TabsContent value="file" className="space-y-3 mt-4">
                <input
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={handleFileChange}
                  className="text-xs"
                />
                <p className="text-xs text-zinc-500">
                  Supports .txt, .pdf, .docx, .csv, and .json (max 10MB). Text is
                  extracted automatically — no need to copy/paste.
                </p>
                {file && (
                  <p className="text-xs text-green-600">Loaded: {file.name}</p>
                )}
              </TabsContent>

              {/* ANALYZE BUTTON */}
              <Button
                onClick={handleAnalyze}
                disabled={analyzing || isInvalidInput}
                className="w-full mt-4 text-sm sm:text-base"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </Tabs>
          </CardContent>
        </Card>

        {/* RESULT */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Results</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              ML-powered fake news analysis
            </CardDescription>
          </CardHeader>

          <CardContent>
            {analyzing ? (
              <div className="text-center py-8 sm:py-10">
                <Loader2 className="w-8 sm:w-10 h-8 sm:h-10 animate-spin mx-auto" />
                <p className="mt-3 text-sm text-zinc-500">
                  Running ML model...
                </p>
              </div>
            ) : result ? (
              <div className="space-y-4 sm:space-y-5">
                {/* Verdict */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {isReal ? (
                    <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
                  ) : isUncertain ? (
                    <Info className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 flex-shrink-0" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-lg sm:text-xl font-bold">
                      {isReal ? "Real News" : isUncertain ? "Uncertain" : "Fake News"}
                    </p>
                    <p className="text-xs sm:text-sm text-zinc-500 truncate">
                      ML confidence: {confidencePct}%
                      {result.extractedWordCount
                        ? ` · ${result.extractedWordCount} words analyzed`
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Badge */}
                <Badge
                  variant={isReal ? "default" : isUncertain ? "secondary" : "destructive"}
                  className="text-xs sm:text-sm"
                >
                  {isReal ? "VERIFIED REAL" : isUncertain ? "UNCERTAIN" : "LIKELY FAKE"}
                </Badge>

                {/* Domain / explanation context (URL analysis only) */}
                {result.explanation && (
                  <div
                    className={`flex gap-2 rounded-lg p-3 text-xs sm:text-sm ${
                      result.domainHint === "low_credibility"
                        ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    }`}
                  >
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{result.explanation}</span>
                  </div>
                )}

                {/* Confidence Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Confidence</span>
                    <span>{confidencePct}%</span>
                  </div>
                  <Progress value={confidencePct} />
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full text-sm sm:text-base"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save to History"
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-10 text-zinc-400">
                <Search className="w-8 sm:w-10 h-8 sm:h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Enter text, a URL, or upload a file, then click Analyze</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
