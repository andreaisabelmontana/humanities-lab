// ============================================================
// humanities-lab — 10 reasoning demos for IE Humanities:
//   "Technology and the Making of the Modern World" (P. De Oliveira).
//
// The course's thesis (Benjamin + Winner + Misa): technology is not a
// neutral force of progress but a human creation that reorganizes power —
// "a site of contestation and negotiation." Each widget lets you manipulate
// that argument rather than merely read it.
//
// Every demo follows the *-lab pattern:
//   1. read control state through helpers that always return finite values
//   2. compute into a local buffer
//   3. render in a single idempotent draw()/render() wrapped in try/catch
//
// Canvas demos reset the transform and clear before drawing, so resizes and
// rapid input never compound state. Text/reasoning demos rebuild their DOM
// the same idempotent way.
// ============================================================

// ---------- helpers ------------------------------------------------------
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function n(id, fallback) {
  const el = document.getElementById(id);
  const v = el ? +el.value : NaN;
  return Number.isFinite(v) ? v : fallback;
}
const $ = id => document.getElementById(id);
const setText = (id, t) => { const el = $(id); if (el) el.textContent = t; };

// ---------- palette ------------------------------------------------------
const ACCENT = '#4338CA';
const ACCENT_S = 'rgba(67,56,202,0.16)';
const RULE  = '#E5E5EA';
const RULE_H = '#CDCDD4';
const INK   = '#15151A';
const INK_S = '#4B4B55';
const MUTED = '#8A8A92';
const GOOD  = '#16A34A';
const WARN  = '#F59E0B';
const BAD   = '#DC2626';

function fitCanvas(cv) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = cv.getBoundingClientRect();
  const cssW = Math.max(80, rect.width);
  const cssH = Math.max(80, parseInt(cv.getAttribute('height'), 10) || 280);
  cv.width  = Math.floor(cssW * dpr);
  cv.height = Math.floor(cssH * dpr);
  cv.style.height = cssH + 'px';
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = '12px Inter, sans-serif';
  ctx.textBaseline = 'alphabetic';
  return { ctx, w: cssW, h: cssH };
}
// pointer position in CSS pixels relative to canvas
function ptr(cv, ev) {
  const r = cv.getBoundingClientRect();
  return { x: ev.clientX - r.left, y: ev.clientY - r.top };
}
// word-wrap a string onto a canvas, returns next y
function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y); line = words[i]; y += lineH;
    } else { line = test; }
  }
  if (line) { ctx.fillText(line, x, y); y += lineH; }
  return y;
}

// ============================================================
// Shared quiz engine for the three text-classification demos
// (artifacts / sources / fallacies). Idempotent render() with
// per-item locked state; score persists; "next" advances.
// ============================================================
function makeQuiz(cfg) {
  const root = $(cfg.choicesId); if (!root) return;
  const items = cfg.items;
  let idx = 0, score = 0;
  const answered = new Array(items.length).fill(null); // stores chosen key
  const buttons = [...root.querySelectorAll('.choice')];

  function render() {
    const it = items[idx];
    setText(cfg.tagId, `${cfg.tagWord} ${idx + 1} / ${items.length}`);
    const claimEl = $(cfg.textId);
    claimEl.innerHTML = it.who
      ? `${it.text}<br><span class="who">— ${it.who}</span>`
      : it.text;
    const locked = answered[idx] !== null;
    buttons.forEach(b => {
      const k = b.dataset.k;
      b.classList.remove('correct', 'wrong', 'muted');
      b.disabled = locked;
      if (locked) {
        if (k === it.answer) b.classList.add('correct');
        else if (k === answered[idx]) b.classList.add('wrong');
        else b.classList.add('muted');
      }
    });
    const fb = $(cfg.fbId);
    if (locked) {
      const right = answered[idx] === it.answer;
      fb.className = 'feedback ' + (right ? 'good' : 'bad');
      fb.innerHTML = (right ? '<strong>Correct.</strong> ' : '<strong>Not quite.</strong> ') + it.explain;
    } else {
      fb.className = 'feedback';
      fb.textContent = cfg.prompt;
    }
    setText(cfg.scoreId, `${score} / ${items.length}`);
  }
  buttons.forEach(b => b.addEventListener('click', () => {
    if (answered[idx] !== null) return;
    answered[idx] = b.dataset.k;
    if (b.dataset.k === items[idx].answer) score++;
    render();
  }));
  $(cfg.nextId).addEventListener('click', () => { idx = (idx + 1) % items.length; render(); });
  render();
}

