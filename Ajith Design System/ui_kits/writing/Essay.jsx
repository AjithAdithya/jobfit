// Writing UI kit — Essay.jsx, all in one file
function Essay() {
  const [progress, setProgress] = React.useState(0);
  const [saved, setSaved] = React.useState(false);
  const [liked, setLiked] = React.useState(false);
  const articleRef = React.useRef(null);

  React.useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const p = h.scrollTop / (h.scrollHeight - h.clientHeight);
      setProgress(Math.min(100, Math.max(0, p * 100)));
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (<>
    <div className="read-topbar">
      <div className="left">
        <img src="../../assets/logo-mark-black.png" alt=""/>
        <div className="name">Ajith Adithya <em>R K</em></div>
      </div>
      <div className="progress"><div className="bar" style={{ width: progress + '%' }}/></div>
      <button className={saved ? 'active' : ''} onClick={() => setSaved(s => !s)}>
        {saved ? '✓ saved' : 'save'}
      </button>
    </div>

    <article className="read-layout" ref={articleRef}>
      <div className="meta-line">
        <span>ESSAY · № 12</span>
        <span className="dot">·</span>
        <span>JANUARY 2026</span>
        <span className="dot">·</span>
        <span>8 MIN READ</span>
      </div>

      <h1 className="essay-title">
        On the <em>interesting</em> part of constraints.
      </h1>
      <p className="dek">
        Why the interesting thing about building type tools was never the outputs —
        it was always the shape of the box you chose to work inside.
      </p>

      <div className="byline">
        <div className="avatar"><img src="../../assets/logo-mark-white.png"/></div>
        <div className="who">Ajith Adithya R K <span>· written at a desk in Bangalore</span></div>
        <div className="actions">
          <button className={liked ? 'on' : ''} onClick={() => setLiked(l => !l)}>
            {liked ? '✦ liked' : '♡ like'}
          </button>
          <button>share</button>
        </div>
      </div>

      <div className="prose">
        <p>
          I spent most of 2024 building a browser-based variable-font playground. The original
          pitch was something technical and worthy-sounding — <em>explore the design space of
          variable axes</em>, whatever that meant. Three months in, I noticed I wasn't interested
          in the outputs at all. I kept going back to tweak the constraints.
        </p>
        <p>
          What font files can be loaded? How big is the canvas? Which axes are exposed, and in
          what order? Can you scrub, or only step? These decisions — all of them upstream of the
          "actual" design tool — turned out to be the entire job.
        </p>

        <blockquote>
          You don't design the output. You design the <em>shape of the space</em> the output
          will eventually sit inside.
        </blockquote>

        <h2>A small, <em>stubborn</em> observation</h2>
        <p>
          This is true of almost every tool I've loved. The constraints are the product.
          When a tool feels good, it's usually because someone had strong opinions about
          what it wouldn't do, and those opinions have been quietly absorbed into the shape
          of the interface.
        </p>

        <figure>
          <div className="img"><span>— figure 01 · the design space —</span></div>
          <figcaption>A screenshot from Glyph Studio · 2024</figcaption>
        </figure>

        <p>
          The opposite is true too. The tools I've quietly abandoned are usually the ones that
          gave me every option and let me pick. That sounds like freedom. It isn't. Freedom,
          in a tool, is a list of things you don't have to think about.
        </p>

        <div className="pullquote">
          Freedom, in a tool, is a list of things you <em>don't</em> have to think about.
        </div>

        <p>
          Which is why the interesting work — the part that matters to the person using it —
          happens a layer up from the thing you ship. Before the knobs are knobs, someone had
          to decide there should be knobs at all. That decision is the design.
        </p>

        <h2>A short list of constraints I like</h2>
        <p>
          Two fonts, maximum. One accent color per screen. No animation over 300ms. Every tool
          opens with a keyboard shortcut. Nothing auto-saves silently. When you undo, you undo
          all the way.
        </p>

        <p>
          None of these are universal. They're the shape of my particular box. But that's the
          whole point — the shape is the thing.
        </p>
      </div>

      <div className="endnote">
        <div>FILED UNDER · <a>TYPE</a> · <a>TOOLS</a> · <a>ESSAYS</a></div>
        <div>← <a>PREVIOUS</a> · <a>NEXT</a> →</div>
      </div>

      <div className="related">
        <h3>Related</h3>
        <div className="items">
          <div className="item"><span className="tag">TYPE</span><h4>Small, <em>sharp</em> tools</h4></div>
          <div className="item"><span className="tag">MISC</span><h4><em>Quiet</em> machines</h4></div>
        </div>
      </div>
    </article>
  </>);
}

window.Essay = Essay;
