import {
  createSupplier,
  deleteSupplier,
  fetchSuppliers,
} from "../src/app/suppliers/api";
import { apiClient } from "../src/lib/apiClient";
import type { Supplier, SupplierCreatePayload } from "../src/app/suppliers/types";

jest.mock("../src/lib/apiClient", () => ({ apiClient: jest.fn() }));

const mockedApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

const supplier: Supplier = {
  id: "1",
  name: "Talent Platform",
  country: "Spain",
  categories: ["job_boards"],
  monthly_rate: 125,
  currency: "EUR",
  status: "active",
  updated_at: "2026-01-01T00:00:00Z",
};

function response(status: number, body?: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    statusText: "Failure",
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
});

test("fetchSuppliers returns data and composes filters", async () => {
  mockedApiClient.mockResolvedValue(response(200, [supplier]));

  await expect(fetchSuppliers("Spain", "job_boards")).resolves.toEqual([supplier]);
  expect(mockedApiClient).toHaveBeenCalledWith(
    "/suppliers?country=Spain&category=job_boards",
    expect.objectContaining({ headers: { "Content-Type": "application/json" } }),
  );
});

test("fetchSuppliers rejects non-success responses", async () => {
  mockedApiClient.mockResolvedValue(response(503, { detail: "Service unavailable" }));

  await expect(fetchSuppliers()).rejects.toThrow("Service unavailable");
});

test("createSupplier posts the payload and returns the created supplier", async () => {
  const payload: SupplierCreatePayload = {
    name: supplier.name,
    country: supplier.country,
    categories: supplier.categories,
    monthly_rate: supplier.monthly_rate,
    currency: supplier.currency,
    status: supplier.status,
  };
  mockedApiClient.mockResolvedValue(response(201, supplier));

  await expect(createSupplier(payload)).resolves.toEqual(supplier);
  expect(mockedApiClient).toHaveBeenCalledWith(
    "/suppliers",
    expect.objectContaining({ method: "POST", body: JSON.stringify(payload) }),
  );
});

test("createSupplier rejects non-success responses", async () => {
  mockedApiClient.mockResolvedValue(response(422, { detail: "Invalid supplier" }));

  await expect(createSupplier({
    name: supplier.name,
    country: supplier.country,
    categories: supplier.categories,
    monthly_rate: supplier.monthly_rate,
    currency: supplier.currency,
    status: supplier.status,
  })).rejects.toThrow("Invalid supplier");
});

test("deleteSupplier accepts a no-content response", async () => {
  mockedApiClient.mockResolvedValue(response(204));

  await expect(deleteSupplier("1")).resolves.toBeUndefined();
  expect(mockedApiClient).toHaveBeenCalledWith(
    "/suppliers/1",
    expect.objectContaining({ method: "DELETE" }),
  );
});

test("deleteSupplier rejects non-success responses", async () => {
  mockedApiClient.mockResolvedValue(response(404, { detail: "Supplier not found" }));

  await expect(deleteSupplier("missing")).rejects.toThrow("Supplier not found");
});
