/**
 * Compares what a vendor typed with the record Korapay returns for a NIN.
 *
 * Rules (strict on purpose — this gates payouts):
 *  - Surname: every word must match the NIN surname, and nothing missing.
 *  - First name: every word typed must be a whole word of the NIN first name.
 *  - Middle name: optional; if typed, every word must be a whole word of the
 *    NIN middle (or first) name.
 *  - Date of birth: must be the same day.
 * Case, accents, extra spaces, hyphens and apostrophes are ignored.
 * Whole words only: "ADE" does not match "ADEBAYO".
 */

export interface EnteredName {
  firstName: string
  middleName?: string
  lastName: string
}

export interface NinRecord {
  firstName: string
  middleName: string
  lastName: string
  /** Used only when the provider gives no separate parts. */
  fullName: string
  /** As returned by the provider; any common format. */
  dateOfBirth: string
}

export type NinField = "surname" | "first name" | "middle name" | "date of birth"

export function nameWords(value: string | null | undefined): string[] {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/['’`]/g, "")
    .replace(/[^A-Z]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
}

const MONTHS: Record<string, string> = {
  JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
  JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
}

/** Normalises a date to YYYY-MM-DD, or "" if it can't be read. Day-first, as on Nigerian IDs. */
export function normaliseDob(value: string | null | undefined): string {
  const v = (value ?? "").trim()
  let m = v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`
  m = v.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`
  m = v.match(/^(\d{1,2})[-/. ]([A-Za-z]{3})[A-Za-z]*[-/. ,]+(\d{4})$/)
  if (m && MONTHS[m[2].toUpperCase()]) return `${m[3]}-${MONTHS[m[2].toUpperCase()]}-${m[1].padStart(2, "0")}`
  return ""
}

const subset = (words: string[], of: string[]) => words.length > 0 && words.every((w) => of.includes(w))
const sameWords = (a: string[], b: string[]) => a.length === b.length && subset(a, b) && subset(b, a)

/** Returns the fields that don't match, in the order a person reads the form. Empty = verified. */
export function compareNinDetails(entered: EnteredName, enteredDob: string, record: NinRecord): NinField[] {
  const wrong: NinField[] = []
  const first = nameWords(entered.firstName)
  const middle = nameWords(entered.middleName)
  const last = nameWords(entered.lastName)

  const rFirst = nameWords(record.firstName)
  const rMiddle = nameWords(record.middleName)
  const rLast = nameWords(record.lastName)

  if (rLast.length > 0 && rFirst.length > 0) {
    if (!sameWords(last, rLast)) wrong.push("surname")
    if (!subset(first, rFirst)) wrong.push("first name")
    if (middle.length > 0 && !subset(middle, [...rMiddle, ...rFirst])) wrong.push("middle name")
  } else {
    // Provider gave one full-name string: still whole words, all must be present.
    const full = nameWords(record.fullName)
    if (!subset(last, full)) wrong.push("surname")
    if (!subset(first, full)) wrong.push("first name")
    if (middle.length > 0 && !subset(middle, full)) wrong.push("middle name")
  }

  const dob = normaliseDob(enteredDob)
  if (!dob || dob !== normaliseDob(record.dateOfBirth)) wrong.push("date of birth")
  return wrong
}

/** "Your surname doesn't match…" / "Your first name and date of birth don't match…" */
export function mismatchMessage(fields: NinField[]): string {
  const list =
    fields.length === 1
      ? fields[0]
      : `${fields.slice(0, -1).join(", ")} and ${fields[fields.length - 1]}`
  const verb = fields.length === 1 ? "doesn't" : "don't"
  return `Your ${list} ${verb} match the details on this NIN. Enter ${fields.length === 1 ? "it" : "them"} exactly as on your NIN slip.`
}

/**
 * Is a bank account in the NIN-verified person's name? Banks order and
 * shorten names differently, so order doesn't matter, but at least two whole
 * words must match (or every word, for a one-word name).
 */
export function bankNameMatches(accountName: string, legalName: string): boolean {
  const account = nameWords(accountName)
  const legal = nameWords(legalName)
  if (account.length === 0 || legal.length === 0) return false
  const shared = new Set(account.filter((w) => legal.includes(w))).size
  return shared >= Math.min(2, legal.length, account.length)
}
