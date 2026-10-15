/* eslint-env browser */
// The plan review page's own script, embedded verbatim by planReviewHtml.mjs.
// It runs offline in the reviewer's browser: it renders the packet, keeps the
// reviewer's work in this browser, and downloads their review as a JSON file.
// Nothing is sent anywhere. Everything is built with DOM APIs and textContent,
// never innerHTML, because the packet holds translated prose.
(function reviewPage() {
  const data = JSON.parse(document.getElementById('review-data').textContent);
  const app = document.getElementById('app');
  const storageKey = `qetoret-plan-review:${data.lang}:${data.plans.map((p) => p.fingerprint.overlayHash.slice(0, 12)).join('.')}`;
  const SEVERITY = { critical: 'Must fix', error: 'Problem', warning: 'Check' };
  const RECORD = { 'needs-review': 'Not reviewed yet', 'legacy-owner-approved': 'Served before reviews existed (not a native review)', 'human-reviewed': 'Reviewed' };

  // --- State ------------------------------------------------------------------
  const localToday = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const emptyState = () => ({
    reviewer: { name: '', reviewedAt: localToday(), nativeSpeaker: false, christianReview: false, tradition: '' },
    terminologyNotes: '',
    showFrench: false,
    plans: {},
  });
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      return saved && saved.reviewer ? { ...emptyState(), ...saved } : emptyState();
    } catch { return emptyState(); }
  }
  const state = load();
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* private mode: work stays in the open page */ }
    refreshStatus();
  }
  const planState = (planId) => {
    state.plans[planId] = state.plans[planId] || { scores: {}, accepted: {}, suggestions: {}, notes: '' };
    return state.plans[planId];
  };

  // --- DOM helpers -------------------------------------------------------------
  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    const { className, text, attrs, on } = props;
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    for (const [name, value] of Object.entries(attrs || {})) if (value !== undefined && value !== false) node.setAttribute(name, value === true ? '' : value);
    for (const [event, handler] of Object.entries(on || {})) node.addEventListener(event, handler);
    for (const child of children.flat()) if (child !== null && child !== undefined && child !== false) node.append(child);
    return node;
  }
  const humanize = (code) => code.charAt(0) + code.slice(1).toLowerCase().replace(/_/g, ' ');
  const issueKey = (issue) => `${issue.code}@${issue.location}`;

  // Wrap the first occurrence of each finding's excerpt in <mark>.
  function highlighted(text, excerpts) {
    const fragment = document.createDocumentFragment();
    const needle = excerpts.map((e) => e.replace(/^[“"]|[”"]$|…$/g, '').trim()).find((e) => e && text.toLowerCase().includes(e.toLowerCase()));
    if (!needle) { fragment.append(text); return fragment; }
    const at = text.toLowerCase().indexOf(needle.toLowerCase());
    fragment.append(text.slice(0, at), el('mark', { text: text.slice(at, at + needle.length) }), text.slice(at + needle.length));
    return fragment;
  }

  // --- Sections ----------------------------------------------------------------
  function intro() {
    const count = data.plans.length;
    return el('header', { className: 'intro' },
      el('p', { className: 'eyebrow', text: 'Qetoret · prayer-plan review' }),
      el('h1', { text: `${data.languageName} translations` }),
      el('p', { text: `${count} plan${count === 1 ? '' : 's'} · page generated ${data.generatedAt.slice(0, 10)}. Nothing on this page is sent anywhere: your answers stay in this browser until you download them.` }),
      el('ol', { className: 'steps' },
        el('li', { text: `Fill in your details. Your review only counts if you are a native speaker of ${data.languageName} and you read as a Christian.` }),
        el('li', { text: `Open each plan and read it day by day: English on the left, ${data.languageName} on the right. Ask one question: would a faithful Christian who speaks ${data.languageName} naturally write or pray it this way?` }),
        el('li', { text: 'Highlighted passages are automatic findings. They are hints, not verdicts: if one is fine here, tick "Acceptable here" and say why.' }),
        el('li', { text: 'Suggest better wording wherever you would change something, then score the six areas from 0 to 5.' }),
        el('li', { text: 'Click "Download my review" and send the file back. You can stop and come back: progress is saved in this browser.' })));
  }

  function reviewerCard() {
    const r = state.reviewer;
    const bind = (key, read) => (event) => { r[key] = read(event.target); save(); };
    const value = (target) => target.value;
    const checked = (target) => target.checked;
    return el('section', { className: 'card', attrs: { 'aria-labelledby': 'reviewer-title' } },
      el('h2', { text: 'About you', attrs: { id: 'reviewer-title' } }),
      el('div', { className: 'grid' },
        el('label', {}, 'Your name', el('input', { attrs: { type: 'text', value: r.name, autocomplete: 'name', required: true }, on: { input: bind('name', value) } })),
        el('label', {}, 'Date of your review', el('input', { attrs: { type: 'date', value: r.reviewedAt, required: true }, on: { input: bind('reviewedAt', value) } })),
        el('label', {}, 'Your church tradition (optional)',
          el('select', { on: { change: bind('tradition', value) } },
            el('option', { text: 'Prefer not to say', attrs: { value: '' } }),
            data.traditions.map((t) => el('option', { text: t, attrs: { value: t, selected: r.tradition === t } }))))),
      el('label', { className: 'check' }, el('input', { attrs: { type: 'checkbox', checked: r.nativeSpeaker }, on: { change: bind('nativeSpeaker', checked) } }),
        `${data.languageName} is my native language.`),
      el('label', { className: 'check' }, el('input', { attrs: { type: 'checkbox', checked: r.christianReview }, on: { change: bind('christianReview', checked) } }),
        'I am reviewing as a Christian, for how Christians in my language speak and pray.'));
  }

  function scoringGuide() {
    const t = data.thresholds;
    return el('details', { className: 'card' },
      el('summary', { text: 'How to score (0 to 5)' }),
      el('ul', { className: 'scale' }, data.scale.map(([score, meaning]) => el('li', {}, el('strong', { text: String(score) }), ` ${meaning}`))),
      el('dl', { className: 'dimensions' }, data.dimensions.flatMap((d) => [
        el('dt', { text: d.label + (d.critical ? ' (critical)' : '') }), el('dd', { text: d.guide }),
      ])),
      el('p', { className: 'muted', text: `A translation is published only with an overall average of at least ${t.minimumOverall}, each critical area at least ${t.minimumDimension}, and nothing below ${t.floorDimension}. A serious safety or theology problem stops publication whatever the scores.` }));
  }

  function terminology() {
    const g = data.glossary;
    return el('details', { className: 'card' },
      el('summary', { text: `Christian terminology for ${data.languageName} (${g.status === 'draft' ? 'AI draft — your corrections are welcome' : 'approved'})` }),
      el('p', { className: 'muted', text: `Register: ${g.profile.christianRegister}. Prayer: ${g.profile.prayerRegister}. Reader addressed as “${g.profile.readerAddress}”, God as “${g.profile.godAddress}”.` }),
      el('div', { className: 'table-wrap' },
        el('table', {},
          el('thead', {}, el('tr', {}, ['Concept', 'Preferred', 'Also fine', 'Avoid', 'Example'].map((h) => el('th', { text: h })))),
          el('tbody', {}, g.terms.map((term) => el('tr', {},
            el('td', { text: term.concept }),
            el('td', { text: term.preferred, attrs: { lang: data.lang } }),
            el('td', { text: term.allowed.join(', '), attrs: { lang: data.lang } }),
            el('td', { text: term.avoid.join(', '), attrs: { lang: data.lang } }),
            el('td', { text: term.example, attrs: { lang: data.lang } })))))),
      el('label', {}, 'Terminology feedback (optional): which words would Christians in your language use instead?',
        el('textarea', { text: state.terminologyNotes, attrs: { rows: 3 }, on: { input: (e) => { state.terminologyNotes = e.target.value; save(); } } })));
  }

  // --- One plan --------------------------------------------------------------------
  const scoredChips = new Map();

  function findingsBox(plan) {
    if (!plan.issues.length) return el('p', { className: 'muted', text: 'No automatic findings for this translation.' });
    const ps = planState(plan.planId);
    return el('section', { className: 'findings' },
      el('h4', { text: `Automatic findings (${plan.issues.length})` }),
      el('ul', {}, plan.issues.map((issue) => {
        const key = issueKey(issue);
        const reason = el('input', {
          attrs: { type: 'text', placeholder: 'Why it is fine here', value: ps.accepted[key] || '', 'aria-label': `Reason: ${humanize(issue.code)}`, disabled: !(key in ps.accepted) },
          on: { input: (e) => { ps.accepted[key] = e.target.value; save(); } },
        });
        const toggle = el('input', {
          attrs: { type: 'checkbox', checked: key in ps.accepted },
          on: { change: (e) => { if (e.target.checked) ps.accepted[key] = ps.accepted[key] || ''; else delete ps.accepted[key]; reason.disabled = !e.target.checked; save(); } },
        });
        return el('li', { className: `finding ${issue.severity}` },
          el('span', { className: 'badge', text: SEVERITY[issue.severity] }),
          el('strong', { text: ` ${humanize(issue.code)}` }),
          el('span', { className: 'muted', text: ` · ${issue.where}` }),
          el('p', { text: issue.message }),
          issue.severity === 'critical' ? el('p', { className: 'muted', text: 'Only accept this if the automatic check misread the sentence.' }) : null,
          el('label', { className: 'check' }, toggle, 'Acceptable here'),
          reason);
      })));
  }

  function textRow(plan, row) {
    const ps = planState(plan.planId);
    const excerpts = plan.issues.filter((i) => i.location === row.location && i.excerpt).map((i) => i.excerpt);
    const flagged = plan.issues.filter((i) => i.location === row.location);
    const suggestion = el('textarea', {
      text: ps.suggestions[row.location] || '',
      attrs: { rows: 3, lang: data.lang, dir: data.rtl ? 'rtl' : 'ltr', 'aria-label': `Suggested wording: ${row.label}` },
      on: { input: (e) => { if (e.target.value.trim()) ps.suggestions[row.location] = e.target.value; else delete ps.suggestions[row.location]; save(); } },
    });
    const suggest = el('details', { className: 'suggest', attrs: { open: Boolean(ps.suggestions[row.location]) } }, el('summary', { text: 'Suggest better wording' }), suggestion);
    return el('div', { className: 'row' },
      el('div', { className: 'source' },
        el('span', { className: 'label', text: `${row.label} · English` }),
        el('p', { text: row.source, attrs: { lang: 'en' } }),
        row.sourceFr ? el('p', { className: 'source-fr', text: row.sourceFr, attrs: { lang: 'fr' } }) : null),
      el('div', { className: `translation${flagged.length ? ' flagged' : ''}`, attrs: { lang: data.lang, dir: data.rtl ? 'rtl' : 'ltr' } },
        el('span', { className: 'label', text: data.languageName }),
        row.translation === null
          ? el('p', { className: 'muted', text: 'Not translated: readers see the English here.', attrs: { lang: 'en', dir: 'ltr' } })
          : el('p', {}, highlighted(row.translation, excerpts)),
        flagged.length ? el('p', { className: 'flags', attrs: { lang: 'en', dir: 'ltr' } }, flagged.map((i) => el('span', { className: `badge ${i.severity}`, text: humanize(i.code) }))) : null,
        suggest));
  }

  function scoreCard(plan) {
    const ps = planState(plan.planId);
    return el('section', { className: 'scores' },
      el('h4', { text: 'Your scores for this plan' }),
      data.dimensions.map((d) => el('fieldset', {},
        el('legend', {}, d.label, d.critical ? el('span', { className: 'badge critical-dim', text: 'critical' }) : null),
        el('p', { className: 'muted', text: d.guide }),
        el('div', { className: 'choices' }, data.scale.slice().reverse().map(([score, meaning]) => el('label', { attrs: { title: meaning } },
          el('input', {
            attrs: { type: 'radio', name: `${plan.planId}-${d.id}`, value: String(score), checked: ps.scores[d.id] === score },
            on: { change: () => { ps.scores[d.id] = score; save(); } },
          }),
          String(score)))))),
      el('label', {}, 'Anything else the editors should know (optional)',
        el('textarea', { text: ps.notes, attrs: { rows: 3 }, on: { input: (e) => { ps.notes = e.target.value; save(); } } })));
  }

  function planSection(plan, index) {
    const chip = el('span', { className: 'badge' });
    scoredChips.set(plan.planId, chip);
    return el('details', { className: 'plan card', attrs: { id: `plan-${plan.planId}`, open: index === 0 } },
      el('summary', {},
        el('span', { className: 'plan-title', text: plan.title, attrs: { lang: data.lang } }),
        plan.title !== plan.titleSource ? el('span', { className: 'muted', text: ` (${plan.titleSource})` }) : null,
        el('span', { className: 'meta' },
          el('span', { className: `badge ${plan.served ? 'served' : 'hidden'}`, text: plan.served ? 'Shown to readers' : 'Not shown to readers yet' }),
          el('span', { className: 'badge', text: RECORD[plan.recordStatus] + (plan.reviewedBy ? ` by ${plan.reviewedBy}` : '') }),
          chip)),
      findingsBox(plan),
      plan.general.length ? el('section', {}, el('h3', { text: plan.biblicalRef ? `About this plan · ${plan.biblicalRef}` : 'About this plan' }), plan.general.map((row) => textRow(plan, row))) : null,
      plan.days.map((day) => el('section', { className: 'day' },
        el('h3', {}, `Day ${day.number}`, day.theme ? el('span', { text: ` · ${day.theme}`, attrs: { lang: data.lang } }) : null),
        el('p', { className: 'muted', text: [day.themeSource, day.ref].filter(Boolean).join(' · ') }),
        day.fields.map((row) => textRow(plan, row)))),
      scoreCard(plan));
  }

  // --- Status, validation, download ------------------------------------------------
  const scoredCount = (planId) => Object.keys(planState(planId).scores).length;
  const isComplete = (planId) => scoredCount(planId) === data.dimensions.length;
  const hasInput = (planId) => {
    const ps = planState(planId);
    return scoredCount(planId) > 0 || Object.keys(ps.suggestions).length > 0 || Object.keys(ps.accepted).length > 0 || ps.notes.trim();
  };

  function problems() {
    const r = state.reviewer;
    const list = [];
    if (!r.name.trim()) list.push('Add your name.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.reviewedAt)) list.push('Add the date of your review.');
    if (!r.nativeSpeaker || !r.christianReview) list.push(`Confirm both statements about yourself: a review counts only from a native ${data.languageName} speaker reading as a Christian.`);
    for (const plan of data.plans) {
      const missing = Object.entries(planState(plan.planId).accepted).filter(([, reason]) => !reason.trim());
      if (missing.length) list.push(`${plan.title}: say why each accepted finding is fine.`);
    }
    if (!data.plans.some((plan) => hasInput(plan.planId))) list.push('Score or comment on at least one plan.');
    return list;
  }

  const status = el('p', { className: 'status', attrs: { role: 'status' } });
  const message = el('div', { className: 'message', attrs: { 'aria-live': 'polite' } });

  function refreshStatus() {
    const complete = data.plans.filter((plan) => isComplete(plan.planId)).length;
    status.textContent = `Scored: ${complete} of ${data.plans.length} plan${data.plans.length === 1 ? '' : 's'}`;
    for (const plan of data.plans) {
      const chip = scoredChips.get(plan.planId);
      const n = scoredCount(plan.planId);
      chip.textContent = n === data.dimensions.length ? 'Scored ✓' : `Scored ${n}/${data.dimensions.length}`;
      chip.className = `badge ${n === data.dimensions.length ? 'done' : ''}`;
    }
  }

  function reviewFile() {
    const r = state.reviewer;
    return {
      kind: 'qetoret-plan-review',
      version: 1,
      lang: data.lang,
      pageGeneratedAt: data.generatedAt,
      submittedAt: new Date().toISOString(),
      reviewer: { name: r.name.trim(), reviewedAt: r.reviewedAt, nativeSpeaker: r.nativeSpeaker, christianReview: r.christianReview, ...(r.tradition ? { tradition: r.tradition } : {}) },
      terminologyNotes: state.terminologyNotes.trim(),
      reviews: data.plans.filter((plan) => hasInput(plan.planId)).map((plan) => {
        const ps = planState(plan.planId);
        return {
          planId: plan.planId,
          ...plan.fingerprint,
          scores: isComplete(plan.planId) ? { ...ps.scores } : null,
          acceptedIssues: Object.entries(ps.accepted).map(([key, reason]) => {
            const [code, location] = key.split('@');
            return { code, location, reason: reason.trim() };
          }),
          suggestions: Object.entries(ps.suggestions).map(([location, text]) => ({ location, text: text.trim() })),
          notes: ps.notes.trim(),
        };
      }),
    };
  }

  function download() {
    const list = problems();
    message.replaceChildren();
    if (list.length) {
      message.className = 'message error';
      message.append(el('ul', {}, list.map((p) => el('li', { text: p }))));
      return;
    }
    const file = reviewFile();
    const slug = file.reviewer.name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'reviewer';
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(file, null, 2)}\n`], { type: 'application/json' }));
    const link = el('a', { attrs: { href: url, download: `${data.lang}-plan-review-${file.reviewer.reviewedAt}-${slug}.json` } });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    const unscored = file.reviews.filter((review) => !review.scores).length;
    message.className = 'message ok';
    message.textContent = `Downloaded. Send the file back to the Qetoret team.${unscored ? ` ${unscored} plan${unscored === 1 ? ' has' : 's have'} suggestions but no complete scores: they will be read, not counted as a review.` : ''}`;
  }

  function clearAll() {
    if (!window.confirm('Clear all your answers on this page? This cannot be undone.')) return;
    try { localStorage.removeItem(storageKey); } catch { /* nothing stored */ }
    window.location.reload();
  }

  // --- Mount -------------------------------------------------------------------------
  document.body.classList.toggle('show-fr', state.showFrench);
  const frenchToggle = el('label', { className: 'check' },
    el('input', { attrs: { type: 'checkbox', checked: state.showFrench }, on: { change: (e) => { state.showFrench = e.target.checked; document.body.classList.toggle('show-fr', state.showFrench); save(); } } }),
    'Also show the French source');
  app.replaceChildren(
    intro(),
    reviewerCard(),
    scoringGuide(),
    terminology(),
    el('div', { className: 'toolbar' }, frenchToggle),
    ...data.plans.map(planSection),
    el('footer', { className: 'bar' }, status,
      el('button', { className: 'secondary', text: 'Clear my answers', attrs: { type: 'button' }, on: { click: clearAll } }),
      el('button', { text: 'Download my review', attrs: { type: 'button' }, on: { click: download } }),
      message));
  refreshStatus();
}());
