import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  MessageSquare,
  Menu,
} from "lucide-react";
import { toast } from "sonner";
import apiService, {
  ConversationItem,
  ChatMessageItem,
} from "../services/apiService";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestedPrompts = [
  "Is this news article real or fake?",
  "Explain why this article seems suspicious",
  "What are common signs of fake news?",
  "Analyze the credibility of this source",
];

const WELCOME_MESSAGE: DisplayMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I'm your AI News Intelligence Assistant. I can help you verify news, detect fake information, and answer questions about media literacy. How can I help you today?",
};

export const ChatAssistant = () => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ConversationItem | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingIdRef = useRef<string | null>(null);

  // ─── Load conversation list on mount ────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.getConversations();
        if (res.success) {
          setConversations(res.data);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
        toast.error("Failed to load your chat history");
      } finally {
        setLoadingConversations(false);
      }
    })();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ─── Switch conversations ───────────────────────────────────────────────
  const openConversation = useCallback(async (conversationId: string) => {
    setActiveConversationId(conversationId);
    setSidebarOpen(false);
    setLoadingMessages(true);
    try {
      const res = await apiService.getConversationMessages(conversationId);
      if (res.success) {
        const loaded: DisplayMessage[] = res.data.map((m: ChatMessageItem) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }));
        setMessages(loaded.length > 0 ? loaded : [WELCOME_MESSAGE]);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast.error("Failed to load this conversation");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    setSidebarOpen(false);
  };

  // ─── Send + stream a message ────────────────────────────────────────────
  const handleSendMessage = async () => {
    const content = input.trim();
    if (!content || isStreaming) return;

    const userMessage: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };
    const assistantId = `assistant-${Date.now()}`;
    streamingIdRef.current = assistantId;

    setMessages((prev) => [
      ...(prev[0]?.id === "welcome" ? [] : prev),
      userMessage,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setIsStreaming(true);

    let conversationCreated: string | null = null;

    try {
      await apiService.streamChatMessage(
        content,
        activeConversationId,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m,
            ),
          );
        },
        (newConversationId) => {
          conversationCreated = newConversationId;
        },
      );

      if (conversationCreated) {
        setActiveConversationId(conversationCreated);
        // Refresh the sidebar so the new thread (with its auto-generated title) appears.
        const res = await apiService.getConversations();
        if (res.success) setConversations(res.data);
      } else if (activeConversationId) {
        // Existing conversation's title doesn't change, but bump it to the top.
        setConversations((prev) => {
          const updated = prev.find((c) => c.id === activeConversationId);
          if (!updated) return prev;
          return [updated, ...prev.filter((c) => c.id !== activeConversationId)];
        });
      }
    } catch (error) {
      console.error("Chat stream error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Error connecting to AI backend. Please check your connection and try again.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && m.content === "" ? { ...m, content: message } : m,
        ),
      );
      toast.error("The AI assistant ran into a problem");
    } finally {
      setIsStreaming(false);
      streamingIdRef.current = null;
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ─── Rename / delete ─────────────────────────────────────────────────────
  const startRename = (conversation: ConversationItem) => {
    setRenamingId(conversation.id);
    setRenameValue(conversation.title);
  };

  const confirmRename = async () => {
    if (!renamingId) return;
    const title = renameValue.trim();
    if (!title) {
      toast.error("Title cannot be blank");
      return;
    }
    try {
      const res = await apiService.renameConversation(renamingId, title);
      if (res.success) {
        setConversations((prev) =>
          prev.map((c) => (c.id === renamingId ? { ...c, title } : c)),
        );
      }
    } catch (error) {
      console.error("Failed to rename conversation:", error);
      toast.error("Failed to rename conversation");
    } finally {
      setRenamingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiService.deleteConversation(deleteTarget.id);
      setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      if (activeConversationId === deleteTarget.id) {
        startNewChat();
      }
      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      toast.error("Failed to delete conversation");
    } finally {
      setDeleteTarget(null);
    }
  };

  // ─── Sidebar (shared between desktop rail and mobile drawer) ────────────
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <Button onClick={startNewChat} className="w-full justify-start gap-2" variant="outline">
          <Plus className="w-4 h-4" />
          New chat
        </Button>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-2">
          {loadingConversations ? (
            <p className="text-xs text-zinc-500 px-2 py-4">Loading conversations…</p>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-zinc-500 px-2 py-4">
              Your conversations will show up here.
            </p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center gap-1 rounded-lg px-2 py-2 cursor-pointer transition-colors ${
                  activeConversationId === c.id
                    ? "bg-purple-100 dark:bg-purple-950/50"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
                onClick={() => renamingId !== c.id && openConversation(c.id)}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0 text-zinc-500" />
                {renamingId === c.id ? (
                  <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmRename();
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="flex-1 min-w-0 bg-transparent border-b border-purple-400 text-sm outline-none"
                    />
                    <button onClick={confirmRename} className="text-green-600 flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setRenamingId(null)} className="text-zinc-400 flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 truncate text-sm">{c.title}</span>
                    <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(c);
                        }}
                        className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(c);
                        }}
                        className="p-1 text-zinc-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 mb-4">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">AI Chat Assistant</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Ask questions about news verification and media literacy
        </p>
      </div>

      <div className="flex gap-4 h-[650px]">
        {/* Desktop sidebar */}
        <Card className="hidden md:flex md:flex-col w-64 flex-shrink-0 overflow-hidden">
          {sidebarContent}
        </Card>

        {/* Mobile sidebar drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSidebarOpen(false)}
            />
            <Card className="absolute left-0 top-0 bottom-0 w-72 rounded-none flex flex-col overflow-hidden">
              {sidebarContent}
            </Card>
          </div>
        )}

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-8 w-8 -ml-2"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-4 h-4" />
                </Button>
                <Sparkles className="w-5 h-5 text-purple-600" />
                Chat Assistant
              </CardTitle>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
              >
                Online
              </Badge>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full text-sm text-zinc-500">
                Loading conversation…
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      {message.content ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      ) : (
                        <div className="flex gap-1 py-1">
                          <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>

          {/* Input Area */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
            {messages.length === 1 && messages[0].id === "welcome" && (
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePromptClick(prompt)}
                    className="text-xs"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="resize-none"
                disabled={isStreaming}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isStreaming}
                size="icon"
                className="h-10 w-10 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" and all its messages will be permanently deleted. This
              can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
