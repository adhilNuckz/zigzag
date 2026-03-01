import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  Heart,
  ArrowUp,
  Plus,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
} from "lucide-react";
import { ideaAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

const CATEGORIES = ["all", "tool", "platform", "protocol", "concept", "service", "other"];

const IdeasPage = () => {
  const { isAuthenticated, anonId } = useAuthStore();
  const [ideas, setIdeas] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Create form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("other");
  const [newHow, setNewHow] = useState("");
  const [creating, setCreating] = useState(false);

  const loadIdeas = async (page = 1) => {
    setLoading(true);
    try {
      const data = await ideaAPI.list({ sort, category: category || undefined, search, page });
      setIdeas(data.ideas);
      setPagination(data.pagination);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadIdeas(1);
  }, [sort, category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadIdeas(1);
  };

  const handleUpvote = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { upvotes } = await ideaAPI.upvote(id);
      setIdeas((prev) => prev.map((i) => (i._id === id ? { ...i, upvotes } : i)));
    } catch {}
  };

  const handleSave = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { saved } = await ideaAPI.save(id);
      setIdeas((prev) =>
        prev.map((i) => {
          if (i._id !== id) return i;
          const savedBy = i.savedBy || [];
          return {
            ...i,
            savedBy: saved
              ? [...savedBy, anonId]
              : savedBy.filter((s: string) => s !== anonId),
          };
        })
      );
    } catch {}
  };

  const handleReport = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ideaAPI.report(id);
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;
    setCreating(true);
    try {
      await ideaAPI.create({
        title: newTitle,
        description: newDesc,
        category: newCategory,
        howIBuiltThis: newHow || undefined,
      });
      setShowCreate(false);
      setNewTitle("");
      setNewDesc("");
      setNewCategory("other");
      setNewHow("");
      loadIdeas(1);
    } catch (err: any) {
      alert(err.message);
    }
    setCreating(false);
  };

  const isSaved = (idea: any) => {
    return Array.isArray(idea.savedBy) && idea.savedBy.includes(anonId);
  };

  return (
    <div className="relative z-10 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-terminal text-xl text-primary text-glow tracking-wider">! Idea Bay</h1>
          {isAuthenticated && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2 px-3 py-1.5 border border-primary/30 rounded-sm bg-primary/10 text-primary hover:bg-primary/20 font-terminal text-xs tracking-wider transition-colors"
            >
              <Plus size={14} /> NEW IDEA
            </button>
          )}
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-primary/20 rounded-sm bg-card/50 p-5 mb-6 space-y-3 overflow-hidden"
              onSubmit={handleCreate}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-terminal text-sm text-primary text-glow">$ new idea</span>
                <button type="button" onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-primary">
                  <X size={16} />
                </button>
              </div>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Idea title *"
                className="w-full bg-secondary/50 border border-border rounded-sm px-3 py-2 text-sm text-secondary-foreground font-mono outline-none focus:border-primary/50 placeholder:text-muted-foreground/30"
                required
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description — what's the idea? *"
                rows={4}
                className="w-full bg-secondary/50 border border-border rounded-sm px-3 py-2 text-sm text-secondary-foreground font-mono outline-none focus:border-primary/50 placeholder:text-muted-foreground/30 resize-none"
                required
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-sm px-3 py-2 text-sm font-terminal text-muted-foreground outline-none focus:border-primary/50"
              >
                {CATEGORIES.filter((c) => c !== "all").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <textarea
                value={newHow}
                onChange={(e) => setNewHow(e.target.value)}
                placeholder="How I built this (optional — technical details, stack, challenges)"
                rows={3}
                className="w-full bg-secondary/50 border border-border rounded-sm px-3 py-2 text-sm text-secondary-foreground font-mono outline-none focus:border-primary/50 placeholder:text-muted-foreground/30 resize-none"
              />
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 border border-primary/30 rounded-sm bg-primary/10 text-primary hover:bg-primary/20 font-terminal text-xs tracking-wider transition-colors disabled:opacity-50"
              >
                {creating ? "SUBMITTING..." : "SUBMIT"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex">
            <div className="flex-1 flex items-center border border-border rounded-sm bg-card px-3 focus-within:border-primary/50 transition-colors">
              <Search size={14} className="text-muted-foreground/40 mr-2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ideas..."
                className="flex-1 bg-transparent py-2 text-sm font-mono outline-none placeholder:text-muted-foreground/30"
              />
            </div>
          </form>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-card border border-border rounded-sm px-3 py-2 text-xs font-terminal text-muted-foreground outline-none focus:border-primary/50"
          >
            <option value="newest">Newest</option>
            <option value="trending">Trending</option>
            <option value="upvotes">Top Voted</option>
          </select>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c === "all" ? "" : c)}
              className={`px-2 py-1 text-xs font-terminal rounded-sm transition-colors ${
                (c === "all" && !category) || c === category
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-primary hover:bg-secondary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Ideas Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <span className="text-sm text-muted-foreground font-terminal">Loading...</span>
            </div>
          ) : ideas.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <span className="text-sm text-muted-foreground font-terminal">No ideas yet. Share yours!</span>
            </div>
          ) : (
            ideas.map((idea, i) => (
              <motion.div
                key={idea._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="border border-border rounded-sm bg-card/50 p-4 hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => setExpanded(expanded === idea._id ? null : idea._id)}
              >
                <div className="flex items-start gap-3">
                  <Lightbulb size={14} className="text-primary/50 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-terminal text-sm text-primary/90 text-glow mb-1">
                      {idea.title}
                    </h3>
                    <p className={`text-xs text-muted-foreground font-mono mb-2 ${expanded === idea._id ? "" : "line-clamp-2"}`}>
                      {idea.description}
                    </p>

                    {expanded === idea._id && idea.howIBuiltThis && (
                      <div className="border-t border-border pt-2 mt-2 mb-2">
                        <span className="text-xs font-terminal text-primary/60 block mb-1">
                          // How I Built This
                        </span>
                        <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                          {idea.howIBuiltThis}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground/50 font-terminal">
                      <div className="flex items-center gap-3">
                        <span>{idea.author?.alias}</span>
                        {idea.category && (
                          <span className="px-1.5 py-0.5 bg-secondary rounded-sm text-secondary-foreground">
                            {idea.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleUpvote(idea._id, e)}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <ArrowUp size={10} /> {idea.upvotes || 0}
                        </button>
                        <button
                          onClick={(e) => handleSave(idea._id, e)}
                          className={`flex items-center gap-1 transition-colors ${
                            isSaved(idea) ? "text-accent" : "hover:text-accent"
                          }`}
                        >
                          <Heart size={10} fill={isSaved(idea) ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={(e) => handleReport(idea._id, e)}
                          className="hover:text-accent transition-colors"
                          title="Report"
                        >
                          <Flag size={10} />
                        </button>
                        {idea.views > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye size={10} /> {idea.views}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => loadIdeas(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-sm text-xs font-terminal text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={14} /> PREV
            </button>
            <span className="text-xs font-terminal text-muted-foreground">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => loadIdeas(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-sm text-xs font-terminal text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-30"
            >
              NEXT <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeasPage;
