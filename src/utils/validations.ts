// ============================================================
// Nexova — Business validations
// Rules that data must satisfy before being processed
// ============================================================

import type {
  Candidate,
  Vacancy,
  ValidationResult,
} from "../types/models.js";

/**
 * Checks if a string is a valid basic email format.
 * Returns true if the email contains '@' and '.' in correct positions.
 */
export function isValidEmail(email: string): boolean {
  const atIndex = email.indexOf("@");
  if (atIndex < 1) return false;

  const dotIndex = email.lastIndexOf(".");
  if (dotIndex < atIndex + 2 || dotIndex === email.length - 1) return false;

  return true;
}

/**
 * Validates a candidate against all business rules.
 *
 * Rules:
 * - yearsOfExperience must be >= 0 and <= 50
 * - currentSalary and expectedSalary must be > 0
 * - skills array must contain at least 1 skill
 * - email must be valid
 * - phone must not be empty
 */
export function validateCandidate(
  candidate: Candidate
): ValidationResult {
  const errors: string[] = [];

  if (candidate.yearsOfExperience < 0 || candidate.yearsOfExperience > 50) {
    errors.push("yearsOfExperience must be between 0 and 50");
  }

  if (candidate.currentSalary <= 0) {
    errors.push("currentSalary must be greater than 0");
  }

  if (candidate.expectedSalary <= 0) {
    errors.push("expectedSalary must be greater than 0");
  }

  if (!Array.isArray(candidate.skills) || candidate.skills.length < 1) {
    errors.push("skills must contain at least 1 skill");
  }

  if (!isValidEmail(candidate.email)) {
    errors.push("email must be a valid email format");
  }

  if (typeof candidate.phone !== "string" || candidate.phone.trim() === "") {
    errors.push("phone must not be empty");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a vacancy against all business rules.
 *
 * Rules:
 * - requiredSkills must contain at least 1 skill
 * - minYearsExperience must be >= 0
 * - maxYearsExperience must be >= minYearsExperience
 * - salaryRangeMax must be >= salaryRangeMin
 * - Both salary values must be > 0
 */
export function validateVacancy(vacancy: Vacancy): ValidationResult {
  const errors: string[] = [];

  if (
    !Array.isArray(vacancy.requiredSkills) ||
    vacancy.requiredSkills.length < 1
  ) {
    errors.push("requiredSkills must contain at least 1 skill");
  }

  if (vacancy.minYearsExperience < 0) {
    errors.push("minYearsExperience must be >= 0");
  }

  if (vacancy.maxYearsExperience < vacancy.minYearsExperience) {
    errors.push(
      "maxYearsExperience must be >= minYearsExperience"
    );
  }

  if (vacancy.salaryRangeMin <= 0) {
    errors.push("salaryRangeMin must be greater than 0");
  }

  if (vacancy.salaryRangeMax <= 0) {
    errors.push("salaryRangeMax must be greater than 0");
  }

  if (vacancy.salaryRangeMax < vacancy.salaryRangeMin) {
    errors.push("salaryRangeMax must be >= salaryRangeMin");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}