// ============================================================
// 1. DO ARTIFACTS HAVE POLITICS? (Winner)
// ============================================================
makeQuiz({
  choicesId: 'pol-choices', tagId: 'pol-tag', textId: 'pol-text',
  fbId: 'pol-fb', scoreId: 'pol-score', nextId: 'pol-next',
  tagWord: 'case', prompt: "Pick the reading that best fits Winner's argument.",
  items: [
    { text: 'Robert Moses built the Long Island parkway overpasses unusually low, so that the 12-foot buses used by the poor and Black could not reach Jones Beach.',
      who: "Winner's signature example",
      answer: 'flexible',
      explain: 'For Winner this is the first kind of politics: a <strong>design choice</strong> that settled a social question. It could have been built otherwise — the politics live in the decision, not the bridge as such.' },
    { text: 'A nuclear power system, once adopted, requires a permanent, centralized, militarized apparatus to guard fissile material and run the plants safely.',
      who: 'Winner on "inherently political" technologies',
      answer: 'inherent',
      explain: 'Winner argues some technologies are <strong>inherently political</strong>: atomic energy "seems" to require authoritarian, centralized control to function at all, regardless of who adopts it.' },
    { text: 'Cyrus McCormick installed pneumatic molding machines in his reaper works mainly to break the skilled iron-molders’ union, even though the machines made worse castings.',
      who: 'Winner, after David Noble',
      answer: 'flexible',
      explain: 'A flexible, contingent politics: the machine was chosen <strong>to win a labor dispute</strong>, not for efficiency. Another firm could have rejected it.' },
    { text: 'Mechanical tomato harvesters favored large farms that could afford them and the new tough-skinned tomato bred to suit them, driving thousands of small growers out.',
      who: 'Winner',
      answer: 'flexible',
      explain: 'The harvester restructured an industry, but the outcome flowed from <strong>which version was developed and who could buy it</strong> — a contingent, social choice.' },
    { text: 'A hammer can drive a nail, pry a board, or break a window; nothing about its form dictates the social order in which it is used.',
      who: 'a hard case for Winner',
      answer: 'neutral',
      explain: 'Some simple tools really are close to neutral instruments. Winner’s point is precisely that <strong>not all</strong> technologies are like this — many are not.' },
    { text: 'The solar-energy advocates of the 1970s argued that decentralized rooftop systems were not just cleaner but more compatible with democratic, local self-governance.',
      who: 'Winner',
      answer: 'inherent',
      explain: 'The claim is that an energy system’s <strong>scale and structure carry a politics</strong>: decentralized solar leans democratic, centralized power leans hierarchical. That is the second, inherent sense.' },
  ],
});

// ============================================================
// 2. DETERMINISM vs SOCIAL CONSTRUCTION
// ============================================================
(function frames() {
  const cv = $('cv-frames'); if (!cv) return;
  const CASES = {
    clock: {
      title: 'the mechanical clock',
      det: 'The clock created industrial capitalism: once time could be measured, work had to be disciplined to it. The machine reshaped human consciousness.',
      soc: 'Monasteries wanted clocks to order prayer; merchants wanted them for markets. Society built the clock it already needed, then chose to live by it.',
    },
    rail: {
      title: 'the railroad',
      det: 'The railroad annihilated space and time and forced standardized time zones, national markets and bureaucratic management into being.',
      soc: 'States, financiers and empires chose where track went and who it served. The railroad expressed prior decisions about land, capital and conquest.',
    },
    factory: {
      title: 'the factory',
      det: 'Powered machinery required workers to gather, synchronize and submit to the machine’s rhythm; the factory dictated the new social order.',
      soc: 'Owners adopted the factory to control labor and capture skill, as much as for power. Lowell’s "mill girls" system was a deliberate social design.',
    },
    bomb: {
      title: 'the atomic bomb',
      det: 'Once physics made the bomb possible, its use and the arms race that followed were all but inevitable consequences of the technology itself.',
      soc: 'The Manhattan Project, the decision to drop it, and the Cold War build-up were political choices by states — the bomb forced nothing on its own.',
    },
    net: {
      title: 'the internet',
      det: 'The network’s architecture inevitably flattened hierarchies, globalized culture and rewired how humans think and connect.',
      soc: 'Military funding, corporate platforms and national regulation shaped what the internet became. "Diversity in computer history" shows humans at the center.',
    },
  };
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    const c = CASES[$('fr-case').value] || CASES.rail;
    const p = n('fr-p', 50);
    setText('fr-pv', p);

    // gradient bar showing the spectrum
    const barY = 40, barH = 16, barX = 30, barW = w - 60;
    const g = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    g.addColorStop(0, ACCENT); g.addColorStop(1, GOOD);
    ctx.fillStyle = g; ctx.globalAlpha = 0.85;
    ctx.fillRect(barX, barY, barW, barH); ctx.globalAlpha = 1;
    // pole labels
    ctx.font = '600 11px JetBrains Mono, monospace'; ctx.textAlign = 'left';
    ctx.fillStyle = ACCENT; ctx.fillText('hard determinism', barX, barY - 8);
    ctx.textAlign = 'right'; ctx.fillStyle = GOOD; ctx.fillText('social construction', barX + barW, barY - 8);
    // marker
    const mx = barX + barW * (p / 100);
    ctx.beginPath(); ctx.moveTo(mx, barY - 6); ctx.lineTo(mx - 6, barY - 14); ctx.lineTo(mx + 6, barY - 14); ctx.closePath();
    ctx.fillStyle = INK; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(mx, barY + barH / 2, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // title
    ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.font = '700 15px Inter, sans-serif';
    ctx.fillText(c.title, w / 2, barY + barH + 28);

    // the narration that wins emphasis
    ctx.textAlign = 'left'; ctx.font = '12.5px Inter, sans-serif';
    const detW = clamp(1 - p / 100, 0, 1), socW = clamp(p / 100, 0, 1);
    let y = barY + barH + 54;
    ctx.fillStyle = INK_S;
    ctx.globalAlpha = 0.35 + 0.65 * detW;
    ctx.fillStyle = ACCENT;
    ctx.font = '600 11px JetBrains Mono, monospace';
    ctx.fillText('▸ technology drives history', barX, y);
    ctx.fillStyle = INK; ctx.font = '12.5px Inter, sans-serif';
    y = wrapText(ctx, c.det, barX, y + 18, barW, 17) + 10;
    ctx.globalAlpha = 0.35 + 0.65 * socW;
    ctx.fillStyle = GOOD; ctx.font = '600 11px JetBrains Mono, monospace';
    ctx.fillText('▸ society shapes technology', barX, y);
    ctx.fillStyle = INK; ctx.font = '12.5px Inter, sans-serif';
    wrapText(ctx, c.soc, barX, y + 18, barW, 17);
    ctx.globalAlpha = 1; ctx.textAlign = 'left';

    let lean, col;
    if (p < 35) { lean = 'determinist'; col = ACCENT; }
    else if (p > 65) { lean = 'constructivist'; col = GOOD; }
    else { lean = 'contested middle'; col = WARN; }
    setText('fr-lean', lean); $('fr-lean').style.color = col;
    setText('fr-note', lean === 'contested middle'
      ? 'The course’s position: technology neither determines nor merely reflects — it is negotiated.'
      : 'Slide toward the center to find the course’s "site of contestation".');
  }
  $('fr-case').addEventListener('change', draw);
  $('fr-p').addEventListener('input', draw);
  window.addEventListener('resize', draw);
  draw();
})();

