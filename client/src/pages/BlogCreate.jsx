import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogAPI } from '../lib/api';
import useAuthStore from '../stores/authStore';

export default function BlogCreate() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(false);

  if (!isAuthenticated) {
    return <div className="text-center py-10"><p className="text-dark-400 text-xs font-mono">Session required.</p></div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) return;
    setSubmitting(true);
    try {
      const post = await blogAPI.create({ title, content, tags });
      navigate(`/blog/${post._id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto">
      <h1 className="font-pixel text-sm text-lime-500 mb-6">$ NEW TOR TALK</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          className="input-field text-lg"
          maxLength={300}
          required
        />

        <div className="flex gap-2 mb-2">
          <button type="button" onClick={() => setPreview(false)} className={`text-xs font-mono px-3 py-1 ${!preview ? 'text-lime-500 bg-lime-500/10 border border-lime-500/30' : 'text-dark-300 border border-transparent'}`}>
            WRITE
          </button>
          <button type="button" onClick={() => setPreview(true)} className={`text-xs font-mono px-3 py-1 ${preview ? 'text-lime-500 bg-lime-500/10 border border-lime-500/30' : 'text-dark-300 border border-transparent'}`}>
            PREVIEW
          </button>
        </div>

        {preview ? (
          <div className="terminal-card min-h-[300px] prose prose-invert prose-sm max-w-none font-mono text-dark-300 [&_h1]:text-lime-500 [&_h2]:text-lime-500 [&_a]:text-lime-500 [&_code]:text-lime-400">
            {content ? (
              <div dangerouslySetInnerHTML={{ __html: content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>') }} />
            ) : (
              <p className="text-dark-500">Nothing to preview.</p>
            )}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your post in Markdown..."
            className="input-field h-80 resize-none"
            maxLength={50000}
            required
          />
        )}

        <input
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="Tags (comma separated)"
          className="input-field"
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-dark-500 font-mono">
            {content.length}/50000 chars • Markdown supported
          </p>
          <button type="submit" disabled={submitting || !title || !content} className="btn-primary text-xs px-6">
            {submitting ? 'PUBLISHING...' : 'PUBLISH'}
          </button>
        </div>
      </form>
    </div>
  );
}
