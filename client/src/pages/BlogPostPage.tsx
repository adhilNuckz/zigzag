import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUp, Flag, Eye, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { blogAPI } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

const BlogPostPage = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, anonId } = useAuthStore();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (!id) return;
    blogAPI
      .get(id)
      .then((data) => {
        setPost(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleUpvote = async () => {
    if (!id) return;
    try {
      const { upvotes } = await blogAPI.upvote(id);
      setPost((prev: any) => ({ ...prev, upvotes }));
    } catch {}
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentText.trim()) return;
    setCommenting(true);
    try {
      const comment = await blogAPI.comment(id, commentText.trim());
      setPost((prev: any) => ({
        ...prev,
        comments: [...(prev.comments || []), comment],
      }));
      setCommentText("");
    } catch (err: any) {
      alert(err.message);
    }
    setCommenting(false);
  };

  const handleReport = async () => {
    if (!id || reporting) return;
    setReporting(true);
    try {
      await blogAPI.report(id);
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

  if (!post) {
    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-accent font-terminal mb-4">Post not found.</p>
          <Link to="/tor-talks" className="text-primary font-terminal text-sm hover:underline">
            &lt; Back to Tor Talks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          to="/tor-talks"
          className="inline-flex items-center gap-1 text-xs font-terminal text-muted-foreground hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft size={14} /> back to tor talks
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border rounded-sm bg-card/50 p-6 mb-6"
        >
          <h1 className="font-terminal text-xl text-accent text-glow-red tracking-wider mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-muted-foreground/50 font-terminal mb-6">
            <span>by {post.author?.alias}</span>
            <span className="flex items-center gap-1">
              <Eye size={10} /> {post.views}
            </span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>

          {Array.isArray(post.tags) && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((t: string) => (
                <span
                  key={t}
                  className="text-xs px-2 py-0.5 rounded-sm bg-secondary text-secondary-foreground font-terminal"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Markdown Content */}
          <div className="prose prose-invert prose-sm max-w-none font-mono text-secondary-foreground leading-relaxed mb-6 [&_h1]:text-primary [&_h2]:text-primary [&_h3]:text-primary [&_a]:text-accent [&_code]:text-primary [&_code]:bg-secondary [&_pre]:bg-secondary [&_pre]:border [&_pre]:border-border [&_blockquote]:border-accent/30">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Actions */}
          <div className="border-t border-border pt-4 flex items-center gap-4">
            <button
              onClick={handleUpvote}
              className="flex items-center gap-1 px-3 py-1.5 border border-accent/30 rounded-sm bg-accent/10 text-accent hover:bg-accent/20 font-terminal text-xs transition-colors"
            >
              <ArrowUp size={12} /> {post.upvotes || 0}
            </button>
            {isAuthenticated && (
              <button
                onClick={handleReport}
                disabled={reporting}
                className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-accent font-terminal transition-colors ml-auto"
              >
                <Flag size={12} /> {reporting ? "Reporting..." : "Report"}
              </button>
            )}
          </div>
        </motion.article>

        {/* Comments */}
        <div className="border border-border rounded-sm bg-card/50 p-5">
          <h3 className="font-terminal text-sm text-primary text-glow mb-4">
            // Comments ({post.comments?.length || 0})
          </h3>

          <div className="space-y-4 mb-6">
            {(!post.comments || post.comments.length === 0) && (
              <p className="text-xs text-muted-foreground font-terminal">No comments yet.</p>
            )}
            {post.comments?.map((c: any, i: number) => (
              <motion.div
                key={c._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="border-l-2 border-border pl-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-terminal ${
                      c.author?.anonId === anonId ? "text-primary" : "text-accent/70"
                    }`}
                  >
                    {c.author?.alias}
                  </span>
                  <span className="text-xs text-muted-foreground/40 font-terminal">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-secondary-foreground font-mono">{c.content}</p>
              </motion.div>
            ))}
          </div>

          {/* Comment Form */}
          {isAuthenticated && (
            <form onSubmit={handleComment} className="flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-secondary/50 border border-border rounded-sm px-3 py-2 text-sm text-secondary-foreground font-mono outline-none focus:border-accent/30 placeholder:text-muted-foreground/30"
              />
              <button
                type="submit"
                disabled={commenting || !commentText.trim()}
                className="px-3 border border-accent/30 rounded-sm bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-30"
              >
                <Send size={14} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;
