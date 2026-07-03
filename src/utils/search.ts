// ============================================================
// Nexova — Search operations
// Linear search (unsorted) and binary search (sorted) utilities
// ============================================================

import type { Candidate } from "../types/models.js";

/**
 * Linear search: finds a candidate by their ID.
 * Returns the candidate if found, null otherwise.
 */
export function findCandidateById(
  candidates: Candidate[],
  id: string
): Candidate | null {
  for (const candidate of candidates) {
    if (candidate.id === id) return candidate;
  }
  return null;
}

/**
 * Linear search: finds a candidate by their email.
 * Comparison is case-insensitive.
 * Returns the candidate if found, null otherwise.
 */
export function findCandidateByEmail(
  candidates: Candidate[],
  email: string
): Candidate | null {
  const lowerEmail = email.toLowerCase();

  for (const candidate of candidates) {
    if (candidate.email.toLowerCase() === lowerEmail) return candidate;
  }
  return null;
}

/**
 * Binary search: finds the index of a candidate by expected salary.
 * Assumes the array is pre-sorted by expectedSalary in ascending order.
 * Returns the index if found, -1 otherwise.
 */
export function binarySearchCandidateBySalary(
  sortedCandidates: Candidate[],
  targetSalary: number
): number {
  let left = 0;
  let right = sortedCandidates.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midSalary = sortedCandidates[mid].expectedSalary;

    if (midSalary === targetSalary) {
      return mid;
    }

    if (midSalary < targetSalary) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}
