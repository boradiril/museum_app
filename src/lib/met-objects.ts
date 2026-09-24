import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server-only data access for the met_objects candidate pool (CLAUDE.md
 * §5.4/§6, Phase 3). Uses the service-role client since met_objects has
 * deny-all RLS — the client never reaches this table directly, only via
 * server code like this.
 *
 * Deliberately minimal for now: department/limit filtering only, not
 * interest-based matching. Real interest-to-candidate matching (mapping
 * user interest chips to filterable object attributes) is Phase 4 design
 * work, and doing it naively here (e.g. a raw tags overlap) would preempt
 * the scaling design noted in §7 — offline categorization/embeddings at
 * seed time, not ad-hoc filtering at request time.
 */
export interface MetObjectFilters {
  departmentIds?: number[];
  limit?: number;
}

export async function getCandidateMetObjects(filters: MetObjectFilters = {}) {
  const supabase = createAdminClient();

  let query = supabase.from("met_objects").select("*");

  if (filters.departmentIds?.length) {
    query = query.in("department_id", filters.departmentIds);
  }

  query = query.limit(filters.limit ?? 200);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch candidate Met objects: ${error.message}`);
  }

  return data;
}
