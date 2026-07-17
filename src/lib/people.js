// The People view: pastoral follow-up grouped by the person a prayer is FOR,
// derived entirely from existing prayer rows (person_name + updates + status +
// per-prayer follow-ups). There is no separate contact database — selecting a
// person just opens their related prayers.

// How many distinct people make the view worth revealing. Below this the
// Journal stays exactly as it is — the control never renders.
export const MIN_PEOPLE_FOR_VIEW = 2;

const norm = (name) => (name || '').trim().toLowerCase();

// Group prayers by person. Returns [{ name, prayers, activeCount,
// answeredCount, latestUpdate, nextFollowUp }] — people with the most active
// requests first (ties: alphabetical). `followUps` is followUpStore's map
// ({ prayerId: { date, status } }); pending dates surface as nextFollowUp.
export function peopleFromPrayers(prayers, followUps = {}) {
  const byPerson = new Map();
  for (const p of prayers || []) {
    const key = norm(p.person_name);
    if (!key || p._locked) continue;
    if (!byPerson.has(key)) byPerson.set(key, { name: p.person_name.trim(), prayers: [] });
    byPerson.get(key).prayers.push(p);
  }

  const people = [...byPerson.values()].map(({ name, prayers: list }) => {
    let latestUpdate = null;
    let nextFollowUp = null;
    for (const p of list) {
      for (const u of p.prayer_updates || []) {
        if (!latestUpdate || new Date(u.created_at) > new Date(latestUpdate.created_at)) latestUpdate = u;
      }
      const fu = followUps[p.id];
      if (fu?.status === 'pending' && fu.date && (!nextFollowUp || fu.date < nextFollowUp)) {
        nextFollowUp = fu.date;
      }
    }
    return {
      name,
      prayers: list,
      activeCount: list.filter((p) => p.status === 'active').length,
      answeredCount: list.filter((p) => p.status === 'answered').length,
      latestUpdate,
      nextFollowUp,
    };
  });

  return people.sort((a, b) => b.activeCount - a.activeCount || a.name.localeCompare(b.name));
}

// Reveal the People option only when there is enough person data to be useful.
export function peopleViewAvailable(prayers) {
  const names = new Set();
  for (const p of prayers || []) {
    const key = norm(p.person_name);
    if (key && !p._locked) names.add(key);
    if (names.size >= MIN_PEOPLE_FOR_VIEW) return true;
  }
  return false;
}
