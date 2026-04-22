import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWinnersLosers } from "@/lib/portfolio/winners-losers";

export const revalidate = 60;

export async function GET() {
  const supabase = await createClient();
  try {
    const result = await getWinnersLosers(supabase);
    return NextResponse.json(result, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "winners_losers_failed", message },
      { status: 500 },
    );
  }
}
