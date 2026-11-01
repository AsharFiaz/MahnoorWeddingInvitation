/* events.js — a tiny emitter whose emit() collects return values.
 *
 * From spring-bloom (js/events.js, MIT, Abdelrahman Shaaban 2026), unchanged.
 * The collecting is the point: before a page turns the book emits
 * `beforeTurn` and a listener that needs time first (the pop-up pieces fold
 * flat) answers with a delay in seconds; the turn waits for the largest.
 */

export function createEvents() {
  const lists = new Map();

  function on(name, fn) {
    if (!lists.has(name)) lists.set(name, []);
    lists.get(name).push(fn);
    return () => off(name, fn);
  }

  function off(name, fn) {
    const list = lists.get(name);
    if (!list) return;
    const i = list.indexOf(fn);
    if (i >= 0) list.splice(i, 1);
  }

  function emit(name, payload) {
    const list = lists.get(name);
    const out = [];
    if (!list) return out;
    for (const fn of list.slice()) {
      const r = fn(payload);
      if (r !== undefined) out.push(r);
    }
    return out;
  }

  return { on, off, emit };
}
