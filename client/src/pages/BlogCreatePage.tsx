import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { blogAPI } from "@/lib/api";

const BlogCreatePage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setCreating(true);
    try {
      const post = await blogAPI.create({ title, content, tags });
      navigate(`/tor-talks/${post._id}`);
    } catch (err: any) {
      alert(err.message);
    }
    setCreating(false);
  };

  return (
    <div className="relative z-10 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          to="/tor-talks"
          className="inline-flex items-center gap-1 text-xs font-terminal text-muted-foreground hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft size={14} /> back to tor talks
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border rounded-sm bg-card/50 p-6"
        >
          <h1 className="font-terminal text-lg text-accent text-glow-red tracking-wider mb-6">
            $ new post
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title *"
              className="w-full bg-secondary/50 border border-border rounded-sm px-3 py-2 text-sm text-secondary-foreground font-mono outline-none focus:border-accent/30 placeholder:text-muted-foreground/30"
              required
              maxLength={300}
            />

            {/* Tab switcher */}
            <div className="flex gap-2 border-b border-border pb-2">
              <button
                type="button"
                onClick={() => setPreview(false)}
                className={`text-xs font-terminal px-3 py-1 rounded-sm transition-colors ${
                  !preview ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-accent"
                }`}
              >
                WRITE
              </button>
              <button
                type="button"
                onClick={() => setPreview(true)}
                className={`text-xs font-terminal px-3 py-1 rounded-sm transition-colors ${
                  preview ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-accent"
                }`}
              >
                PREVIEW
              </button>
            </div>

            {!preview ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post in Markdown... *"
                rows={15}
                className="w-full bg-secondary/50 border border-border rounded-sm px-3 py-2 text-sm text-secondary-foreground font-mono outline-none focus:border-accent/30 placeholder:text-muted-foreground/30 resize-y"
                required
              />
            ) : (
              <div className="min-h-[300px] border border-border rounded-sm bg-secondary/30 p-4 prose prose-invert prose-sm max-w-none font-mono text-secondary-foreground [&_h1]:text-primary [&_h2]:text-primary [&_a]:text-accent [&_code]:text-primary [&_code]:bg-secondary">
                {content ? (
                  (() => {
                    try {
                      const ReactMarkdown = require("react-markdown").default;
                      return <ReactMarkdown>{content}</ReactMarkdown>;
                    } catch {
                      return <p>{content}</p>;
                    }
                  })()
                ) : (
                  <p className="text-muted-foreground/30">Nothing to preview yet...</p>
                )}
              </div>
            )}

            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma separated)"
              className="w-full bg-secondary/50 border border-border rounded-sm px-3 py-2 text-sm text-secondary-foreground font-mono outline-none focus:border-accent/30 placeholder:text-muted-foreground/30"
            />

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 border border-accent/30 rounded-sm bg-accent/10 text-accent hover:bg-accent/20 font-terminal text-xs tracking-wider transition-colors disabled:opacity-50"
              >
                {creating ? "PUBLISHING..." : "PUBLISH"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/tor-talks")}
                className="px-4 py-2 border border-border rounded-sm text-muted-foreground hover:text-primary font-terminal text-xs tracking-wider transition-colors"
              >
                CANCEL
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogCreatePage;
