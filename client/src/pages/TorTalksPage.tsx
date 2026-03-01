import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronLeft, ChevronRight, ArrowUp } from "lucide-react";
import { blogAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

const TorTalksPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPosts = async (page = 1) => {
    setLoading(true);
    try {
      const data = await blogAPI.list({ sort, tag, search, page });
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch {
      // fail silently
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts(1);
  }, [sort, tag]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPosts(1);
  };

  const handleUpvote = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { upvotes } = await blogAPI.upvote(id);
      setPosts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, upvotes } : p))
      );
    } catch {
      // fail silently
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="relative z-10 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-terminal text-xl text-accent text-glow-red tracking-wider">$ Tor Talks</h1>
          {isAuthenticated && (
            <button
              onClick={() => navigate("/tor-talks/new")}
              className="flex items-center gap-2 px-3 py-1.5 border border-accent/30 rounded-sm bg-accent/10 text-accent hover:bg-accent/20 font-terminal text-xs tracking-wider transition-colors"
            >
              <Plus size={14} /> WRITE
            </button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex">
            <div className="flex-1 flex items-center border border-border rounded-sm bg-card px-3 focus-within:border-accent/30 transition-colors">
              <Search size={14} className="text-muted-foreground/40 mr-2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts..."
                className="flex-1 bg-transparent py-2 text-sm font-mono outline-none placeholder:text-muted-foreground/30"
              />
            </div>
          </form>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-card border border-border rounded-sm px-3 py-2 text-xs font-terminal text-muted-foreground outline-none focus:border-accent/30"
          >
            <option value="newest">Newest</option>
            <option value="trending">Trending</option>
            <option value="upvotes">Top Voted</option>
          </select>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <span className="text-sm text-muted-foreground font-terminal">Loading...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-sm text-muted-foreground font-terminal">No posts yet. Start the conversation.</span>
            </div>
          ) : (
            posts.map((post, i) => (
              <motion.article
                key={post._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="border border-border rounded-sm bg-card/50 p-5 hover:border-accent/30 transition-all cursor-pointer group"
                onClick={() => navigate(`/tor-talks/${post._id}`)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={(e) => handleUpvote(post._id, e)}
                    className="flex items-center gap-1 text-xs font-terminal text-accent/70 hover:text-accent transition-colors"
                  >
                    <ArrowUp size={12} /> {post.upvotes || 0}
                  </button>
                  <h2 className="font-terminal text-sm text-primary text-glow group-hover:text-accent transition-colors">
                    {post.title}
                  </h2>
                </div>
                {post.excerpt && (
                  <p className="text-xs text-muted-foreground font-mono leading-relaxed mb-3 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground/50 font-terminal">
                  <span>by {post.author?.alias}</span>
                  <span>•</span>
                  <span>{formatDate(post.createdAt)}</span>
                  {post.views > 0 && (
                    <>
                      <span>•</span>
                      <span>👁 {post.views}</span>
                    </>
                  )}
                </div>
                {Array.isArray(post.tags) && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.tags.slice(0, 4).map((t: string) => (
                      <span
                        key={t}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTag(t);
                        }}
                        className="text-xs px-1.5 py-0.5 rounded-sm bg-secondary text-secondary-foreground font-terminal hover:bg-accent/10 hover:text-accent cursor-pointer transition-colors"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </motion.article>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => loadPosts(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-sm text-xs font-terminal text-muted-foreground hover:text-accent hover:border-accent/30 transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={14} /> PREV
            </button>
            <span className="text-xs font-terminal text-muted-foreground">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => loadPosts(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-sm text-xs font-terminal text-muted-foreground hover:text-accent hover:border-accent/30 transition-colors disabled:opacity-30"
            >
              NEXT <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TorTalksPage;
