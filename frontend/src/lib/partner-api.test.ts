import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, authStore, partnerApi } from "./partner-api";

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json" },
});

describe("partnerApi", () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  it("stores and clears an authenticated session", () => {
    const user = { id: 3, full_name: "Partner", email: "p@example.com", business_name: "Business", role: "PARTNER" as const, approval_status: "APPROVED" };
    authStore.setSession("token", user);
    expect(authStore.getToken()).toBe("token");
    expect(authStore.getUser()).toEqual(user);
    authStore.clear();
    expect(authStore.getToken()).toBeNull();
  });

  it("maps voucher list and paid revenue statistics into UI data", async () => {
    authStore.setSession("token", {} as never);
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("dashboard/vouchers")) return jsonResponse([{ program_id: "1", sold_count: "2", used_count: "1", revenue: "140000.00" }]);
      return jsonResponse({ total: 1, data: [{
        program_id: "1", category_id: "1", program_name: "Buffet", category_name: "Ẩm thực",
        original_price: "100000.00", sale_price: "70000.00", discount_amount: "30000.00",
        issue_quantity: 500, sale_start_at: "2026-01-01T00:00:00.000Z",
        sale_end_at: "2026-12-31T00:00:00.000Z", use_start_at: "2026-01-01T00:00:00.000Z",
        use_end_at: "2027-01-01T00:00:00.000Z", display_status: "PUBLISHED", status: "approved",
      }] });
    }));
    const [voucher] = await partnerApi.getVouchers();
    expect(voucher).toMatchObject({ id: "1", title: "Buffet", sellingPrice: 70000, soldCount: 2, usedCount: 1, revenue: 140000 });
  });

  it("maps profile and branches from backend snake_case", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => String(input).endsWith("/branches")
      ? jsonResponse([{ branch_id: "1", branch_name: "Quận 1", address: "123 Lê Lợi", region: "Miền Nam", status: "ACTIVE" }])
      : jsonResponse({ full_name: "Đại diện", email: "p@example.com", phone: "0901", business_name: "Doanh nghiệp", tax_code: "TAX", approval_status: "APPROVED" })));
    const profile = await partnerApi.getProfile();
    expect(profile.businessName).toBe("Doanh nghiệp");
    expect(profile.branches[0]).toMatchObject({ id: "1", name: "Quận 1", status: "active" });
  });

  it("turns backend errors into ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "Sai tài khoản" }, 401)));
    await expect(partnerApi.login("x", "y")).rejects.toEqual(expect.objectContaining({ status: 401, message: "Sai tài khoản" }));
  });
});
