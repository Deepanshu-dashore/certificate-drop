import { getOrganizerSession, setOrganizerSession } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { User } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getOrganizerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { gid, googleAmbassadorGid } = body;
    const finalGid = (gid || googleAmbassadorGid || "").trim();

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (finalGid && finalGid !== user.gid) {
      const gidExists = await User.findOne({ gid: finalGid });
      if (gidExists) {
        return NextResponse.json(
          { error: "This Google Ambassador GID is already registered by another user." },
          { status: 400 }
        );
      }
    }

    user.gid = finalGid;
    await user.save();

    // Re-set session with updated GID
    await setOrganizerSession({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      gid: user.gid,
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      gid: user.gid,
    });
  } catch (error: any) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}
