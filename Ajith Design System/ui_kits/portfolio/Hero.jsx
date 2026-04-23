// Hero.jsx — big editorial intro
function Hero({ onContact }) {
  return (
    <section className="hero">
      <div className="eyebrow">№ 01 · PORTFOLIO · 2026</div>
      <h1>
        I build <em>quiet</em> tools<br/>in loud colors.
      </h1>
      <p className="lede">
        Designer, engineer, occasional typographer. Currently freelancing on
        design systems, custom type, and tools for people who think in systems.
      </p>
      <div className="hero-cta">
        <button className="btn btn-primary" onClick={onContact}>
          Start a project <span>→</span>
        </button>
        <button className="btn btn-outline" onClick={() => document.getElementById('work')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          See work
        </button>
      </div>
    </section>
  );
}

window.Hero = Hero;
