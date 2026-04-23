// ProjectList.jsx — numbered editorial project list + a featured card
const PROJECTS = [
  { num: '№ 01', title: 'Glyph Studio',       titleEm: 'studio',    meta: 'TYPE · 2024', year: '2024' },
  { num: '№ 02', title: 'Quiet Machines',     titleEm: 'machines',  meta: 'ESSAY · 2025', year: '2025' },
  { num: '№ 03', title: 'Kerning Kitchen',    titleEm: 'kitchen',   meta: 'TOOL · 2025', year: '2025' },
  { num: '№ 04', title: 'Low-res Portraits',  titleEm: 'portraits', meta: 'PROJECT · 2023', year: '2023' },
  { num: '№ 05', title: 'Paper Interface',    titleEm: 'interface', meta: 'EXPERIMENT · 2024', year: '2024' },
];

function ProjectList({ onOpen }) {
  return (
    <section className="section" id="work">
      <div className="section-head">
        <h2>Selected <em>work</em></h2>
        <span className="label">№ 01 — 07 · 2023—26</span>
      </div>

      <Feature onOpen={onOpen} />

      <div className="project-list" style={{ marginTop: 32 }}>
        {PROJECTS.map(p => (
          <ProjectRow key={p.num} project={p} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

function ProjectRow({ project, onOpen }) {
  const title = project.title.replace(project.titleEm, '|SPLIT|');
  const [before, after] = title.split('|SPLIT|');
  return (
    <div className="project" onClick={() => onOpen(project)}>
      <span className="num">{project.num}</span>
      <span className="project-title">{before}<em>{project.titleEm}</em>{after}</span>
      <span className="meta">{project.meta}</span>
      <span className="arrow">↗</span>
    </div>
  );
}

function Feature({ onOpen }) {
  return (
    <div className="feature">
      <span className="sparkle">✦</span>
      <div>
        <div className="eyebrow">№ 07 · FEATURED · SHIPPED</div>
        <h3>A browser-based variable font <em>playground</em>.</h3>
      </div>
      <span className="pill" onClick={() => onOpen({ num: '№ 07', title: 'Glyph Studio' })}>
        read the case study →
      </span>
    </div>
  );
}

window.ProjectList = ProjectList;
