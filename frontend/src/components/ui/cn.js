/**
 * Minimal class name joiner.
 * Falsy values are dropped so conditional styling stays readable in JSX.
 */
export function cx(...parts) {
  let out = '';
  for (const part of parts) {
    if (!part) continue;
    if (typeof part === 'string') {
      out += (out ? ' ' : '') + part;
    } else if (Array.isArray(part)) {
      const nested = cx(...part);
      if (nested) out += (out ? ' ' : '') + nested;
    } else if (typeof part === 'object') {
      for (const key of Object.keys(part)) {
        if (part[key]) out += (out ? ' ' : '') + key;
      }
    }
  }
  return out;
}

export default cx;
