import { useState, useEffect } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "../components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Plus, Trash2, Edit, Search, Loader2, FileText,
  MoreVertical, Download,
} from "lucide-react";
import { toast } from "sonner";
import { apiService, NoteResponse } from "../services/apiService";
import { useAuth } from "../context/AuthContext";

export const Notes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<NoteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState<NoteResponse | null>(null);
  const [formData, setFormData] = useState({
    title: "", content: "", category: "", tags: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadNotes();
  }, [user]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotes();
      if (response.success && response.data) {
        setNotes(response.data);
      }
    } catch (error) {
      console.error("Failed to load notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!formData.title || !formData.content || !user) {
      toast.error("Please fill in title and content");
      return;
    }
    setSaving(true);
    try {
      const response = await apiService.createNote({
        title: formData.title,
        content: formData.content,
        category: formData.category || undefined,
        // ✅ FIX: backend stores tags as a String — send comma-separated string directly
        tags: formData.tags || undefined,
      });
      if (response.success && response.data) {
        setNotes((prev) => [response.data!, ...prev]);
        setIsCreateOpen(false);
        setFormData({ title: "", content: "", category: "", tags: "" });
        toast.success("Note created successfully!");
      }
    } catch (error) {
      console.error("Failed to create note:", error);
      toast.error("Failed to create note");
    } finally {
      setSaving(false);
    }
  };

  const handleEditNote = async () => {
    if (!currentNote || !formData.title || !formData.content) {
      toast.error("Please fill in title and content");
      return;
    }
    setSaving(true);
    try {
      const response = await apiService.updateNote(String(currentNote.id), {
        title: formData.title,
        content: formData.content,
        category: formData.category || undefined,
        // ✅ FIX: send as string
        tags: formData.tags || undefined,
      });
      if (response.success && response.data) {
        setNotes((prev) =>
          prev.map((n) => (n.id === currentNote.id ? response.data! : n))
        );
        setIsEditOpen(false);
        setCurrentNote(null);
        setFormData({ title: "", content: "", category: "", tags: "" });
        toast.success("Note updated!");
      }
    } catch (error) {
      console.error("Failed to update note:", error);
      toast.error("Failed to update note");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      const response = await apiService.deleteNote(String(id));
      if (response.success) {
        setNotes((prev) => prev.filter((note) => note.id !== id));
        toast.success("Note deleted");
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error("Failed to delete note");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) { loadNotes(); return; }
    try {
      // ✅ FIX: searchNotes takes keyword string directly
      const response = await apiService.searchNotes(searchQuery);
      if (response.success) {
        setNotes(response.data);
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Search failed");
    }
  };

  const openEditDialog = (note: NoteResponse) => {
    setCurrentNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      category: note.category || "",
      // ✅ FIX: tags is a String from backend — use directly
      tags: note.tags || "",
    });
    setIsEditOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const downloadAsTxt = (note: NoteResponse) => {
    const text = `${note.title}\n\n${note.content}\n\nCreated: ${formatDate(note.createdAt)}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            {notes.length} note{notes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} variant="outline">Search</Button>
        {searchQuery && (
          <Button variant="ghost" onClick={() => { setSearchQuery(""); loadNotes(); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-16 h-16 text-zinc-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No notes found</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              {searchQuery ? "Try a different search term" : "Get started by creating your first note"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />Create First Note
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <Card key={note.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <CardTitle className="text-lg mb-2 break-words">{note.title}</CardTitle>
                    {note.category && (
                      <Badge variant="secondary" className="mb-2">{note.category}</Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => downloadAsTxt(note)}>
                        <Download className="mr-2 h-4 w-4" />Download TXT
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-4 line-clamp-4 flex-1 break-words">
                  {note.content}
                </p>

                {/* ✅ FIX: tags is a String — split on comma for display */}
                {note.tags && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {note.tags.split(",").filter(t => t.trim()).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{tag.trim()}</Badge>
                    ))}
                  </div>
                )}

                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                  Created: {formatDate(note.createdAt)}
                </div>

                <div className="flex gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(note)}>
                    <Edit className="w-4 h-4 mr-1" />Edit
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Note</DialogTitle>
            <DialogDescription>Add a new note to your collection</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Note title..." />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., Work, Personal..." />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="java,spring,todo (comma-separated)" />
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={8} className="resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setFormData({ title: "", content: "", category: "", tags: "" }); }}>Cancel</Button>
            <Button onClick={handleCreateNote} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <><Plus className="w-4 h-4 mr-2" />Create Note</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>Make changes to your note</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="java,spring,todo" />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={10} className="resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); setCurrentNote(null); setFormData({ title: "", content: "", category: "", tags: "" }); }}>Cancel</Button>
            <Button onClick={handleEditNote} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