// ============================================================
// 3. ARGUMENT ANATOMY (Toulmin) — node diagram
// ============================================================
(function argument() {
  const cv = $('cv-arg'); if (!cv) return;
  const CASES = {
    winner: {
      claim: 'Artifacts have politics',
      grounds: 'Moses’ low bridges; nuclear plants need central control',
      warrant: 'How a thing is built channels who holds power',
      backing: 'Histories of labor, energy and urban design',
      rebuttal: 'Yet some tools are flexible and reused freely',
    },
    benjamin: {
      claim: 'Every document of civilization is also one of barbarism',
      grounds: 'Monuments rest on the labor and conquest of the unnamed',
      warrant: 'Cultural treasures are inseparable from their costs',
      backing: 'A materialist reading of history "against the grain"',
      rebuttal: 'But progress did relieve real human suffering too',
    },
    misa: {
      claim: 'Technology is a cultural, not merely technical, force',
      grounds: 'From Leonardo to the internet, tools embed values',
      warrant: 'Societies and machines co-produce one another',
      backing: 'Six centuries of comparative case studies',
      rebuttal: 'Engineering constraints still set hard limits',
    },
  };
  const parts = ['claim', 'grounds', 'warrant', 'backing', 'rebuttal'];
  const labels = { claim: 'CLAIM', grounds: 'GROUNDS', warrant: 'WARRANT', backing: 'BACKING', rebuttal: 'REBUTTAL' };
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    const c = CASES[$('arg-case').value] || CASES.winner;
    const on = {};
    parts.forEach(p => { on[p] = $('arg-' + p).checked; });

    // layout: grounds -> claim across the top; warrant/backing below; rebuttal off to the side
    const cx = w / 2;
    const box = (x, y, bw, bh, key, color, faded) => {
      ctx.globalAlpha = faded ? 0.22 : 1;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = color; ctx.lineWidth = 1.8;
      roundRect(ctx, x - bw / 2, y - bh / 2, bw, bh, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color; ctx.font = '600 9px JetBrains Mono, monospace'; ctx.textAlign = 'center';
      ctx.fillText(labels[key], x, y - bh / 2 + 13);
      ctx.fillStyle = INK; ctx.font = '11px Inter, sans-serif';
      wrapCentered(ctx, c[key], x, y - bh / 2 + 28, bw - 16, 13);
      ctx.globalAlpha = 1;
    };
    const arrow = (x1, y1, x2, y2, faded) => {
      ctx.globalAlpha = faded ? 0.18 : 0.8;
      ctx.strokeStyle = INK_S; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const a = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 8 * Math.cos(a - 0.4), y2 - 8 * Math.sin(a - 0.4));
      ctx.lineTo(x2 - 8 * Math.cos(a + 0.4), y2 - 8 * Math.sin(a + 0.4));
      ctx.closePath(); ctx.fillStyle = INK_S; ctx.fill();
      ctx.globalAlpha = 1;
    };
    const bw = Math.min(220, w * 0.36), bh = 58;
    const gY = 56, cY = 56, wY = 165, bkY = 270, rY = 165;
    const gX = bw / 2 + 14, cX = w - bw / 2 - 14;

    // arrows first (under boxes)
    arrow(gX + bw / 2, gY, cX - bw / 2, cY, !(on.grounds && on.claim));     // grounds -> claim
    arrow(cx, wY - bh / 2, cx, cY + bh / 2 + 2, !(on.warrant && on.claim)); // warrant -> claim (up)
    arrow(cx, bkY - bh / 2, cx, wY + bh / 2, !(on.backing && on.warrant));  // backing -> warrant
    arrow(gX + 4, rY - bh / 2, gX + 4, gY + bh / 2, !(on.rebuttal && on.claim)); // rebuttal -> (qualifies)

    box(gX, gY, bw, bh, 'grounds', INK_S, !on.grounds);
    box(cX, cY, bw, bh, 'claim', ACCENT, !on.claim);
    box(cx, wY, bw, bh, 'warrant', ACCENT, !on.warrant);
    box(cx, bkY, bw, bh, 'backing', MUTED, !on.backing);
    box(gX, rY, bw, bh, 'rebuttal', BAD, !on.rebuttal);

    // strength = weighted completeness
    const weights = { claim: 3, grounds: 3, warrant: 2, backing: 1, rebuttal: 1 };
    let have = 0, total = 0;
    parts.forEach(p => { total += weights[p]; if (on[p]) have += weights[p]; });
    const pct = Math.round(100 * have / total);
    let txt, col;
    if (!on.claim || !on.grounds) { txt = 'incomplete'; col = BAD; }
    else if (pct >= 90) { txt = 'rigorous'; col = GOOD; }
    else if (pct >= 60) { txt = 'serviceable'; col = WARN; }
    else { txt = 'thin'; col = BAD; }
    setText('arg-strength', txt + ' (' + pct + '%)');
    $('arg-strength').style.color = col;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function wrapCentered(ctx, text, x, y, maxW, lineH) {
    const words = text.split(' '); let line = ''; const lines = [];
    for (const wd of words) {
      const test = line ? line + ' ' + wd : wd;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = wd; }
      else line = test;
    }
    if (line) lines.push(line);
    lines.slice(0, 2).forEach((ln, i) => ctx.fillText(ln, x, y + i * lineH));
  }
  $('arg-case').addEventListener('change', draw);
  ['claim', 'grounds', 'warrant', 'backing', 'rebuttal'].forEach(p =>
    $('arg-' + p).addEventListener('change', draw));
  window.addEventListener('resize', draw);
  draw();
})();

