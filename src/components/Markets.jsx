import { useEffect, useState } from 'react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || '';

function Markets() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${BACKEND}/api/markets?per_page=12&sparkline=true`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to load markets');
        setCoins(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section id="markets" className="relative py-16 bg-gradient-to-b from-black to-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Top Markets</h2>
          <span className="text-slate-300/70 text-sm">Live from CoinGecko</span>
        </div>

        {loading && <p className="text-slate-300">Loading markets…</p>}
        {error && <p className="text-red-400">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {coins.map((c) => (
            <div key={c.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-400/40 transition">
              <div className="flex items-center gap-3">
                <img src={c.image} alt={c.name} className="w-8 h-8" />
                <div>
                  <div className="text-white font-semibold">{c.name}</div>
                  <div className="text-slate-400 text-sm">{c.symbol?.toUpperCase()}</div>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div className="text-white text-xl font-bold">${c.current_price?.toLocaleString()}</div>
                <div className={(c.price_change_percentage_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {Math.round((c.price_change_percentage_24h || 0) * 100) / 100}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Markets;
