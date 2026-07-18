export const TELCO_SLUGS: Record<string, string> = {
  "globe-tm": "Globe/TM",
  "smart-tnt": "Smart/TNT",
  dito: "DITO",
  sun: "Sun",
};

export function telcoToSlug(telco: string): string {
  const entry = Object.entries(TELCO_SLUGS).find(([, name]) => name === telco);
  return entry?.[0] ?? telco.toLowerCase();
}

export function e164ToSlug(e164: string): string {
  return e164.startsWith("+63") ? `0${e164.slice(3)}` : e164.slice(1);
}