// ============================================================
// 4. PERIODIZATION TIMELINE (Misa, Leonardo to the Internet)
// ============================================================
(function timeline() {
  const cv = $('cv-time'); if (!cv) return;
  // eras grounded in Misa's chapter spans + course sessions
  const ERAS = [
    { a: 1740, b: 1851, name: 'Geographies of Industry', tech: 'water & steam power, the factory', sess: 'Sessions 3–5', note: 'Industrial revolution and the reorganization of labor (Lowell mills).' },
    { a: 1840, b: 1914, name: 'Instruments of Empire', tech: 'steamship, railway, telegraph, quinine', sess: 'Sessions 6–10', note: 'Technology as a tool of imperial conquest and the "civilizing mission".' },
    { a: 1870, b: 1930, name: 'Science & Systems', tech: 'electricity, urban lighting, networks', sess: 'Sessions 10–12', note: 'Large technological systems reshape the city and the senses.' },
    { a: 1900, b: 1950, name: 'Materials of Modernism', tech: 'Fordism, Taylorism, the assembly line', sess: 'Sessions 16–17', note: 'New systems reshape industrial production and labor; Futurism’s sensory overload.' },
    { a: 1933, b: 1990, name: 'Means of Destruction', tech: 'totalitarian tech, the bomb, Big Science', sess: 'Sessions 18–22', note: 'Nazi/Stalinist ideology, the military-industrial-academic complex, the moon landing.' },
    { a: 1950, b: 2001, name: 'Promises of Global Culture', tech: 'domestic appliances, mass media', sess: 'Sessions 23–25', note: 'Gender and the industrialization of household labor.' },
    { a: 1990, b: 2016, name: 'Dominance of the Digital', tech: 'computers, the internet', sess: 'Sessions 25–27', note: 'Computers: a human history — diversity at the center of the digital.' },
  ];
  function eraAt(y) {
    // pick the era whose midpoint is nearest and that contains y, else nearest
    let best = ERAS[0], bestD = Infinity;
    for (const e of ERAS) {
      if (y >= e.a && y <= e.b) {
        const d = Math.abs(y - (e.a + e.b) / 2);
        if (d < bestD) { bestD = d; best = e; }
      }
    }
    if (bestD === Infinity) {
      for (const e of ERAS) {
        const d = Math.min(Math.abs(y - e.a), Math.abs(y - e.b));
        if (d < bestD) { bestD = d; best = e; }
      }
    }
    return best;
  }
  const Y0 = 1740, Y1 = 2016;
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    const year = Math.round(n('tl-y', 1840));
    setText('tl-yv', year);
    const x0 = 36, x1 = w - 20, span = x1 - x0;
    const xOf = yr => x0 + span * (yr - Y0) / (Y1 - Y0);
    const cur = eraAt(year);

    // era bands stacked
    const top = 40, rowH = 22, gap = 4;
    ctx.textAlign = 'left';
    ERAS.forEach((e, i) => {
      const y = top + i * (rowH + gap);
      const ex0 = xOf(e.a), ex1 = xOf(e.b);
      const active = e === cur;
      ctx.fillStyle = active ? ACCENT_S : 'rgba(138,138,146,0.10)';
      roundRect(ctx, ex0, y, ex1 - ex0, rowH, 4); ctx.fill();
      ctx.strokeStyle = active ? ACCENT : RULE; ctx.lineWidth = active ? 1.6 : 1; ctx.stroke();
      ctx.fillStyle = active ? ACCENT : INK_S;
      ctx.font = (active ? '600 ' : '') + '10px Inter, sans-serif';
      ctx.fillText(e.name, ex0 + 6, y + 15);
    });
    // axis
    const axY = top + ERAS.length * (rowH + gap) + 10;
    ctx.strokeStyle = RULE_H; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, axY); ctx.lineTo(x1, axY); ctx.stroke();
    ctx.fillStyle = MUTED; ctx.font = '9px JetBrains Mono, monospace'; ctx.textAlign = 'center';
    [1750, 1800, 1850, 1900, 1950, 2000].forEach(t => {
      const x = xOf(t);
      ctx.beginPath(); ctx.moveTo(x, axY); ctx.lineTo(x, axY + 4); ctx.stroke();
      ctx.fillText(t, x, axY + 15);
    });
    // lens / playhead
    const px = xOf(year);
    ctx.strokeStyle = ACCENT; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, top - 6); ctx.lineTo(px, axY); ctx.stroke();
    ctx.fillStyle = ACCENT;
    ctx.beginPath(); ctx.arc(px, top - 6, 4, 0, Math.PI * 2); ctx.fill();
    ctx.font = '600 10px JetBrains Mono, monospace';
    ctx.fillText(year, px, top - 12);

    // caption block
    ctx.textAlign = 'left'; ctx.fillStyle = INK; ctx.font = '600 12px Inter, sans-serif';
    let cy = axY + 34;
    ctx.fillText(cur.name + '  (' + cur.a + '–' + cur.b + ')', x0, cy);
    ctx.fillStyle = INK_S; ctx.font = '11.5px Inter, sans-serif';
    wrapText(ctx, cur.note, x0, cy + 17, x1 - x0, 15);

    function roundRect(ctx, x, y, w2, h2, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w2, y, x + w2, y + h2, r);
      ctx.arcTo(x + w2, y + h2, x, y + h2, r);
      ctx.arcTo(x, y + h2, x, y, r);
      ctx.arcTo(x, y, x + w2, y, r);
      ctx.closePath();
    }
    setText('tl-era', cur.name);
    setText('tl-tech', cur.tech);
    setText('tl-sess', cur.sess);
    setText('tl-note', cur.note);
  }
  $('tl-y').addEventListener('input', draw);
  window.addEventListener('resize', draw);
  draw();
})();

