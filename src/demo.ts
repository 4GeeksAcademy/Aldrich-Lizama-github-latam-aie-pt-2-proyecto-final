// ============================================================
// Nexova — Demo script
// Tests all utilities with sample data from CONTEXT-nexova
// Run with: npm run demo
// ============================================================

import type { Candidate, Vacancy, SelectionProcess } from "./types/models.js";
import {
  filterCandidatesBySkills,
  filterCandidatesBySeniority,
  filterCandidatesByAvailability,
  sortCandidatesBySalary,
  sortCandidatesByExperience,
} from "./utils/collections.js";
import {
  findCandidateById,
  findCandidateByEmail,
  binarySearchCandidateBySalary,
} from "./utils/search.js";
import {
  calculateCandidateScore,
  rankCandidatesForVacancy,
  groupCandidatesBySeniority,
  countCandidatesByStatus,
  calculateAverageSalary,
  findTopSkills,
  calculateVacancyFillRate,
} from "./utils/transformations.js";
import { validateCandidate, validateVacancy } from "./utils/validations.js";

// ─── Sample Data ─────────────────────────────────────────

const sampleCandidates: Candidate[] = [
  {
    id: "C-2024-0451",
    fullName: "María González",
    email: "maria.gonzalez@email.com",
    phone: "+56912345678",
    yearsOfExperience: 5,
    skills: ["TypeScript", "React", "Node.js", "PostgreSQL"],
    englishLevel: "B2",
    seniority: "Semi-Senior",
    currentSalary: 3500,
    expectedSalary: 4200,
    availability: "1 month",
    location: "Valencia, España",
    remoteOnly: false,
    status: "Active",
  },
  {
    id: "C-2024-0452",
    fullName: "Juan Pérez",
    email: "juan.perez@email.com",
    phone: "+56987654321",
    yearsOfExperience: 3,
    skills: ["JavaScript", "React", "CSS", "HTML"],
    englishLevel: "B1",
    seniority: "Junior",
    currentSalary: 2200,
    expectedSalary: 2800,
    availability: "Immediate",
    location: "Miami, Florida, Estados Unidos",
    remoteOnly: true,
    status: "Active",
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
    location: "Valencia, España",
    remoteOnly: false,
    status: "Active",
  },
];

