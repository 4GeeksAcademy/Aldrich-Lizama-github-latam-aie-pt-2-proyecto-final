// ============================================================
// Nexova — Collection operations
// Filtering, sorting and grouping utilities for Candidate arrays
// ============================================================

import type {
  Candidate,
  SeniorityLevel,
  AvailabilityStatus,
} from "../types/models.js";

/**
 * Filters candidates that have ALL of the required skills.
 * Skill matching is case-insensitive.
 */
export function filterCandidatesBySkills(
  candidates: Candidate[],
  requiredSkills: string[]
): Candidate[] {
  if (requiredSkills.length === 0) return [];

  const lowerRequired = requiredSkills.map((s) => s.toLowerCase());

  return candidates.filter((candidate) =>
    lowerRequired.every((skill) =>
      candidate.skills.some((s) => s.toLowerCase() === skill)
    )
  );
}

/**
 * Filters candidates by exact seniority level.
 */
export function filterCandidatesBySeniority(
  candidates: Candidate[],
  seniority: SeniorityLevel
): Candidate[] {
  return candidates.filter((c) => c.seniority === seniority);
}

/**
 * Filters candidates whose availability matches ANY of the provided statuses.
 */
export function filterCandidatesByAvailability(
  candidates: Candidate[],
  availability: AvailabilityStatus[]
): Candidate[] {
  if (availability.length === 0) return [];

  const validSet = new Set(availability);
  return candidates.filter((c) => validSet.has(c.availability));
}

/**
 * Sorts candidates by expected salary.
 * Does NOT mutate the original array.
 */
export function sortCandidatesBySalary(
  candidates: Candidate[],
  order: "asc" | "desc"
): Candidate[] {
  return [...candidates].sort((a, b) =>
    order === "asc"
      ? a.expectedSalary - b.expectedSalary
      : b.expectedSalary - a.expectedSalary
  );
}

/**
 * Sorts candidates by years of experience.
 * Does NOT mutate the original array.
 */
export function sortCandidatesByExperience(
  candidates: Candidate[],
  order: "asc" | "desc"
): Candidate[] {
  return [...candidates].sort((a, b) =>
    order === "asc"
      ? a.yearsOfExperience - b.yearsOfExperience
      : b.yearsOfExperience - a.yearsOfExperience
  );
}