import { useEffect, useRef, useState } from 'react';
import { Mic, StopCircle, Loader2 } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || '';

function Assistant() {
  const [listening, setListening] = useState(false);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech API if available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setQuery(text);
        handleAsk(text);
      };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      setResult(null);
      setListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const handleAsk = async (text) => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text || query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Request failed');
      setResult(data);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="assistant" className="py-16 bg-slate-900">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Ask with your voice</h2>
        <p className="mt-2 text-slate-300">Say things like “price of bitcoin”, “show ethereum chart”, or paste a token contract address.</p>

        <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your question or paste a contract address"
              className="flex-1 px-4 py-3 rounded-xl bg-black/40 text-white outline-none border border-white/10 focus:border-cyan-400/50"
            />
            <button
              onClick={() => handleAsk()}
              className="px-5 py-3 rounded-xl bg-cyan-500 text-black font-medium hover:bg-cyan-400 transition"
            >
              Ask
            </button>
            <button
              onClick={listening ? stopListening : startListening}
              className={`px-4 py-3 rounded-xl border flex items-center gap-2 ${listening ? 'border-red-500/50 bg-red-500/10 text-red-300' : 'border-white/20 bg-white/5 text-white'}`}
            >
              {listening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {listening ? 'Stop' : 'Speak'}
            </button>
          </div>

          {loading && (
            <div className="mt-4 text-slate-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Fetching…
            </div>
          )}

          {result && !result.error && (
            <div className="mt-6">
              {result.type === 'markets' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.data.map((c) => (
                    <div key={c.id} className="p-4 rounded-xl bg-black/40 border border-white/10">
                      <div className="flex items-center gap-3">
                        <img src={c.image} alt={c.name} className="w-6 h-6" />
                        <div className="text-white font-medium">{c.name}</div>
                        <div className="text-slate-400 text-sm">{c.symbol?.toUpperCase()}</div>
                      </div>
                      <div className="mt-3 flex items-end justify-between">
                        <div className="text-white text-lg font-bold">${c.current_price?.toLocaleString()}</div>
                        <div className={(c.price_change_percentage_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {Math.round((c.price_change_percentage_24h || 0) * 100) / 100}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {result.type === 'token' && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-white">
                  <div className="flex items-center gap-3">
                    <img src={result.data.image?.small} alt={result.data.name} className="w-6 h-6" />
                    <div className="font-medium">{result.data.name} ({result.data.symbol?.toUpperCase()})</div>
                  </div>
                  <div className="mt-3 text-slate-300 text-sm">{result.data.description?.en?.slice(0, 220) || 'No description available.'}</div>
                </div>
              )}
            </div>
          )}

          {result?.error && (
            <div className="mt-4 text-red-400">{result.error}</div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Assistant;