// ============================================================
// 5. WHO GAINS, WHO LOSES? — power redistribution bars + Gini
// ============================================================
(function power() {
  const cv = $('cv-power'); if (!cv) return;
  const GROUPS = ['capital owners', 'skilled workers', 'unskilled / displaced', 'colonized / global south'];
  const COLORS = [ACCENT, '#6366F1', WARN, BAD];
  const PRESETS = {
    loom: [78, 22, 8, 5],   // power loom devastated handloom weavers
    rail: [70, 45, 25, 12], // railroad: capital + some labor, displaced others
    home: [40, 30, 55, 15], // domestic appliances: gendered labor reorganized
    comp: [85, 60, 18, 30], // computer: capital + skilled, uneven global gains
  };
  function applyPreset() {
    const p = PRESETS[$('pw-case').value] || PRESETS.loom;
    ['pw-a', 'pw-b', 'pw-c', 'pw-d'].forEach((id, i) => { $(id).value = p[i]; });
  }
  function gini(vals) {
    const x = vals.slice().sort((a, b) => a - b);
    const N = x.length, sum = x.reduce((s, v) => s + v, 0);
    if (sum === 0) return 0;
    let cum = 0;
    for (let i = 0; i < N; i++) cum += (i + 1) * x[i];
    return clamp((2 * cum) / (N * sum) - (N + 1) / N, 0, 1);
  }
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    const vals = [n('pw-a', 70), n('pw-b', 30), n('pw-c', 15), n('pw-d', 10)];
    [['pw-av', 0], ['pw-bv', 1], ['pw-cv', 2], ['pw-dv', 3]].forEach(([id, i]) => setText(id, vals[i]));

    const x0 = 150, top = 36, barMax = w - x0 - 30, rowH = (h - top - 40) / GROUPS.length;
    ctx.textAlign = 'left'; ctx.font = '11px Inter, sans-serif';
    GROUPS.forEach((g, i) => {
      const y = top + i * rowH + rowH * 0.2, bh = rowH * 0.5;
      ctx.fillStyle = INK_S; ctx.textAlign = 'right';
      ctx.fillText(g, x0 - 10, y + bh * 0.7);
      ctx.textAlign = 'left';
      // track
      ctx.fillStyle = 'rgba(138,138,146,0.12)';
      ctx.fillRect(x0, y, barMax, bh);
      // value bar
      const bw = barMax * clamp(vals[i], 0, 100) / 100;
      ctx.fillStyle = COLORS[i]; ctx.fillRect(x0, y, bw, bh);
      ctx.fillStyle = INK; ctx.font = '600 11px JetBrains Mono, monospace';
      ctx.fillText(vals[i], x0 + bw + 6, y + bh * 0.75);
      ctx.font = '11px Inter, sans-serif';
    });
    ctx.fillStyle = INK; ctx.font = '600 12px Inter, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Net benefit captured by each group', x0 - 0, 22);
    ctx.fillStyle = MUTED; ctx.font = '10px Inter, sans-serif';
    ctx.fillText('A new technology does not lift all equally — power is redistributed.', x0 - 140, h - 14);

    const G = gini(vals);
    let label, col;
    if (G < 0.2) { label = 'broadly shared'; col = GOOD; }
    else if (G < 0.45) { label = 'uneven'; col = WARN; }
    else { label = 'highly concentrated'; col = BAD; }
    setText('pw-gini', label + '  (G=' + G.toFixed(2) + ')');
    $('pw-gini').style.color = col;
  }
  ['pw-a', 'pw-b', 'pw-c', 'pw-d'].forEach(id => $(id).addEventListener('input', draw));
  $('pw-case').addEventListener('change', () => { applyPreset(); draw(); });
  $('pw-reset').addEventListener('click', () => { applyPreset(); draw(); });
  window.addEventListener('resize', draw);
  applyPreset(); draw();
})();

