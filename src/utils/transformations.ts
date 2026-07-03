// ============================================================
// Nexova — Transformations & aggregations
// Scoring, ranking, grouping and report generation utilities
// ============================================================

import type {
  Candidate,
  Vacancy,
  SelectionProcess,
  CandidateScore,
  SkillCount,
  SeniorityLevel,
  CandidateStatus,
} from "../types/models.js";

// ─── Scoring & Matching ─────────────────────────────────────

/**
 * Calculates a match score (0-100) between a candidate and a vacancy.
 *
 * Scoring breakdown:
 * - Skills match:   up to 40 pts
 * - Experience:     up to 20 pts
 * - Seniority:      up to 15 pts
 * - English level:  up to 15 pts
 * - Salary:         up to 10 pts
 */
export function calculateCandidateScore(
  candidate: Candidate,
  vacancy: Vacancy
): number {
  let score = 0;

  // ── Skills match (40 pts max) ──────────────────────────
  const lowerRequired = vacancy.requiredSkills.map((s) => s.toLowerCase());
  const lowerPreferred = vacancy.preferredSkills.map((s) => s.toLowerCase());
  const candidateSkills = candidate.skills.map((s) => s.toLowerCase());

  const hasAllRequired = lowerRequired.every((skill) =>
    candidateSkills.includes(skill)
  );

  const requiredMatchCount = lowerRequired.filter((skill) =>
    candidateSkills.includes(skill)
  ).length;
  const hasHalfRequired =
    requiredMatchCount >= lowerRequired.length / 2;

  if (hasAllRequired) {
    score += 40;
  } else if (hasHalfRequired) {
    score += 20;
  }

  // Preferred skills: +10 each, max +20
  const preferredMatchCount = lowerPreferred.filter((skill) =>
    candidateSkills.includes(skill)
  ).length;
  score += Math.min(preferredMatchCount * 10, 20);

  // ── Experience match (20 pts max) ──────────────────────
  const exp = candidate.yearsOfExperience;
  if (exp >= vacancy.minYearsExperience && exp <= vacancy.maxYearsExperience) {
    score += 20;
  } else if (
    Math.abs(exp - vacancy.minYearsExperience) <= 2 ||
    Math.abs(exp - vacancy.maxYearsExperience) <= 2
  ) {
    score += 10;
  }
  // else 0 points

  // ── Seniority match (15 pts max) ───────────────────────
  const seniorityLevels: SeniorityLevel[] = [
    "Junior",
    "Semi-Senior",
    "Senior",
    "Lead",
    "Executive",
  ];

  const candidateIdx = seniorityLevels.indexOf(candidate.seniority);
  const requiredIdx = seniorityLevels.indexOf(vacancy.requiredSeniority);
  const diff = Math.abs(candidateIdx - requiredIdx);

  if (diff === 0) {
    score += 15;
  } else if (diff === 1) {
    score += 7;
  }
  // else 0 points

  // ── English level match (15 pts max) ───────────────────
  const englishLevels: string[] = ["A1", "A2", "B1", "B2", "C1", "C2", "Native"];
  const candidateEngIdx = englishLevels.indexOf(candidate.englishLevel);
  const requiredEngIdx = englishLevels.indexOf(vacancy.requiredEnglishLevel);

  if (candidateEngIdx >= requiredEngIdx) {
    score += 15;
  }
  // else 0 points

  // ── Salary match (10 pts max) ──────────────────────────
  const expected = candidate.expectedSalary;
  if (
    expected >= vacancy.salaryRangeMin &&
    expected <= vacancy.salaryRangeMax
  ) {
    score += 10;
  } else if (expected <= vacancy.salaryRangeMax * 1.2) {
    // Up to 20% above max
    score += 5;
  }
  // else 0 points

  return Math.min(score, 100);
}

/**
 * Scores all candidates against a vacancy and returns them ranked
 * by score (highest first).
 */
export function rankCandidatesForVacancy(
  candidates: Candidate[],
  vacancy: Vacancy
): CandidateScore[] {
  const scored = candidates.map((candidate) => ({
    candidate,
    score: calculateCandidateScore(candidate, vacancy),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * Groups candidates by their seniority level.
 */
export function groupCandidatesBySeniority(
  candidates: Candidate[]
): Record<SeniorityLevel, Candidate[]> {
  const groups: Record<SeniorityLevel, Candidate[]> = {
    Junior: [],
    "Semi-Senior": [],
    Senior: [],
    Lead: [],
    Executive: [],
  };

  for (const candidate of candidates) {
    groups[candidate.seniority].push(candidate);
  }

  return groups;
}

// ─── Aggregations & Reports ─────────────────────────────────

/**
 * Counts candidates by their status.
 */
export function countCandidatesByStatus(
  candidates: Candidate[]
): Record<CandidateStatus, number> {
  const counts: Record<CandidateStatus, number> = {
    Active: 0,
    "In process": 0,
    Hired: 0,
    Inactive: 0,
  };

  for (const candidate of candidates) {
    counts[candidate.status]++;
  }

  return counts;
}

/**
 * Calculates the average expected salary of all candidates.
 * Rounded to 2 decimal places.
 */
export function calculateAverageSalary(candidates: Candidate[]): number {
  if (candidates.length === 0) return 0;

  const total = candidates.reduce(
    (sum, candidate) => sum + candidate.expectedSalary,
    0
  );
  return Math.round((total / candidates.length) * 100) / 100;
}

/**
 * Finds the top N most common skills among all candidates.
 * Returns skills sorted by frequency (highest first).
 */
export function findTopSkills(
  candidates: Candidate[],
  topN: number
): SkillCount[] {
  const skillCounts = new Map<string, number>();

  for (const candidate of candidates) {
    const seen = new Set<string>();

    for (const skill of candidate.skills) {
      const lowerSkill = skill.toLowerCase();
      if (!seen.has(lowerSkill)) {
        seen.add(lowerSkill);
        skillCounts.set(lowerSkill, (skillCounts.get(lowerSkill) ?? 0) + 1);
      }
    }
  }

  const sorted = Array.from(skillCounts.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count);

  return sorted.slice(0, topN);
}

/**
 * Calculates the percentage of selection processes that ended in "Hired".
 * Returns a number between 0 and 100, rounded to 2 decimal places.
 */
export function calculateVacancyFillRate(
  processes: SelectionProcess[]
): number {
  if (processes.length === 0) return 0;

  const hiredCount = processes.filter(
    (process) => process.stage === "Hired"
  ).length;

  return Math.round((hiredCount / processes.length) * 10000) / 100;
}