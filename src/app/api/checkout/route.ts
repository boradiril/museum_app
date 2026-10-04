import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider, TOUR_PRICE_CENTS } from "@/lib/payments";

/**
 * Unlocks an itinerary after payment (CLAUDE.md §3.4, §5.4). Runs through the
 * payment provider interface, so the dummy provider can be replaced by Stripe
 * without changing this route.
 */
export async function POST(request: Request) {
  let itineraryId: unknown;
  try {
    ({ itineraryId } = (await request.json()) as { itineraryId?: unknown });
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (typeof itineraryId !== "string" || itineraryId.length === 0) {
    return NextResponse.json({ error: "itineraryId is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No session found." }, { status: 401 });
  }

  // RLS: this returns the row only if the visitor owns the itinerary.
  const { data: itinerary, error: itineraryError } = await supabase
    .from("itineraries")
    .select("id, unlocked_at")
    .eq("id", itineraryId)
    .maybeSingle();

  if (itineraryError) {
    return NextResponse.json({ error: "Could not load the itinerary." }, { status: 500 });
  }
  if (!itinerary) {
    return NextResponse.json({ error: "Itinerary not found." }, { status: 404 });
  }
  if (itinerary.unlocked_at) {
    return NextResponse.json({ unlocked: true });
  }

  const admin = createAdminClient();

  const provider = getPaymentProvider();
  const payment = await provider.charge({
    itineraryId,
    userId: user.id,
    amountCents: TOUR_PRICE_CENTS,
  });

  const { error: purchaseError } = await admin.from("purchases").insert({
    itinerary_id: itineraryId,
    user_id: user.id,
    status: "succeeded",
    receipt_email: payment.receiptEmail,
  });
  if (purchaseError) {
    return NextResponse.json({ error: "Could not record the purchase." }, { status: 500 });
  }

  const { error: unlockError } = await admin
    .from("itineraries")
    .update({ unlocked_at: new Date().toISOString() })
    .eq("id", itineraryId)
    .eq("user_id", user.id)
    .is("unlocked_at", null);
  if (unlockError) {
    return NextResponse.json({ error: "Payment recorded, but unlocking failed." }, { status: 500 });
  }

  return NextResponse.json({ unlocked: true });
}
