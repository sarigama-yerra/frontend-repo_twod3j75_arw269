import Hero from './components/Hero';
import Markets from './components/Markets';
import Assistant from './components/Assistant';

function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Hero />
      <Markets />
      <Assistant />
      <footer className="py-10 text-center text-slate-400 bg-black/90 border-t border-white/10">
        Built for crypto explorers • Voice-ready • Live market data
      </footer>
    </div>
  );
}

export default App;
