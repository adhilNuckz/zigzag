import { useState, useEffect } from 'react';
import { secToolsAPI } from '../lib/api';
import useAuthStore from '../stores/authStore';

const TOOL_ICONS = {
  'virus-scanner': '🛡',
  'phishing-checker': '🔗',
  'leak-checker': '🔓',
  'exposure-checker': '👁',
};

export default function SecurityTools() {
  const { isAuthenticated } = useAuthStore();
  const [tools, setTools] = useState([]);
  const [activeTool, setActiveTool] = useState(null);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    secToolsAPI.list()
      .then(data => setTools(data.tools))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleExecute = async (e) => {
    e.preventDefault();
    if (!activeTool) return;
    setScanning(true);
    setResult(null);

    try {
      let body;
      if (activeTool.inputType === 'file') {
        if (!file) return;
        body = new FormData();
        body.append('file', file);
      } else if (activeTool.inputType === 'url') {
        body = { url: input };
      } else {
        body = { text: input };
      }

      const data = await secToolsAPI.execute(activeTool.name, body);
      setResult(data);
    } catch (err) {
      setResult({ safe: null, result: { error: err.message } });
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-dark-400 text-xs font-mono animate-flicker">Loading security modules...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="font-pixel text-sm text-lime-500 mb-2">@ SECURITY TOOLS</h1>
      <p className="text-xs text-dark-400 font-mono mb-6">Modular security analysis dashboard. Plugin architecture.</p>

      {/* Tool Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {tools.map(tool => (
          <button
            key={tool.name}
            onClick={() => { setActiveTool(tool); setResult(null); setInput(''); setFile(null); }}
            className={`terminal-card text-left transition-all ${activeTool?.name === tool.name ? 'border-lime-500/50 shadow-neon' : ''}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">{TOOL_ICONS[tool.name] || '⚙'}</span>
              <div>
                <h3 className="text-xs text-lime-500 font-mono">{tool.name}</h3>
                <p className="text-xs text-dark-400 font-mono">{tool.description}</p>
              </div>
            </div>
            <div className="text-xs text-dark-500 font-mono">
              Input: <span className="text-lime-500/50">{tool.inputType}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Active Tool Panel */}
      {activeTool && (
        <div className="terminal-card animate-slideUp">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-dark-400">
            <span className="text-lg">{TOOL_ICONS[activeTool.name] || '⚙'}</span>
            <div>
              <h2 className="text-sm text-lime-500 font-mono">{activeTool.name}</h2>
              <p className="text-xs text-dark-400 font-mono">{activeTool.description}</p>
            </div>
          </div>

          {!isAuthenticated ? (
            <p className="text-xs text-dark-400 font-mono">Session required to use tools.</p>
          ) : (
            <form onSubmit={handleExecute} className="space-y-4">
              {activeTool.inputType === 'file' ? (
                <div>
                  <label className="text-xs text-dark-300 font-mono block mb-2">Select file to scan:</label>
                  <input
                    type="file"
                    onChange={e => setFile(e.target.files[0])}
                    className="text-xs text-dark-300 font-mono file:btn-ghost file:mr-3 file:border-0"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs text-dark-300 font-mono block mb-2">
                    {activeTool.inputType === 'url' ? 'Enter URL to check:' : 'Enter text to check:'}
                  </label>
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={activeTool.inputType === 'url' ? 'https://example.com' : 'Enter query...'}
                    className="input-field"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={scanning || (activeTool.inputType === 'file' ? !file : !input)}
                className="btn-primary text-xs"
              >
                {scanning ? (
                  <span className="flex items-center gap-2">
                    <span className="typing-dots"><span>.</span><span>.</span><span>.</span></span>
                    SCANNING
                  </span>
                ) : 'EXECUTE SCAN'}
              </button>
            </form>
          )}

          {/* Results */}
          {result && (
            <div className="mt-6 pt-4 border-t border-dark-400 animate-fadeIn">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs text-lime-500 font-mono">{'>'} RESULTS</h3>
                {result.safe === true && <span className="text-xs font-mono text-green-500 bg-green-500/10 px-2 py-0.5">SAFE</span>}
                {result.safe === false && <span className="text-xs font-mono text-red-500 bg-red-500/10 px-2 py-0.5">THREAT DETECTED</span>}
                {result.safe === null && <span className="text-xs font-mono text-yellow-500 bg-yellow-500/10 px-2 py-0.5">UNKNOWN</span>}
              </div>

              <pre className="bg-dark-800 border border-dark-400 p-4 overflow-x-auto text-xs text-dark-300 font-mono whitespace-pre-wrap">
                {JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-dark-500 font-mono">
          Tools run server-side. No data is stored. Results are ephemeral.
        </p>
      </div>
    </div>
  );
}