const sampleVacancy: Vacancy = {
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

const sampleProcesses: SelectionProcess[] = [
  {
    id: "SP-2024-1523",
    candidateId: "C-2024-0451",
    vacancyId: "V-2024-0892",
    stage: "Hired",
    score: 85,
    notes: "Excelente candidata, contratada",
    createdAt: new Date("2024-06-01"),
    updatedAt: new Date("2024-07-15"),
  },
  {
    id: "SP-2024-1524",
    candidateId: "C-2024-0452",
    vacancyId: "V-2024-0892",
    stage: "Rejected",
    score: 45,
    notes: "No cumple experiencia mínima",
    createdAt: new Date("2024-06-05"),
    updatedAt: new Date("2024-06-20"),
  },
  {
    id: "SP-2024-1525",
    candidateId: "C-2024-0453",
    vacancyId: "V-2024-0892",
    stage: "Hired",
    score: 92,
    notes: "Perfil ideal, contratada",
    createdAt: new Date("2024-06-10"),
    updatedAt: new Date("2024-07-20"),
  },
];

// ─── Demo Runner ─────────────────────────────────────────

function section(title: string): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"=".repeat(60)}`);
}

function printJson(label: string, data: unknown): void {
  console.log(`\n📌 ${label}:`);
  console.log(JSON.stringify(data, null, 2));
}

// ─── Tests ────────────────────────────────────────────────

section("1. FILTRADO");

const filteredBySkills = filterCandidatesBySkills(sampleCandidates, [
  "TypeScript",
  "React",
]);
printJson(
  `Candidatos con TypeScript y React (${filteredBySkills.length})`,
  filteredBySkills.map((c) => c.fullName)
);

const filteredBySeniority = filterCandidatesBySeniority(
  sampleCandidates,
  "Senior"
);
printJson(
  `Candidatos Senior (${filteredBySeniority.length})`,
  filteredBySeniority.map((c) => c.fullName)
);

const filteredByAvailability = filterCandidatesByAvailability(
  sampleCandidates,
  ["Immediate", "2 weeks"]
);
printJson(
  `Candidatos con disponibilidad inmediata o 2 semanas (${filteredByAvailability.length})`,
  filteredByAvailability.map((c) => `${c.fullName} - ${c.availability}`)
);

section("2. ORDENAMIENTO");

const sortedBySalaryAsc = sortCandidatesBySalary(sampleCandidates, "asc");
printJson(
  "Candidatos ordenados por salario (ascendente)",
  sortedBySalaryAsc.map((c) => `${c.fullName}: $${c.expectedSalary}`)
);

const sortedByExpDesc = sortCandidatesByExperience(sampleCandidates, "desc");
printJson(
  "Candidatos ordenados por experiencia (descendente)",
  sortedByExpDesc.map((c) => `${c.fullName}: ${c.yearsOfExperience} años`)
);

// Verify no mutation
printJson(
  "Array original intacto",
  sampleCandidates.map((c) => c.fullName)
);

section("3. BÚSQUEDAS");

const foundById = findCandidateById(sampleCandidates, "C-2024-0451");
printJson("Búsqueda lineal por ID (C-2024-0451)", foundById?.fullName ?? "❌ No encontrado");

const foundByEmail = findCandidateByEmail(sampleCandidates, "JUAN.PEREZ@EMAIL.COM");
printJson(
  "Búsqueda lineal por email case-insensitive",
  foundByEmail?.fullName ?? "❌ No encontrado"
);

const notFound = findCandidateById(sampleCandidates, "C-0000");
printJson("Búsqueda lineal - ID inexistente", notFound);

const sortedBySalaryAsc2 = sortCandidatesBySalary(sampleCandidates, "asc");
const binaryIdx = binarySearchCandidateBySalary(sortedBySalaryAsc2, 4200);
printJson(
  `Búsqueda binaria por salario $4200`,
  binaryIdx !== -1
    ? `Encontrado en índice ${binaryIdx}: ${sortedBySalaryAsc2[binaryIdx].fullName}`
    : "❌ No encontrado"
);

const binaryIdx2 = binarySearchCandidateBySalary(sortedBySalaryAsc2, 9999);
printJson("Búsqueda binaria - salario inexistente", binaryIdx2);

section("4. SCORING Y RANKING");

const score = calculateCandidateScore(sampleCandidates[0], sampleVacancy);
printJson(
  `Score de ${sampleCandidates[0].fullName} vs "${sampleVacancy.title}"`,
  `${score}/100`
);

const score2 = calculateCandidateScore(sampleCandidates[1], sampleVacancy);
printJson(
  `Score de ${sampleCandidates[1].fullName} vs "${sampleVacancy.title}"`,
  `${score2}/100`
);

const ranked = rankCandidatesForVacancy(sampleCandidates, sampleVacancy);
printJson("Ranking de candidatos", ranked);

const grouped = groupCandidatesBySeniority(sampleCandidates);
printJson("Candidatos agrupados por seniority", {
  Junior: grouped.Junior.map((c) => c.fullName),
  "Semi-Senior": grouped["Semi-Senior"].map((c) => c.fullName),
  Senior: grouped.Senior.map((c) => c.fullName),
  Lead: grouped.Lead.map((c) => c.fullName),
  Executive: grouped.Executive.map((c) => c.fullName),
});

section("5. AGREGACIONES Y REPORTES");

const countsByStatus = countCandidatesByStatus(sampleCandidates);
printJson("Conteo por estado", countsByStatus);

const avgSalary = calculateAverageSalary(sampleCandidates);
printJson("Salario esperado promedio", `$${avgSalary}`);

const topSkills = findTopSkills(sampleCandidates, 3);
printJson("Top 3 habilidades más comunes", topSkills);

const fillRate = calculateVacancyFillRate(sampleProcesses);
printJson("Tasa de colocación (fill rate)", `${fillRate}%`);

// Empty array tests
printJson("Avg salary (array vacío)", calculateAverageSalary([]));
printJson("Fill rate (array vacío)", `${calculateVacancyFillRate([])}%`);
printJson("Top skills (array vacío)", findTopSkills([], 3));

section("6. VALIDACIONES");

const validCandidate = validateCandidate(sampleCandidates[0]);
printJson("Validación candidato válido", validCandidate);

const invalidCandidate = validateCandidate({
  ...sampleCandidates[0],
  yearsOfExperience: -1,
  currentSalary: 0,
  skills: [],
  email: "invalido",
  phone: "",
});
printJson("Validación candidato inválido", invalidCandidate);

const validVacancy = validateVacancy(sampleVacancy);
printJson("Validación vacante válida", validVacancy);

const invalidVacancy = validateVacancy({
  ...sampleVacancy,
  requiredSkills: [],
  minYearsExperience: -1,
  maxYearsExperience: 2,
  salaryRangeMin: 0,
  salaryRangeMax: 0,
});
printJson("Validación vacante inválida", invalidVacancy);

// ─── Summary ──────────────────────────────────────────────
section("RESUMEN");

const allErrors: string[] = [];

// Collection tests
if (filteredBySkills.length !== 1) allErrors.push("filterCandidatesBySkills falló");
if (filteredBySeniority.length !== 1) allErrors.push("filterCandidatesBySeniority falló");
if (filteredByAvailability.length !== 2) allErrors.push("filterCandidatesByAvailability falló");
if (sortedBySalaryAsc[0].expectedSalary > sortedBySalaryAsc[1].expectedSalary)
  allErrors.push("sortCandidatesBySalary asc falló");
if (sortedByExpDesc[0].yearsOfExperience < sortedByExpDesc[1].yearsOfExperience)
  allErrors.push("sortCandidatesByExperience desc falló");

// Search tests
if (!foundById) allErrors.push("findCandidateById falló (debió encontrar)");
if (!foundByEmail) allErrors.push("findCandidateByEmail falló (debió encontrar)");
if (notFound !== null) allErrors.push("findCandidateById falló (debió retornar null)");
if (binaryIdx === -1) allErrors.push("binarySearchCandidateBySalary falló (debió encontrar)");
if (binaryIdx2 !== -1) allErrors.push("binarySearchCandidateBySalary falló (debió retornar -1)");

// Scoring tests
if (score > 100 || score < 0) allErrors.push("calculateCandidateScore fuera de rango");
if (ranked.length === 0) allErrors.push("rankCandidatesForVacancy falló");

// Aggregation tests
if (countsByStatus.Active !== 3) allErrors.push("countCandidatesByStatus falló");
if (avgSalary <= 0) allErrors.push("calculateAverageSalary falló");
if (topSkills.length === 0) allErrors.push("findTopSkills falló");
if (fillRate <= 0) allErrors.push("calculateVacancyFillRate falló");

// Validation tests
if (validCandidate.valid !== true) allErrors.push("validateCandidate válido falló");
if (invalidCandidate.valid !== false || invalidCandidate.errors.length === 0)
  allErrors.push("validateCandidate inválido falló");
if (validVacancy.valid !== true) allErrors.push("validateVacancy válida falló");
if (invalidVacancy.valid !== false || invalidVacancy.errors.length === 0)
  allErrors.push("validateVacancy inválida falló");

if (allErrors.length === 0) {
  console.log("\n✅ ¡TODAS LAS PRUEBAS PASARON CORRECTAMENTE!");
} else {
  console.log(`\n❌ ${allErrors.length} prueba(s) fallaron:`);
  allErrors.forEach((err) => console.log(`   - ${err}`));
}

console.log();