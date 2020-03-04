
export const match = (s, m) => s.indexOf(m) > -1;

let subscriptions = Object.create(null);

export function subscribe(evt, func) {
  if (typeof func !== 'function') {
    throw 'Subscribers must be functions';
  }
  const oldSubscriptions = subscriptions[evt] || [];
  oldSubscriptions.push(func);
  subscriptions[evt] = oldSubscriptions;
}

export function publish(evt) {
  let args = Array.prototype.slice.call(arguments, 1);
  const subFunctions = subscriptions[evt] || [];
  for (let i = 0; i < subFunctions.length; i++) {
    subFunctions[i].apply(null, args);
  }
}

export function unsubscribe(evt, func) {
  const oldSubscriptions = subscriptions[evt] || [];
  const newSubscriptions = oldSubscriptions.filter(item => item !== func);
  subscriptions[evt] = newSubscriptions;
}

export function cancel(evt) {
  delete subscriptions[evt];
}

export function cl(...styleRules) {
  return styleRules.filter(Boolean).join(' ');
}

export function toLw(str) {
  if (typeof str === 'string') return str.toLowerCase();
  return str;
}

export function noop() {}