// ============================================================
// 6. THE FACTORY CLOCK — Lowell mills labor / surplus
// ============================================================
(function labor() {
  const cv = $('cv-labor'); if (!cv) return;
  const PRICE = 10; // abstract value units per cloth bolt
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    const hours = n('lb-h', 13), rate = n('lb-o', 5), share = n('lb-w', 15);
    setText('lb-hv', hours); setText('lb-ov', rate); setText('lb-wv', share);

    const cloth = hours * rate;
    const value = cloth * PRICE;
    const worker = value * share / 100;
    const owner = value - worker;

    // clock-face: a 24h dial with the working block shaded
    const cx = w * 0.26, cy = h * 0.46, R = Math.min(w * 0.2, h * 0.34);
    ctx.strokeStyle = RULE; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    // shaded working hours (from 5am-ish, clockwise)
    const start = -Math.PI / 2 + (5 / 24) * Math.PI * 2;
    const end = start + (hours / 24) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, start, end); ctx.closePath();
    ctx.fillStyle = ACCENT_S; ctx.fill();
    ctx.strokeStyle = ACCENT; ctx.lineWidth = 1.5; ctx.stroke();
    // ticks
    ctx.fillStyle = MUTED; ctx.font = '8px JetBrains Mono, monospace'; ctx.textAlign = 'center';
    for (let hh = 0; hh < 24; hh += 3) {
      const a = -Math.PI / 2 + (hh / 24) * Math.PI * 2;
      ctx.fillText(hh, cx + (R + 10) * Math.cos(a), cy + (R + 10) * Math.sin(a) + 3);
    }
    ctx.fillStyle = ACCENT; ctx.font = '600 13px JetBrains Mono, monospace';
    ctx.fillText(hours + ' h', cx, cy + 4);
    ctx.fillStyle = MUTED; ctx.font = '10px Inter, sans-serif';
    ctx.fillText('the mill day', cx, cy + R + 26);

    // value split bar on the right
    const bx = w * 0.52, bw = w * 0.42, by = h * 0.30, bh = 40;
    ctx.textAlign = 'left'; ctx.fillStyle = INK; ctx.font = '600 12px Inter, sans-serif';
    ctx.fillText('Value produced per day', bx, by - 14);
    const wWidth = bw * worker / value;
    ctx.fillStyle = GOOD; ctx.fillRect(bx, by, wWidth, bh);
    ctx.fillStyle = ACCENT; ctx.fillRect(bx + wWidth, by, bw - wWidth, bh);
    ctx.strokeStyle = RULE_H; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = '#fff'; ctx.font = '600 10px JetBrains Mono, monospace';
    if (wWidth > 34) { ctx.textAlign = 'center'; ctx.fillText('worker', bx + wWidth / 2, by + bh / 2 + 3); }
    ctx.textAlign = 'center'; ctx.fillText('owner', bx + wWidth + (bw - wWidth) / 2, by + bh / 2 + 3);

    // figures
    ctx.textAlign = 'left'; ctx.fillStyle = INK_S; ctx.font = '11px JetBrains Mono, monospace';
    let ty = by + bh + 26;
    ctx.fillText('bolts of cloth: ' + cloth, bx, ty);
    ctx.fillText('total value: ' + value + ' units', bx, ty + 16);
    ctx.fillStyle = GOOD; ctx.fillText('to worker: ' + worker.toFixed(0) + ' units', bx, ty + 32);
    ctx.fillStyle = ACCENT; ctx.fillText('to owner: ' + owner.toFixed(0) + ' units', bx, ty + 48);
    ctx.textAlign = 'left';

    setText('lb-cloth', cloth + ' bolts');
    setText('lb-ws', worker.toFixed(0) + ' units (' + share + '%)');
    setText('lb-os', owner.toFixed(0) + ' units');
    $('lb-os').style.color = share < 25 ? BAD : share < 50 ? WARN : GOOD;
  }
  ['lb-h', 'lb-o', 'lb-w'].forEach(id => $(id).addEventListener('input', draw));
  window.addEventListener('resize', draw);
  draw();
})();

