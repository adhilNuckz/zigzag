import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogAPI } from '../lib/api';
import useAuthStore from '../stores/authStore';

export default function Blog() {
  const { isAuthenticated } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPosts = async (page = 1) => {
    setLoading(true);
    try {
      const params = { sort, page };
      if (search) params.search = search;
      const data = await blogAPI.list(params);
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, [sort]);

  const handleUpvote = async (id) => {
    try {
      const { upvotes } = await blogAPI.upvote(id);
      setPosts(prev => prev.map(p => p._id === id ? { ...p, upvotes } : p));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-pixel text-sm text-lime-500">$ TOR TALKS</h1>
        {isAuthenticated && (
          <Link to="/blog/new" className="btn-ghost text-xs">+ NEW POST</Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); fetchPosts(); }} className="flex-1 flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..." className="input-field" />
          <button type="submit" className="btn-ghost text-xs">SEARCH</button>
        </form>
        <div className="flex gap-2">
          {['newest', 'trending', 'upvotes'].map(s => (
            <button key={s} onClick={() => setSort(s)} className={`text-xs font-mono px-3 py-1 transition-colors ${sort === s ? 'text-lime-500 bg-lime-500/10 border border-lime-500/30' : 'text-dark-300 hover:text-lime-500 border border-transparent'}`}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="text-center py-10">
          <p className="text-dark-400 text-xs font-mono animate-flicker">Loading...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-dark-400 text-xs font-mono">No posts yet. Be the first to write.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post._id} className="terminal-card animate-slideUp">
              <div className="flex items-start gap-4">
                {/* Upvote */}
                <button
                  onClick={() => handleUpvote(post._id)}
                  className="flex flex-col items-center text-dark-400 hover:text-lime-500 transition-colors flex-shrink-0 pt-1"
                >
                  <span className="text-lg leading-none">▲</span>
                  <span className="text-xs font-mono">{post.upvotes}</span>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Link to={`/blog/${post._id}`} className="text-sm text-lime-500 font-mono hover:text-lime-400 transition-colors">
                    {post.title}
                  </Link>
                  <p className="text-xs text-dark-300 font-mono mt-1 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-dark-500 font-mono">
                    <span>{post.author?.alias}</span>
                    <span>•</span>
                    <span>{post.views} views</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    {post.comments?.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{post.comments.length} comments</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.tags?.map(t => <span key={t} className="tag-pill">{t}</span>)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).slice(0, 10).map(p => (
            <button key={p} onClick={() => fetchPosts(p)} className={`text-xs font-mono px-2 py-1 ${p === pagination.page ? 'text-lime-500 border border-lime-500/30' : 'text-dark-400 hover:text-lime-500'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
