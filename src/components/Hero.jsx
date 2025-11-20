import Spline from '@splinetool/react-spline';

function Hero() {
  return (
    <section className="relative h-[70vh] w-full overflow-hidden bg-black">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/44zrIZf-iQZhbQNQ/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black pointer-events-none" />

      <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
        <div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow-lg">
            Holographic Crypto Intelligence
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-200/90">
            Live prices, charts, and on-chain info for every coin and token. Ask with your voice — get answers instantly.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <a href="#markets" className="px-5 py-3 rounded-xl bg-white/10 text-white backdrop-blur border border-white/20 hover:bg-white/20 transition">
              Browse Markets
            </a>
            <a href="#assistant" className="px-5 py-3 rounded-xl bg-cyan-500 text-black font-medium hover:bg-cyan-400 transition">
              Try Voice Assistant
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
