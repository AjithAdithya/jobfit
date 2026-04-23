// Notes.jsx — field notes grid (editorial cards with hard shadow)
const NOTES = [
  { tag: 'TYPE', title: 'On Constraint', titleEm: 'Constraint', body: 'Why the interesting thing about type tools is always the constraints, not the outputs.', date: 'JAN 2026' },
  { tag: 'ENGINEERING', title: 'Small, sharp tools', titleEm: 'sharp', body: "Building for yourself first. A short defense of wearing too many hats.", date: 'DEC 2025' },
  { tag: 'MISC', title: 'Quiet machines', titleEm: 'Quiet', body: 'Notes on restraint in developer tooling. Spoiler — less is more. Usually.', date: 'NOV 2025' },
];

function Notes({ onOpen }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>Field <em>notes</em></h2>
        <span className="label">RECENT · 3 OF 14</span>
      </div>
      <div className="notes">
        {NOTES.map(n => {
          const [before, after] = n.title.split(n.titleEm);
          return (
            <div className="note" key={n.title} onClick={() => onOpen(n)}>
              <span className="tag">{n.tag}</span>
              <h4>{before}<em>{n.titleEm}</em>{after}</h4>
              <p>{n.body}</p>
              <div className="bottom">{n.date} · 4 min read</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

window.Notes = Notes;
