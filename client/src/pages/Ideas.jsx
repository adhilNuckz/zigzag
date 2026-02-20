import { useState, useEffect } from 'react';
import { ideaAPI } from '../lib/api';
import useAuthStore from '../stores/authStore';

const CATEGORIES = ['all', 'security', 'privacy', 'tools', 'network', 'crypto', 'social', 'other'];

export default function Ideas() {
  const { isAuthenticated, anonId } = useAuthStore();
  const [ideas, setIdeas] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [sort, setSort] = useState('newest');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cat, setCat] = useState('other');
  const [howBuilt, setHowBuilt] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchIdeas = async (page = 1) => {
    setLoading(true);
    try {
      const params = { sort, page };
      if (category && category !== 'all') params.category = category;
      if (search) params.search = search;
      const data = await ideaAPI.list(params);
      setIdeas(data.ideas);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIdeas(); }, [sort, category]);

  const handleUpvote = async (id) => {
    try {
      const { upvotes } = await ideaAPI.upvote(id);
      setIdeas(prev => prev.map(i => i._id === id ? { ...i, upvotes } : i));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (id) => {
    try {
      const { saved } = await ideaAPI.save(id);
      setIdeas(prev => prev.map(i => {
        if (i._id !== id) return i;
        const savedBy = saved
          ? [...(i.savedBy || []), anonId]
          : (i.savedBy || []).filter(x => x !== anonId);
        return { ...i, savedBy };
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !description) return;
    setCreating(true);
    try {
      await ideaAPI.create({
        title,
        description,
        category: cat,
        howIBuiltThis: howBuilt || undefined,
      });
      setShowCreate(false);
      setTitle(''); setDescription(''); setCat('other'); setHowBuilt('');
      fetchIdeas();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-pixel text-sm text-lime-500">! IDEA BAY</h1>
        {isAuthenticated && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn-ghost text-xs">
            {showCreate ? 'CANCEL' : '+ NEW IDEA'}
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="terminal-card mb-6 animate-slideUp">
          <h3 className="text-xs text-lime-500 font-mono mb-3">{'>'} Share an Idea</h3>
          <div className="space-y-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Idea title" className="input-field" maxLength={200} required />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your idea..." className="input-field h-28 resize-none" maxLength={3000} required />
            <select value={cat} onChange={e => setCat(e.target.value)} className="input-field">
              {CATEGORIES.filter(c => c !== 'all').map(c => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
            <textarea value={howBuilt} onChange={e => setHowBuilt(e.target.value)} placeholder="How I built this (optional)" className="input-field h-20 resize-none" maxLength={5000} />
            <button type="submit" disabled={creating} className="btn-primary text-xs">
              {creating ? 'POSTING...' : 'POST IDEA'}
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); fetchIdeas(); }} className="flex-1 flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ideas..." className="input-field" />
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

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c === 'all' ? '' : c)}
            className={`tag-pill ${(category === c || (!category && c === 'all')) ? 'bg-lime-500/20 border-lime-500/50' : ''}`}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Idea List */}
      {loading ? (
        <div className="text-center py-10"><p className="text-dark-400 text-xs font-mono animate-flicker">Loading...</p></div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-10"><p className="text-dark-400 text-xs font-mono">No ideas yet. Drop one.</p></div>
      ) : (
        <div className="space-y-3">
          {ideas.map(idea => (
            <div key={idea._id} className="terminal-card animate-slideUp">
              <div className="flex items-start gap-4">
                {/* Upvote */}
                <button onClick={() => handleUpvote(idea._id)} className="flex flex-col items-center text-dark-400 hover:text-lime-500 transition-colors flex-shrink-0 pt-1">
                  <span className="text-lg leading-none">▲</span>
                  <span className="text-xs font-mono">{idea.upvotes}</span>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm text-lime-500 font-mono">{idea.title}</h3>
                    <span className="tag-pill text-[10px]">{idea.category}</span>
                  </div>
                  <p className="text-xs text-dark-300 font-mono mb-2 whitespace-pre-wrap line-clamp-4">{idea.description}</p>

                  {idea.howIBuiltThis && (
                    <details className="mb-2">
                      <summary className="text-xs text-lime-500/60 font-mono cursor-pointer hover:text-lime-500 transition-colors">
                        How I built this →
                      </summary>
                      <p className="text-xs text-dark-300 font-mono mt-2 pl-3 border-l border-dark-400 whitespace-pre-wrap">
                        {idea.howIBuiltThis}
                      </p>
                    </details>
                  )}

                  <div className="flex items-center gap-3 text-xs text-dark-500 font-mono">
                    <span>{idea.author?.alias}</span>
                    <span>•</span>
                    <span>{idea.views} views</span>
                    <span>•</span>
                    <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <button
                      onClick={() => handleSave(idea._id)}
                      className={`hover:text-lime-500 transition-colors ${idea.savedBy?.includes(anonId) ? 'text-lime-500' : ''}`}
                    >
                      {idea.savedBy?.includes(anonId) ? '★ Saved' : '☆ Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).slice(0, 10).map(p => (
            <button key={p} onClick={() => fetchIdeas(p)} className={`text-xs font-mono px-2 py-1 ${p === pagination.page ? 'text-lime-500 border border-lime-500/30' : 'text-dark-400 hover:text-lime-500'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
