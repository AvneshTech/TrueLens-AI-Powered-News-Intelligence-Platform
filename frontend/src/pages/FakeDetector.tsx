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
} from "lucide-react";
import { toast } from "sonner";
import apiService from "../services/apiService";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

// ML service response shape (matches backend PredictionResponse)
interface DetectionResult {
  label: "REAL" | "FAKE";
  confidence: number;
}

export const FakeDetector = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [headline, setHeadline] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);

  // Derive the text to analyze from whichever tab has input
  const getTextToAnalyze = (): string => {
    if (content) return content;

    if (headline && headline.split(" ").length > 10) return headline;

    if (url) {
      toast.error("URL analysis not supported. Please paste full content.");
      return "";
    }

    return "";
  };

  const handleAnalyze = async () => {
    const text = getTextToAnalyze();

    if (!text || text.split(" ").length < 30) {
      toast.error("Please enter at least 30 words of content");
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const data = await apiService.detectFakeNews(text);

      const fixedResult: DetectionResult = {
        label: data.label === "REAL" ? "REAL" : "FAKE",
        confidence: data.confidence,
      };

      setResult(fixedResult);

      addNotification(`Analysis complete: ${fixedResult.label === "REAL" ? "Real" : "Fake"}`);
      toast.success("Analysis complete!");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Analysis failed. Is the ML service running?";
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!result) {
      toast.error("No result to save");
      return;
    }

    setSaving(true);
    try {
      await apiService.savePrediction({
        newsTitle: headline || "Untitled",
        content: getTextToAnalyze(),
        result: result.label,
        confidence: result.confidence,
        category: "Custom", // For now, can be enhanced later
      });
      toast.success("Prediction saved!");
      addNotification("Prediction saved to history");
    } catch (err: any) {
      toast.error("Failed to save prediction");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);

    if (selected.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = () => {
        setContent(reader.result as string);
      };
      reader.readAsText(selected);
    } else {
      toast.info("Only .txt files are auto-read. PDF/image OCR coming soon.");
    }
  };

  const confidencePct = result ? Math.round(result.confidence * 100) : 0;
  const isReal = result?.label === "REAL";

  const currentInput = content || (headline && headline.split(" ").filter(Boolean).length > 10 ? headline : "");
  const currentWordCount = currentInput.trim().split(/\s+/).filter(Boolean).length;
  const isInvalidInput = !currentInput || currentWordCount < 30;

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
              Paste full article text or upload a document. URL input is not supported.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="text">
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
                  placeholder="Paste article URL..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-zinc-500">
                  URL analysis not supported yet. Please paste full article content instead.
                </p>
              </TabsContent>

              {/* FILE */}
              <TabsContent value="file" className="space-y-3 mt-4">
                <input
                  type="file"
                  accept=".txt,.pdf,.jpg,.png"
                  onChange={handleFileChange}
                  className="text-xs"
                />
                <p className="text-xs text-zinc-500">
                  .txt files are read automatically. PDF/image support coming
                  soon.
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
                  ) : (
                    <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-lg sm:text-xl font-bold">
                      {isReal ? "Real News" : "Fake News"}
                    </p>
                    <p className="text-xs sm:text-sm text-zinc-500 truncate">
                      ML confidence: {confidencePct}%
                    </p>
                  </div>
                </div>

                {/* Badge */}
                <Badge
                  variant={isReal ? "default" : "destructive"}
                  className="text-xs sm:text-sm"
                >
                  {isReal ? "VERIFIED REAL" : "LIKELY FAKE"}
                </Badge>

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
                <p className="text-sm">Enter text and click Analyze</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
