export interface AmfiSearchScheme {
  schemeCode: number;
  schemeName: string;
}

const NOISE_WORDS = new Set([
  "direct",
  "regular",
  "plan",
  "growth",
  "idcw",
  "dividend",
  "payout",
  "reinvestment",
  "option",
  "fund",
  "mutual",
  "scheme",
]);

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function coreTokens(text: string): string[] {
  return tokenize(text).filter((w) => !NOISE_WORDS.has(w));
}

function normalizeName(text: string): string {
  return tokenize(text).join(" ");
}

/**
 * Scores an AMFI scheme candidate against a user query so that
 * "Navi Nifty 50 Index Fund" / "Navi Nifty 50 Index Fund - Direct Plan - Growth"
 * reliably beats sibling funds like "Navi Nifty 500 Multicap 50:25:25 Index Fund"
 * or "Navi Nifty Next 50 Index Fund" or Regular plans.
 */
export function scoreMutualFundScheme(schemeName: string, query: string): number {
  const normScheme = normalizeName(schemeName);
  const normQuery = normalizeName(query);
  if (!normScheme) return -1000;
  if (normScheme === normQuery) return 10000;

  const qCore = coreTokens(query);
  const sCore = coreTokens(schemeName);
  const sCoreSet = new Set(sCore);
  const qCoreSet = new Set(qCore);

  let score = 0;

  // 1. Core token matches & missing penalty
  for (const token of qCore) {
    if (sCoreSet.has(token)) {
      score += 30;
    } else {
      score -= 40;
    }
  }

  // 2. Penalize extra core words in the candidate (e.g. "500", "multicap", "next", "midcap")
  for (const token of sCore) {
    if (!qCoreSet.has(token)) {
      score -= 18;
    }
  }

  // 3. Plan preference: Regular only if explicitly requested, otherwise strongly prefer Direct
  const sLower = schemeName.toLowerCase();
  const wantsRegular = /\bregular\b/i.test(query);
  const isSchemeDirect = /\bdirect\b/i.test(sLower);
  const isSchemeRegular = /\bregular\b/i.test(sLower);

  if (wantsRegular) {
    if (isSchemeRegular) score += 25;
    if (isSchemeDirect) score -= 25;
  } else {
    if (isSchemeDirect) score += 25;
    if (isSchemeRegular) score -= 25;
  }

  // 4. Option preference: IDCW/Dividend only if requested, otherwise prefer Growth
  const wantsIdcw = /\b(idcw|dividend)\b/i.test(query);
  const isSchemeGrowth = /\bgrowth\b/i.test(sLower);
  const isSchemeIdcw = /\b(idcw|dividend)\b/i.test(sLower);

  if (wantsIdcw) {
    if (isSchemeIdcw) score += 20;
    if (isSchemeGrowth) score -= 20;
  } else {
    if (isSchemeGrowth) score += 20;
    if (isSchemeIdcw) score -= 20;
  }

  return score;
}

export function rankMutualFundSchemes<T extends AmfiSearchScheme>(schemes: T[], query: string): T[] {
  if (!Array.isArray(schemes) || schemes.length === 0) return [];
  return [...schemes].sort(
    (a, b) => scoreMutualFundScheme(b.schemeName, query) - scoreMutualFundScheme(a.schemeName, query)
  );
}

export function pickBestMutualFundScheme<T extends AmfiSearchScheme>(
  schemes: T[],
  query: string
): T | null {
  const ranked = rankMutualFundSchemes(schemes, query);
  return ranked[0] ?? null;
}
