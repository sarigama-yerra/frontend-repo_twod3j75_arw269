import { useEffect, useRef, useState } from 'react';
import { Mic, StopCircle, Loader2, ExternalLink } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || '';

function formatNumber(n, opts = {}) {
  if (n === null || n === undefined) return '—';
  try {
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2, ...opts });
  } catch {
    return String(n);
  }
}

function getMessariFounders(messari) {
  try {
    const data = messari?.data || messari?.data?.data || messari; // support different shapes
    const profile = data?.data?.profile || data?.profile || {};
    const general = profile?.general || {};
    // Try common locations used by Messari profile schema
    const people = general?.people || general?.team || {};
    const founders = people?.founders || people?.persons || people?.people || [];
    let names = [];
    if (Array.isArray(founders)) {
      names = founders.map((p) => p?.name || p?.full_name || p?.title).filter(Boolean);
    } else if (typeof founders === 'object') {
      names = Object.values(founders).map((p) => p?.name || p?.full_name || p?.title).filter(Boolean);
    }
    // Fallback: try leadership
    if (names.length === 0 && Array.isArray(people)) {
      names = people.map((p) => p?.name || p?.full_name || p?.title).filter(Boolean);
    }
    return Array.from(new Set(names)).slice(0, 6);
  } catch {
    return [];
  }
}

function getMessariFunding(messari) {
  try {
    const data = messari?.data || messari?.data?.data || messari;
    const metrics = data?.data?.metrics || data?.metrics || {};
    const profile = data?.data?.profile || data?.profile || {};
    const fundraising = metrics?.fundraising || profile?.fundraising || {};
    const rounds = fundraising?.rounds || fundraising?.funding_rounds || [];
    const total = fundraising?.total_raised_usd || fundraising?.raised || fundraising?.total || null;
    return {
      totalRaised: total,
      rounds: Array.isArray(rounds) ? rounds.slice(0, 5) : [],
    };
  } catch {
    return { totalRaised: null, rounds: [] };
  }
}

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

  const renderTokenSummary = (payload) => {
    const s = payload?.summary || {};
    const messari = payload?.sources?.messari;
    const founders = getMessariFounders(messari);
    const funding = getMessariFunding(messari);

    return (
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-white">
        <div className="flex items-center gap-3">
          {s.image && <img src={s.image} alt={s.name} className="w-7 h-7" />}
          <div className="font-semibold text-lg">{s.name} ({s.symbol?.toUpperCase()})</div>
          {s.contract_address && (
            <a href={`https://etherscan.io/token/${s.contract_address}`} target="_blank" rel="noreferrer" className="text-cyan-300 hover:text-cyan-200 ml-auto inline-flex items-center gap-1 text-sm">
              View on Etherscan <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {s.description && (
          <div className="mt-3 text-slate-300 text-sm leading-relaxed">
            {s.description.slice(0, 320)}{s.description.length > 320 ? '…' : ''}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Stat label="Price" value={`$${formatNumber(s.price)}`} />
          <Stat label="Market Cap" value={`$${formatNumber(s.market_cap)}`} />
          <Stat label="FDV" value={`$${formatNumber(s.fully_diluted_valuation)}`} />
          <Stat label="Circulating" value={formatNumber(s.circulating_supply)} />
          <Stat label="Total Supply" value={formatNumber(s.total_supply)} />
          <Stat label="Max Supply" value={formatNumber(s.max_supply)} />
          {payload?.sources?.etherscan?.total_supply_raw && (
            <Stat label="Etherscan Total (raw)" value={payload.sources.etherscan.total_supply_raw} />
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-sm uppercase tracking-wide text-slate-400">Founders</div>
            {founders.length > 0 ? (
              <ul className="mt-2 list-disc list-inside text-slate-200 space-y-1">
                {founders.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 text-slate-400">Not available</div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-sm uppercase tracking-wide text-slate-400">Funding</div>
            <div className="mt-2 text-slate-200">Total Raised: {funding.totalRaised ? `$${formatNumber(funding.totalRaised)}` : '—'}</div>
            {funding.rounds?.length > 0 ? (
              <div className="mt-2 space-y-2">
                {funding.rounds.map((r, idx) => (
                  <div key={idx} className="text-sm text-slate-300">
                    {r?.date ? new Date(r.date).toLocaleDateString() + ' • ' : ''}
                    {r?.type || r?.series || 'Round'}
                    {r?.amount_usd ? ` • $${formatNumber(r.amount_usd)}` : ''}
                    {r?.investors?.length ? ` • ${r.investors.length} investors` : ''}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 text-slate-400">No rounds visible</div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {s?.links?.homepage && (
            <a href={s.links.homepage} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30">
              Website
            </a>
          )}
          {s?.links?.twitter && (
            <a href={`https://twitter.com/${s.links.twitter}`} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30">
              Twitter
            </a>
          )}
          {s?.links?.github && (
            <a href={s.links.github} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30">
              GitHub
            </a>
          )}
          {s?.links?.discord && (
            <a href={s.links.discord} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30">
              Discord
            </a>
          )}
          {s?.links?.telegram && (
            <a href={`https://t.me/${s.links.telegram}`} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30">
              Telegram
            </a>
          )}
        </div>
      </div>
    );
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

              {result.type === 'token_full' && renderTokenSummary(result.data)}
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

function Stat({ label, value }) {
  return (
    <div className="p-3 rounded-lg bg-black/30 border border-white/10">
      <div className="text-xs uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-white font-semibold">{value}</div>
    </div>
  );
}

export default Assistant;
