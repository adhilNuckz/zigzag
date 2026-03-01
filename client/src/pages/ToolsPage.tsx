import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, Search, Eye, Upload, Loader2, CheckCircle, XCircle, FileWarning } from "lucide-react";
import { secToolsAPI } from "@/lib/api";

interface Tool {
  name: string;
  description: string;
  inputType: "file" | "url" | "text";
}

const iconMap: Record<string, any> = {
  "virus-scanner": Shield,
  "phishing-checker": AlertTriangle,
  "leak-checker": Search,
  "exposure-checker": Eye,
};

const colorMap: Record<string, string> = {
  "virus-scanner": "text-primary",
  "phishing-checker": "text-accent",
  "leak-checker": "text-primary",
  "exposure-checker": "text-accent",
};

const placeholderMap: Record<string, string> = {
  url: "Enter URL to scan...",
  text: "Enter email, username, or text to check...",
  file: "Select a file to scan...",
};

const ToolsPage = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTools, setLoadingTools] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    secToolsAPI.list().then((data) => {
      setTools(data.tools);
      setLoadingTools(false);
    }).catch(() => setLoadingTools(false));
  }, []);

  const selectedTool = tools.find((t) => t.name === selected);

  const handleExecute = async () => {
    if (!selectedTool) return;
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const payload: { url?: string; text?: string; file?: File } = {};
      if (selectedTool.inputType === "url") payload.url = input;
      else if (selectedTool.inputType === "text") payload.text = input;
      else if (selectedTool.inputType === "file" && file) payload.file = file;

      const res = await secToolsAPI.execute(selectedTool.name, payload);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || "Scan failed.");
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;
    const safe = result.safe;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 border border-border rounded-sm bg-card/30 p-4 space-y-3"
      >
        {/* Status banner */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-sm text-sm font-terminal ${
          safe === true ? "bg-primary/10 text-primary" :
          safe === false ? "bg-accent/10 text-accent" :
          "bg-muted/20 text-muted-foreground"
        }`}>
          {safe === true && <CheckCircle size={16} />}
          {safe === false && <XCircle size={16} />}
          {safe === null && <FileWarning size={16} />}
          <span>
            {safe === true ? "NO THREATS DETECTED" :
             safe === false ? "THREAT DETECTED" :
             "SCAN COMPLETE — REVIEW RESULTS"}
          </span>
        </div>

        {/* Result details */}
        {result.result && (
          <div className="font-mono text-xs text-muted-foreground space-y-1">
            {typeof result.result === "string" ? (
              <p>{result.result}</p>
            ) : (
              <pre className="whitespace-pre-wrap break-all bg-secondary/30 rounded-sm p-3 max-h-64 overflow-auto custom-scrollbar">
                {JSON.stringify(result.result, null, 2)}
              </pre>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="relative z-10 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="font-terminal text-xl text-accent text-glow-red tracking-wider mb-6">
          @ Security Tools
        </h1>

        {loadingTools ? (
          <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm py-8">
            <Loader2 size={16} className="animate-spin" />
            Loading tools...
          </div>
        ) : tools.length === 0 ? (
          <p className="text-muted-foreground font-mono text-sm py-8">No tools available.</p>
        ) : (
          <div className="space-y-3">
            {tools.map((tool, i) => {
              const Icon = iconMap[tool.name] || Shield;
              const color = colorMap[tool.name] || "text-primary";
              const isSelected = selected === tool.name;

              return (
                <motion.div
                  key={tool.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`border rounded-sm bg-card/50 p-5 transition-all cursor-pointer group ${
                    isSelected ? "border-primary/50 bg-card/80" : "border-border hover:border-accent/30"
                  }`}
                  onClick={() => {
                    setSelected(isSelected ? null : tool.name);
                    setResult(null);
                    setError("");
                    setInput("");
                    setFile(null);
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-sm bg-secondary">
                      <Icon size={18} className={color} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-terminal text-sm text-primary text-glow">{tool.name}</h3>
                        <span className="text-xs px-1.5 py-0.5 rounded-sm font-terminal bg-primary/10 text-primary">
                          {tool.inputType}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{tool.description}</p>
                    </div>
                  </div>

                  {/* Expanded input area */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="mt-4 pt-4 border-t border-border/30 space-y-3">
                          {tool.inputType === "file" ? (
                            <div className="flex gap-2 items-center">
                              <input
                                ref={fileRef}
                                type="file"
                                className="hidden"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                              />
                              <button
                                onClick={() => fileRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-2 border border-border rounded-sm bg-secondary/50 text-sm font-mono text-muted-foreground hover:border-primary/50 transition-colors"
                              >
                                <Upload size={14} />
                                {file ? file.name : "Choose file..."}
                              </button>
                              <button
                                onClick={handleExecute}
                                disabled={!file || loading}
                                className="px-4 py-2 border border-accent/30 rounded-sm bg-accent/10 text-accent hover:bg-accent/20 font-terminal text-xs tracking-wider transition-colors disabled:opacity-30"
                              >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : "SCAN"}
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <div className="flex-1 flex items-center gap-2 bg-secondary/50 border border-border rounded-sm px-3">
                                <span className="text-primary/60 font-terminal text-sm">$</span>
                                <input
                                  value={input}
                                  onChange={(e) => setInput(e.target.value)}
                                  placeholder={placeholderMap[tool.inputType]}
                                  onKeyDown={(e) => e.key === "Enter" && !loading && input && handleExecute()}
                                  className="flex-1 bg-transparent py-2 text-sm text-secondary-foreground font-mono outline-none placeholder:text-muted-foreground/20"
                                />
                              </div>
                              <button
                                onClick={handleExecute}
                                disabled={!input || loading}
                                className="px-4 py-2 border border-accent/30 rounded-sm bg-accent/10 text-accent hover:bg-accent/20 font-terminal text-xs tracking-wider transition-colors disabled:opacity-30"
                              >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : "SCAN"}
                              </button>
                            </div>
                          )}

                          {error && (
                            <p className="text-accent text-xs font-mono">{error}</p>
                          )}

                          {renderResult()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Quick scan footer */}
        {!selected && tools.length > 0 && (
          <div className="mt-8 border border-border rounded-sm bg-card/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-primary/60 font-terminal text-sm">$</span>
              <span className="text-muted-foreground/40 font-terminal text-sm">select a tool above to begin scanning</span>
              <span className="animate-cursor-blink text-primary">▊</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolsPage;
