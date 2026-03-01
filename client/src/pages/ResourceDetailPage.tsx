import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, FileDown, Flag, Eye } from "lucide-react";
import { resourceAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

const ResourceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (!id) return;
    resourceAPI
      .get(id)
      .then((data) => {
        setResource(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleReport = async () => {
    if (!id || reporting) return;
    setReporting(true);
    try {
      await resourceAPI.report(id);
      alert("Reported successfully");
    } catch (err: any) {
      alert(err.message);
    }
    setReporting(false);
  };

  if (loading) {
    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <span className="text-sm text-muted-foreground font-terminal">Loading...</span>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-accent font-terminal mb-4">Resource not found.</p>
          <Link to="/resources" className="text-primary font-terminal text-sm hover:underline">
            &lt; Back to resources
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          to="/resources"
          className="inline-flex items-center gap-1 text-xs font-terminal text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft size={14} /> back to resources
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border rounded-sm bg-card/50 p-6"
        >
          <h1 className="font-terminal text-lg text-primary text-glow tracking-wider mb-3">
            {resource.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-muted-foreground/50 font-terminal mb-4">
            <span>by {resource.author?.alias}</span>
            <span className="flex items-center gap-1">
              <Eye size={10} /> {resource.views}
            </span>
            <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
          </div>

          {Array.isArray(resource.tags) && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {resource.tags.map((t: string) => (
                <span
                  key={t}
                  className="text-xs px-2 py-0.5 rounded-sm bg-secondary text-secondary-foreground font-terminal"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <p className="text-sm text-secondary-foreground font-mono leading-relaxed whitespace-pre-wrap mb-6">
            {resource.description}
          </p>

          {resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 border border-primary/30 rounded-sm bg-primary/10 text-primary hover:bg-primary/20 font-terminal text-xs transition-colors mb-4"
            >
              <ExternalLink size={12} /> Open Link
            </a>
          )}

          {resource.fileUrl && (
            <a
              href={resource.fileUrl}
              download={resource.fileName}
              className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-sm bg-card text-secondary-foreground hover:border-primary/30 font-terminal text-xs transition-colors mb-4 ml-2"
            >
              <FileDown size={12} /> {resource.fileName}{" "}
              <span className="text-muted-foreground/50">
                ({(resource.fileSize / 1024).toFixed(1)}KB)
              </span>
            </a>
          )}

          <div className="border-t border-border pt-4 mt-4 flex items-center justify-between">
            {isAuthenticated && (
              <button
                onClick={handleReport}
                disabled={reporting}
                className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-accent font-terminal transition-colors"
              >
                <Flag size={12} /> {reporting ? "Reporting..." : "Report"}
              </button>
            )}
          </div>
        </motion.article>
      </div>
    </div>
  );
};

export default ResourceDetailPage;
