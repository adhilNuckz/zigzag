import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resourceAPI } from '../lib/api';
import useAuthStore from '../stores/authStore';

export default function ResourceDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuthStore();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resourceAPI.get(id).then(setResource).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleReport = async () => {
    if (!confirm('Report this resource for abuse?')) return;
    try {
      await resourceAPI.report(id);
      alert('Reported successfully.');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-10"><p className="text-dark-400 text-xs font-mono animate-flicker">Loading...</p></div>;
  if (!resource) return <div className="text-center py-10"><p className="text-dark-400 text-xs font-mono">Resource not found.</p></div>;

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto">
      <Link to="/resources" className="text-xs text-dark-400 font-mono hover:text-lime-500 mb-4 inline-block">
        {'<'} Back to Resources
      </Link>

      <div className="terminal-card">
        <h1 className="text-lg text-lime-500 font-mono mb-2">{resource.title}</h1>

        <div className="flex items-center gap-3 mb-4 text-xs text-dark-400 font-mono">
          <span>By {resource.author?.alias}</span>
          <span>•</span>
          <span>{resource.views} views</span>
          <span>•</span>
          <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
        </div>

        <p className="text-sm text-dark-300 font-mono whitespace-pre-wrap mb-4">{resource.description}</p>

        {resource.url && (
          <div className="mb-3">
            <span className="text-xs text-dark-400 font-mono">Link: </span>
            <a href={resource.url} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-lime-500 font-mono hover:underline break-all">
              {resource.url}
            </a>
          </div>
        )}

        {resource.fileUrl && (
          <div className="mb-3">
            <a href={resource.fileUrl} download className="btn-ghost text-xs inline-block">
              ↓ Download {resource.fileName} ({(resource.fileSize / 1024).toFixed(1)}KB)
            </a>
          </div>
        )}

        <div className="flex flex-wrap gap-1 mb-4">
          {resource.tags?.map(t => (
            <span key={t} className="tag-pill">{t}</span>
          ))}
        </div>

        {isAuthenticated && (
          <button onClick={handleReport} className="text-xs text-dark-500 font-mono hover:text-red-500 transition-colors">
            Report Abuse
          </button>
        )}
      </div>
    </div>
  );
}