// ============================================================
// 7. TOOLS OF EMPIRE — radar of imperial capability
// ============================================================
(function empire() {
  const cv = $('cv-empire'); if (!cv) return;
  // each tech contributes to three axes: reach, speed of control, force asymmetry
  const TECH = {
    'em-steam': { reach: 30, speed: 15, force: 20, name: 'steamship & gunboat' },
    'em-rail':  { reach: 35, speed: 20, force: 5,  name: 'railway' },
    'em-tel':   { reach: 10, speed: 45, force: 5,  name: 'telegraph' },
    'em-quin':  { reach: 25, speed: 5,  force: 5,  name: 'quinine' },
    'em-rifle': { reach: 5,  speed: 5,  force: 45, name: 'repeating rifle' },
  };
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    let reach = 0, speed = 0, force = 0;
    const active = [];
    Object.keys(TECH).forEach(id => {
      if ($(id) && $(id).checked) { const t = TECH[id]; reach += t.reach; speed += t.speed; force += t.force; active.push(t.name); }
    });
    reach = clamp(reach, 0, 100); speed = clamp(speed, 0, 100); force = clamp(force, 0, 100);

    // triangular radar
    const cx = w * 0.42, cy = h * 0.52, R = Math.min(w * 0.28, h * 0.36);
    const axes = [
      { k: 'reach', v: reach, label: 'territorial reach', ang: -Math.PI / 2 },
      { k: 'speed', v: speed, label: 'speed of control', ang: -Math.PI / 2 + 2 * Math.PI / 3 },
      { k: 'force', v: force, label: 'force asymmetry', ang: -Math.PI / 2 + 4 * Math.PI / 3 },
    ];
    // grid rings
    ctx.strokeStyle = RULE; ctx.lineWidth = 1;
    [0.33, 0.66, 1].forEach(f => {
      ctx.beginPath();
      axes.forEach((a, i) => {
        const x = cx + R * f * Math.cos(a.ang), y = cy + R * f * Math.sin(a.ang);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath(); ctx.stroke();
    });
    // spokes + labels
    ctx.fillStyle = INK_S; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'center';
    axes.forEach(a => {
      const ex = cx + R * Math.cos(a.ang), ey = cy + R * Math.sin(a.ang);
      ctx.strokeStyle = RULE_H; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
      const lx = cx + (R + 22) * Math.cos(a.ang), ly = cy + (R + 14) * Math.sin(a.ang);
      ctx.fillText(a.label, lx, ly + 3);
    });
    // filled polygon
    ctx.beginPath();
    axes.forEach((a, i) => {
      const f = a.v / 100;
      const x = cx + R * f * Math.cos(a.ang), y = cy + R * f * Math.sin(a.ang);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = ACCENT_S; ctx.fill();
    ctx.strokeStyle = ACCENT; ctx.lineWidth = 2; ctx.stroke();
    axes.forEach(a => {
      const f = a.v / 100;
      const x = cx + R * f * Math.cos(a.ang), y = cy + R * f * Math.sin(a.ang);
      ctx.fillStyle = ACCENT; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    });
    // caption
    ctx.textAlign = 'left'; ctx.fillStyle = MUTED; ctx.font = '10px Inter, sans-serif';
    if (active.length === 0) ctx.fillText('Toggle technologies to assemble imperial capability.', 14, h - 12);
    else ctx.fillText('active: ' + active.join(', '), 14, h - 12);

    const lvl = v => v < 25 ? 'low' : v < 60 ? 'moderate' : 'high';
    setText('em-reach', lvl(reach) + ' (' + reach + ')');
    setText('em-speed', lvl(speed) + ' (' + speed + ')');
    setText('em-force', lvl(force) + ' (' + force + ')');
    $('em-force').style.color = force < 25 ? INK_S : force < 60 ? WARN : BAD;
  }
  Object.keys(TECH).forEach(id => { if ($(id)) $(id).addEventListener('change', draw); });
  window.addEventListener('resize', draw);
  draw();
})();

// ============================================================
// 8. READING SOURCES CRITICALLY (primary vs secondary)
// ============================================================
makeQuiz({
  choicesId: 'src-choices', tagId: 'src-tag', textId: 'src-text',
  fbId: 'src-fb', scoreId: 'src-score', nextId: 'src-next',
  tagWord: 'source', prompt: 'Decide whether this was produced inside the period or written about it later.',
  items: [
    { text: '"I never cared much for the boarding-house bell… We rose at five, breakfasted, and were at our looms by half past six." A Lowell mill girl’s published recollection, 1844.',
      who: 'Lowell Offering',
      answer: 'primary',
      explain: 'A <strong>primary source</strong>: a first-person account made within the period. It is vivid but shaped by the mill’s own publication — watch for what it omits.' },
    { text: 'A 2014 monograph analyzing wage ledgers from the Lowell mills to argue that the "mill girl" image masked harsher conditions for later immigrant workers.',
      answer: 'secondary',
      explain: 'A <strong>secondary / scholarly source</strong>: an analysis written long after, using primary records as evidence. Its strength is synthesis and hindsight.' },
    { text: 'Rudyard Kipling’s poem "The White Man’s Burden" (1899), urging the United States to take up colonial rule in the Philippines.',
      who: 'primary text, Sessions 6–9',
      answer: 'primary',
      explain: 'A <strong>primary source</strong> from the period: it documents imperial ideology directly. Read it as evidence of how empire justified itself, not as neutral fact.' },
    { text: 'Daniel Headrick’s "The Tools of Empire" (1981), arguing that steamships, quinine and breech-loaders enabled the late-19th-century scramble for Africa.',
      who: 'scholarly source',
      answer: 'secondary',
      explain: 'A <strong>secondary source</strong>: a historian’s argument built on many primary documents, advancing an interpretation you can test.' },
    { text: 'A 1925 Ford Motor Company training film demonstrating the assembly line and praising the efficiency of the "Five Dollar Day."',
      answer: 'primary',
      explain: 'A <strong>primary source</strong> — corporate self-presentation from the period. It is excellent evidence of Fordist ideology, precisely because it is promotional.' },
    { text: 'Chapter 7, "The Means of Destruction," from Misa’s Leonardo to the Internet, surveying military technology from 1933 to 1990.',
      who: 'course textbook',
      answer: 'secondary',
      explain: 'The textbook is a <strong>secondary source</strong>: a scholarly synthesis. The course pairs it each week with primary documents you analyze yourself.' },
  ],
});

// ============================================================
// 9. CIVILIZATION & BARBARISM — Benjamin's dialectical scale
// ============================================================
(function dialectic() {
  const cv = $('cv-dialectic'); if (!cv) return;
  const CASES = {
    rail: {
      title: 'the transcontinental railroad',
      civ: 'Bound a continent into one market and nation; an engineering marvel of its age.',
      bar: 'Built on Chinese laborers’ dangerous, underpaid toil and the dispossession of Native nations.',
    },
    light: {
      title: 'electric urban lighting',
      civ: 'Extended the day, made cities legible and safe, dazzled the modern crowd.',
      bar: 'Coal-fired and capital-intensive; deepened surveillance and the divide between lit centers and dark peripheries.',
    },
    ford: {
      title: 'Fordist mass production',
      civ: 'Made cars affordable, raised some wages, defined twentieth-century abundance.',
      bar: 'De-skilled and disciplined labor to the line’s tempo; bodies bent to the machine’s rhythm.',
    },
    moon: {
      title: 'the moon landing',
      civ: 'A staggering feat of "Big Science" and human reach beyond the Earth.',
      bar: 'A product of Cold-War militarism and the military-industrial-academic complex, funded amid deep inequality.',
    },
    digital: {
      title: 'the digital revolution',
      civ: 'Connected the globe, democratized publishing, accelerated knowledge.',
      bar: 'Rests on extractive labor, e-waste and energy/water-hungry data centers; concentrates new power.',
    },
  };
  function draw() {
    const { ctx, w, h } = fitCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    const c = CASES[$('di-case').value] || CASES.rail;
    const a = n('di-a', 50);
    setText('di-av', a);

    // balance beam tilting: more attention to achievement tips left up, but
    // Benjamin's point is the two are bound — the fulcrum never lets either vanish.
    const tilt = (a - 50) / 50 * 0.28; // radians
    const cx = w / 2, cy = 70, beamR = Math.min(w * 0.34, 180);
    // post
    ctx.strokeStyle = RULE_H; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + 70); ctx.stroke();
    // beam
    const lx = cx - beamR * Math.cos(tilt), ly = cy - beamR * Math.sin(tilt);
    const rx = cx + beamR * Math.cos(tilt), ry = cy + beamR * Math.sin(tilt);
    ctx.strokeStyle = INK_S; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx, ry); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
    // pans
    const pan = (x, y, color, label) => {
      ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 16); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath();
      ctx.ellipse(x, y + 22, 26, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color; ctx.font = '600 10px JetBrains Mono, monospace'; ctx.textAlign = 'center';
      ctx.fillText(label, x, y + 26);
    };
    pan(lx, ly, GOOD, 'civ');
    pan(rx, ry, BAD, 'bar');

    // title
    ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.font = '700 14px Inter, sans-serif';
    ctx.fillText(c.title, cx, cy + 96);

    // two columns of text
    ctx.textAlign = 'left'; const colW = (w - 60) / 2;
    let y = cy + 122;
    ctx.fillStyle = GOOD; ctx.font = '600 10px JetBrains Mono, monospace';
    ctx.fillText('DOCUMENT OF CIVILIZATION', 24, y);
    ctx.fillStyle = INK_S; ctx.font = '11px Inter, sans-serif';
    wrapText(ctx, c.civ, 24, y + 16, colW - 10, 14);
    ctx.fillStyle = BAD; ctx.font = '600 10px JetBrains Mono, monospace';
    ctx.fillText('DOCUMENT OF BARBARISM', 36 + colW, y);
    ctx.fillStyle = INK_S; ctx.font = '11px Inter, sans-serif';
    wrapText(ctx, c.bar, 36 + colW, y + 16, colW - 10, 14);

    const civPct = Math.round(100 - a) === 0 ? 1 : 100 - a;
    setText('di-civ', a > 50 ? 'foregrounded' : a < 50 ? 'backgrounded' : 'balanced');
    setText('di-bar', a < 50 ? 'foregrounded' : a > 50 ? 'backgrounded' : 'balanced');
    void civPct;
    let ver, col;
    if (Math.abs(a - 50) <= 8) { ver = 'inseparable — both at once'; col = ACCENT; }
    else if (a > 50) { ver = 'beware the progress-only story'; col = WARN; }
    else { ver = 'don’t erase the achievement'; col = WARN; }
    setText('di-ver', ver); $('di-ver').style.color = col;
  }
  $('di-case').addEventListener('change', draw);
  $('di-a').addEventListener('input', draw);
  window.addEventListener('resize', draw);
  draw();
})();

// ============================================================
// 10. SPOTTING THE DETERMINIST FALLACY
// ============================================================
makeQuiz({
  choicesId: 'fl-choices', tagId: 'fl-tag', textId: 'fl-text',
  fbId: 'fl-fb', scoreId: 'fl-score', nextId: 'fl-next',
  tagWord: 'claim', prompt: "Name the rhetorical move that obscures technology's politics.",
  items: [
    { text: '"The printing press caused the Reformation and the rise of democracy — once movable type existed, the modern world was inevitable."',
      answer: 'determinism',
      explain: '<strong>Technological determinism</strong>: it makes the machine the sole cause and treats social outcomes as automatic, erasing the people and choices in between.' },
    { text: '"Edison single-handedly invented the modern world in his lab; without his genius we’d still be in the dark."',
      answer: 'genius',
      explain: 'The <strong>lone-genius / great-man myth</strong>: it hides the teams, prior art, capital and labor behind invention — exactly what the course resists by not studying "biographies of inventors."' },
    { text: '"Facial-recognition software isn’t good or bad — it’s just a neutral tool. What matters is how people use it."',
      answer: 'neutral',
      explain: 'The <strong>"technology is neutral"</strong> move. Winner’s reply: design choices and required infrastructures already carry politics before any "use."' },
    { text: '"Each new technology has made life better than the one before; the arc of history bends steadily toward progress."',
      answer: 'progress',
      explain: 'A <strong>Whiggish progress narrative</strong>: it reads history as inevitable improvement, ignoring Benjamin’s "document of barbarism" and the losers of each transition.' },
    { text: '"Social media was bound to polarize us — the algorithm decides what we think, and there was nothing anyone could do."',
      answer: 'determinism',
      explain: '<strong>Technological determinism</strong> again: it strips out corporate design decisions, regulation and human agency, presenting an outcome as fated.' },
    { text: '"The steam engine was the achievement of one brilliant tinkerer, James Watt, who gave the Industrial Revolution to the world."',
      answer: 'genius',
      explain: 'The <strong>lone-genius myth</strong>: Watt built on Newcomen, investors and skilled instrument-makers. Crediting one hero obscures the social system that produced the engine.' },
  ],
});
