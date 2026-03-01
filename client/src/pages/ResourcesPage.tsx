import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Search, Plus, Upload, X, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resourceAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

const ResourcesPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [resources, setResources] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  const loadResources = async (page = 1) => {
    setLoading(true);
    try {
      const data = await resourceAPI.list({ sort, tag, search, page });
      setResources(data.resources);
      setPagination(data.pagination);
    } catch {
      // silently fail
    }
    setLoading(false);
  };

  useEffect(() => {
    loadResources(1);
  }, [sort, tag]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadResources(1);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("title", newTitle);
      fd.append("description", newDesc);
      if (newUrl) fd.append("url", newUrl);
      if (newTags) fd.append("tags", newTags);
      if (newFile) fd.append("file", newFile);

      await resourceAPI.create(fd);
      setShowCreate(false);
      setNewTitle("");
      setNewDesc("");
      setNewUrl("");
      setNewTags("");
      setNewFile(null);
      loadResources(1);
    } catch (err: any) {
      alert(err.message);
    }
    setCreating(false);
  };

  return (
    <div className="relative z-10 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-terminal text-xl text-primary text-glow tracking-wider"># Resources</h1>
          {isAuthenticated && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2 px-3 py-1.5 border border-primary/30 rounded-sm bg-primary/10 text-primary hover:bg-primary/20 font-terminal text-xs tracking-wider transition-colors"
            >
              <Plus size={14} /> SHARE
            </button>
          )}
        </div>

        {/* Create Form */}
        {showCreate && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="border border-primary/20 rounded-sm bg-card/50 p-5 mb-6 space-y-3"
            onSubmit={handleCreate}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-terminal text-sm text-primary text-glow">$ new resource</span>
              <button type="button" onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-primary">
                <X size={16} />
              </button>
            </div>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title *"
              className="w-full bg-secondary/50 border border-border rounded-sm px-3 py-2 text-sm text-secondary-foreground font-mono outline-none focus:border-primary/50 placeholder:text-muted-foreground/30"
              required
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description *"
              rows={3}
              className="w-full bg-secondary/50 border border-border rounded-sm px-3 py-2 text-sm text-secondary-foreground font-mono outline-none focus:border-primary/50 placeholder:text-muted-foreground/30 resize-none"
              required
            />
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="URL (optional)"
              className="w-full bg-secondary/50 border border-border rounded-sm px-3 py-2 text-sm text-secondary-foreground font-mono outline-none focus:border-primary/50 placeholder:text-muted-foreground/30"
            />
            <input
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="Tags (comma separated)"
              className="w-full bg-secondary/50 border border-border rounded-sm px-3 py-2 text-sm text-secondary-foreground font-mono outline-none focus:border-primary/50 placeholder:text-muted-foreground/30"
            />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 border border-border rounded-sm cursor-pointer hover:border-primary/30 transition-colors">
                <Upload size={14} className="text-muted-foreground" />
                <span className="text-xs font-terminal text-muted-foreground">
                  {newFile ? newFile.name : "Attach file"}
                </span>
                <input type="file" className="hidden" onChange={(e) => setNewFile(e.target.files?.[0] || null)} />
              </label>
              {newFile && (
                <button type="button" onClick={() => setNewFile(null)} className="text-accent text-xs font-terminal">
                  Remove
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 border border-primary/30 rounded-sm bg-primary/10 text-primary hover:bg-primary/20 font-terminal text-xs tracking-wider transition-colors disabled:opacity-50"
            >
              {creating ? "UPLOADING..." : "SUBMIT"}
            </button>
          </motion.form>
        )}

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex">
            <div className="flex-1 flex items-center border border-border rounded-sm bg-card px-3 focus-within:border-primary/50 transition-colors">
              <Search size={14} className="text-muted-foreground/40 mr-2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resources..."
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
            <option value="views">Most Viewed</option>
          </select>
          {tag && (
            <button
              onClick={() => setTag("")}
              className="flex items-center gap-1 px-2 py-1 border border-accent/30 rounded-sm bg-accent/10 text-accent text-xs font-terminal"
            >
              <Tag size={10} /> {tag} <X size={10} />
            </button>
          )}
        </div>

        {/* Resource List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <span className="text-sm text-muted-foreground font-terminal">Loading...</span>
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-sm text-muted-foreground font-terminal">No resources found.</span>
            </div>
          ) : (
            resources.map((r, i) => (
              <motion.div
                key={r._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border border-border rounded-sm bg-card/50 p-4 hover:border-primary/30 transition-all group cursor-pointer"
                onClick={() => navigate(`/resources/${r._id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-terminal text-sm text-primary text-glow truncate">
                        {r.title}
                      </h3>
                      <ArrowUpRight
                        size={12}
                        className="text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground font-mono line-clamp-2">
                      {r.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/50 font-terminal">
                      <span>by {r.author?.alias}</span>
                      <span>•</span>
                      <span>👁 {r.views}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                    {Array.isArray(r.tags) &&
                      r.tags.slice(0, 2).map((t: string) => (
                        <span
                          key={t}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTag(t);
                          }}
                          className="text-xs px-2 py-0.5 rounded-sm bg-secondary text-secondary-foreground font-terminal cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          {t}
                        </span>
                      ))}
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
              onClick={() => loadResources(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-sm text-xs font-terminal text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={14} /> PREV
            </button>
            <span className="text-xs font-terminal text-muted-foreground">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => loadResources(pagination.page + 1)}
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

export default ResourcesPage;
