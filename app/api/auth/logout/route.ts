import { clearOrganizerSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await clearOrganizerSession();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { error: "Failed to logout: " + error.message },
      { status: 500 }
    );
  }
}
