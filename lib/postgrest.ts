/**
 * Builds a quoted `ilike` value for a PostgREST `.or()` filter string so user
 * input cannot add filter conditions or break the query: LIKE wildcards are
 * escaped, then the value is wrapped in double quotes with `"` and `\` escaped.
 *
 *   query.or(`name.ilike.${ilikeContains(term)},email.ilike.${ilikeContains(term)}`)
 */
export function ilikeContains(term: string): string {
  const likeEscaped = term.replace(/[\\%_]/g, (c) => `\\${c}`);
  const quoted = `%${likeEscaped}%`.replace(/[\\"]/g, (c) => `\\${c}`);
  return `"${quoted}"`;
}
