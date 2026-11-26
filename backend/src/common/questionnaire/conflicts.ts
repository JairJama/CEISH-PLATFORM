export type QuestionnaireAnswers = Record<string, string | string[]>;

const TITLES = new Set([
  "od",
  "dra",
  "dr",
  "ing",
  "abg",
  "sra",
  "sr",
  "lcd",
  "lcda",
  "mg",
  "mgs",
  "phd",
]);

export function normalizePersonName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !TITLES.has(token))
    .join(" ")
    .trim();
}

export function questionnaireConflictMembers(
  questionnaire: QuestionnaireAnswers,
): string[] {
  const raw = questionnaire.q4;
  const selections = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? [raw]
      : [];
  const other = questionnaire.q4_other;
  if (typeof other === "string" && other.trim()) selections.push(other);
  return selections
    .filter((value) => value.trim().toUpperCase() !== "NO APLICA")
    .map(normalizePersonName)
    .filter((value) => value.length >= 5);
}

export function isConflictedMember(
  memberName: string,
  conflictMembers: string[],
): boolean {
  const normalized = normalizePersonName(memberName);
  if (normalized.length < 5) return false;
  return conflictMembers.some(
    (conflict) =>
      conflict.includes(normalized) || normalized.includes(conflict),
  );
}
