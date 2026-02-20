import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { blogAPI } from '../lib/api';
import useAuthStore from '../stores/authStore';

export default function BlogPost() {
  const { id } = useParams();
  const { isAuthenticated } = useAuthStore();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    blogAPI.get(id).then(setPost).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleUpvote = async () => {
    try {
      const { upvotes } = await blogAPI.upvote(id);
      setPost(prev => ({ ...prev, upvotes }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const newComment = await blogAPI.comment(id, comment.trim());
      setPost(prev => ({ ...prev, comments: [...(prev.comments || []), newComment] }));
      setComment('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (!confirm('Report this post?')) return;
    try {
      await blogAPI.report(id);
      alert('Reported.');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-10"><p className="text-dark-400 text-xs font-mono animate-flicker">Loading...</p></div>;
  if (!post) return <div className="text-center py-10"><p className="text-dark-400 text-xs font-mono">Post not found.</p></div>;

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto">
      <Link to="/blog" className="text-xs text-dark-400 font-mono hover:text-lime-500 mb-4 inline-block">
        {'<'} Back to Tor Talks
      </Link>

      <article className="terminal-card mb-6">
        <div className="flex items-start gap-4">
          <button onClick={handleUpvote} className="flex flex-col items-center text-dark-400 hover:text-lime-500 transition-colors flex-shrink-0 pt-1">
            <span className="text-xl leading-none">▲</span>
            <span className="text-xs font-mono">{post.upvotes}</span>
          </button>

          <div className="flex-1">
            <h1 className="text-lg text-lime-500 font-mono mb-2">{post.title}</h1>
            <div className="flex items-center gap-3 mb-4 text-xs text-dark-400 font-mono">
              <span>{post.author?.alias}</span>
              <span>•</span>
              <span>{post.views} views</span>
              <span>•</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Markdown Content */}
            <div className="prose prose-invert prose-sm max-w-none font-mono text-dark-300 [&_h1]:text-lime-500 [&_h2]:text-lime-500 [&_h3]:text-lime-500 [&_a]:text-lime-500 [&_code]:text-lime-400 [&_code]:bg-dark-800 [&_pre]:bg-dark-800 [&_pre]:border [&_pre]:border-dark-400 [&_blockquote]:border-lime-500/30 [&_strong]:text-lime-500/80">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>

            <div className="flex flex-wrap gap-1 mt-4">
              {post.tags?.map(t => <span key={t} className="tag-pill">{t}</span>)}
            </div>

            {isAuthenticated && (
              <button onClick={handleReport} className="text-xs text-dark-500 font-mono hover:text-red-500 mt-4 transition-colors">
                Report
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Comments */}
      <div className="mb-6">
        <h3 className="text-xs text-lime-500 font-mono mb-4">
          {'>'} Comments ({post.comments?.length || 0})
        </h3>

        {post.comments?.length === 0 && (
          <p className="text-xs text-dark-400 font-mono mb-4">No comments yet.</p>
        )}

        <div className="space-y-3 mb-6">
          {post.comments?.map((c, i) => (
            <div key={i} className="pl-4 border-l border-dark-400">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-lime-500/70 font-mono">{c.author?.alias}</span>
                <span className="text-xs text-dark-500 font-mono">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-dark-300 font-mono">{c.content}</p>
            </div>
          ))}
        </div>

        {/* Comment Form */}
        {isAuthenticated && (
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a comment..."
              maxLength={1000}
              className="input-field flex-1"
            />
            <button type="submit" disabled={submitting || !comment.trim()} className="btn-primary text-xs">
              {submitting ? '...' : 'POST'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
