import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resourceAPI } from '../lib/api';
import useAuthStore from '../stores/authStore';

export default function Resources() {
  const { isAuthenticated } = useAuthStore();
  const [resources, setResources] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchResources = async (page = 1) => {
    setLoading(true);
    try {
      const params = { sort, page };
      if (search) params.search = search;
      if (tag) params.tag = tag;
      const data = await resourceAPI.list(params);
      setResources(data.resources);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResources(); }, [sort, tag]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchResources();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !description) return;
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (url) formData.append('url', url);
      if (tags) formData.append('tags', tags);
      if (file) formData.append('file', file);
      await resourceAPI.create(formData);
      setShowCreate(false);
      setTitle(''); setDescription(''); setUrl(''); setTags(''); setFile(null);
      fetchResources();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-pixel text-sm text-lime-500"># RESOURCES</h1>
        {isAuthenticated && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn-ghost text-xs">
            {showCreate ? 'CANCEL' : '+ NEW RESOURCE'}
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="terminal-card mb-6 animate-slideUp">
          <h3 className="text-xs text-lime-500 font-mono mb-3">{'>'} Share a Resource</h3>
          <div className="space-y-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="input-field" maxLength={200} required />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="input-field h-24 resize-none" maxLength={2000} required />
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL (optional)" className="input-field" />
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma separated)" className="input-field" />
            <div className="flex items-center gap-3">
              <input type="file" onChange={e => setFile(e.target.files[0])} className="text-xs text-dark-300 font-mono file:btn-ghost file:mr-3 file:border-0" />
              <button type="submit" disabled={creating} className="btn-primary text-xs">
                {creating ? 'POSTING...' : 'POST'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input-field" />
          <button type="submit" className="btn-ghost text-xs">SEARCH</button>
        </form>
        <div className="flex gap-2">
          {['newest', 'trending', 'views'].map(s => (
            <button key={s} onClick={() => setSort(s)} className={`text-xs font-mono px-3 py-1 transition-colors ${sort === s ? 'text-lime-500 bg-lime-500/10 border border-lime-500/30' : 'text-dark-300 hover:text-lime-500 border border-transparent'}`}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Resource List */}
      {loading ? (
        <div className="text-center py-10">
          <p className="text-dark-400 text-xs font-mono animate-flicker">Loading...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-dark-400 text-xs font-mono">No resources found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map(r => (
            <Link key={r._id} to={`/resources/${r._id}`} className="terminal-card block animate-slideUp">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm text-lime-500 font-mono truncate">{r.title}</h3>
                  <p className="text-xs text-dark-300 font-mono mt-1 line-clamp-2">{r.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.tags?.map(t => (
                      <span key={t} className="tag-pill" onClick={(e) => { e.preventDefault(); setTag(t); }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-dark-400 font-mono">{r.views} views</p>
                  <p className="text-xs text-dark-500 font-mono">{r.author?.alias}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).slice(0, 10).map(p => (
            <button key={p} onClick={() => fetchResources(p)} className={`text-xs font-mono px-2 py-1 ${p === pagination.page ? 'text-lime-500 border border-lime-500/30' : 'text-dark-400 hover:text-lime-500'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
