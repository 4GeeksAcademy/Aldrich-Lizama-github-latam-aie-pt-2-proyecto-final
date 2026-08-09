import type { Candidate, Vacancy } from "./types/models";
import {
  calculateAverageSalary,
  calculateCandidateScore,
  countCandidatesByStatus,
  findTopSkills,
} from "./utils/transformations";
import { filterCandidatesBySkills } from "./utils/collections";

export type DashboardSummary = {
  totalCandidates: number;
  averageExpectedSalary: number;
  matchedForCoreStack: number;
  topSkills: { skill: string; count: number }[];
  statusBreakdown: Record<
    "Active" | "In process" | "Hired" | "Inactive",
    number
  >;
  leadScore: number;
};

const candidates: Candidate[] = [
  {
    id: "C-2024-0451",
    fullName: "Maria Gonzalez",
    email: "maria.gonzalez@email.com",
    phone: "+56912345678",
    yearsOfExperience: 5,
    skills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
    englishLevel: "B2",
    seniority: "Semi-Senior",
    currentSalary: 3500,
    expectedSalary: 4200,
    availability: "1 month",
    location: "Valencia, Espana",
    remoteOnly: false,
    status: "Active",
  },
  {
    id: "C-2024-0452",
    fullName: "Juan Perez",
    email: "juan.perez@email.com",
    phone: "+56987654321",
    yearsOfExperience: 3,
    skills: ["JavaScript", "React", "CSS", "HTML"],
    englishLevel: "B1",
    seniority: "Junior",
    currentSalary: 2200,
    expectedSalary: 2800,
    availability: "Immediate",
    location: "Miami, Florida",
    remoteOnly: true,
    status: "In process",
  },
  {
    id: "C-2024-0453",
    fullName: "Carolina Silva",
    email: "carolina.silva@email.com",
    phone: "+56911223344",
    yearsOfExperience: 8,
    skills: ["TypeScript", "Node.js", "PostgreSQL", "Docker", "AWS"],
    englishLevel: "C1",
    seniority: "Senior",
    currentSalary: 5500,
    expectedSalary: 6500,
    availability: "2 weeks",
    location: "Valencia, Espana",
    remoteOnly: false,
    status: "Hired",
  },
];

const vacancy: Vacancy = {
  id: "V-2024-0892",
  title: "Senior Full-Stack Developer",
  companyName: "TechCorp Solutions",
  requiredSkills: ["TypeScript", "React", "Node.js"],
  preferredSkills: ["PostgreSQL", "Docker"],
  minYearsExperience: 4,
  maxYearsExperience: 8,
  requiredEnglishLevel: "B2",
  requiredSeniority: "Senior",
  salaryRangeMin: 5000,
  salaryRangeMax: 7000,
  isRemote: true,
  location: "Remote",
  status: "Open",
};

export function getDashboardSummary(): DashboardSummary {
  const matchedForCoreStack = filterCandidatesBySkills(candidates, [
    "TypeScript",
    "React",
  ]).length;

  return {
    totalCandidates: candidates.length,
    averageExpectedSalary: calculateAverageSalary(candidates),
    matchedForCoreStack,
    topSkills: findTopSkills(candidates, 3),
    statusBreakdown: countCandidatesByStatus(candidates),
    leadScore: calculateCandidateScore(candidates[2], vacancy),
  };
}
