// About.jsx + Footer.jsx + ContactModal.jsx
function About() {
  return (
    <section className="section about">
      <div className="section-head">
        <h2>About <em>me</em></h2>
        <span className="label">BIO · 2026</span>
      </div>
      <div className="about-grid">
        <div>
          <p>
            I'm a designer and engineer based between <em>Bangalore</em> and the internet.
            I make tools that are technically sharp and aesthetically weird, mostly at the
            intersection of typography, type technology, and small interfaces.
          </p>
          <p>
            Previously: design systems at two startups, a stint in type design school,
            a few too many side projects. Currently available for short engagements.
          </p>
        </div>
        <div className="about-stats">
          <div>
            <div className="about-stat">7 yrs</div>
            <div className="about-stat-label">DESIGN + ENGINEERING</div>
          </div>
          <div>
            <div className="about-stat">42</div>
            <div className="about-stat-label">SHIPPED PROJECTS</div>
          </div>
          <div>
            <div className="about-stat">∞</div>
            <div className="about-stat-label">UNFINISHED EXPERIMENTS</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ onContact }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-big">
          let's <em>make</em><br/>something.
        </div>
        <div className="footer-meta">
          <a onClick={onContact} style={{ cursor: 'pointer' }}>HELLO@AJITH.XYZ</a>
          <a href="#">X · @AJITHXYZ</a>
          <a href="#">GITHUB · /AJITH</a>
          <span>© 2026 · BUILT FROM SCRATCH</span>
        </div>
      </div>
    </footer>
  );
}

function ContactModal({ onClose, onSubmit }) {
  const [sending, setSending] = React.useState(false);
  const submit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => { setSending(false); onSubmit(); }, 500);
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="eyebrow">GET IN TOUCH</div>
        <h2>Start a <em>project</em>.</h2>
        <p className="lede">a few words about what you have in mind. I read everything.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label>your name</label>
            <input type="text" required defaultValue="" placeholder="Alex" />
          </div>
          <div className="field">
            <label>email</label>
            <input type="email" required placeholder="alex@company.com" />
          </div>
          <div className="field">
            <label>what's up?</label>
            <textarea required placeholder="a design system, custom type, a tool, a conversation…" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>cancel</button>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? 'sending…' : 'send it'} {!sending && <span>→</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

window.About = About;
window.Footer = Footer;
window.ContactModal = ContactModal;
