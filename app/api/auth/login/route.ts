import { getOrCreateDemoUser, hashPassword, setOrganizerSession } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { User } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email, name, password, gid, googleAmbassadorGid, isDemo } = body;
    const finalGid = (gid || googleAmbassadorGid || "").trim();

    let user;

    if (isDemo) {
      // Create or get demo user
      user = await getOrCreateDemoUser();
    } else {
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and Password are required" },
          { status: 400 }
        );
      }

      const hashedPassword = hashPassword(password);

      // Check if user exists or create
      user = await User.findOne({ email });
      if (!user) {
        if (!name) {
          return NextResponse.json(
            { error: "Name is required to register a new profile" },
            { status: 400 }
          );
        }

        if (finalGid) {
          const gidExists = await User.findOne({ gid: finalGid });
          if (gidExists) {
            return NextResponse.json(
              { error: "This Google Ambassador GID is already registered by another user." },
              { status: 400 }
            );
          }
        }

        user = await User.create({
          name,
          email,
          password: hashedPassword,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          gid: finalGid,
        });
      } else {
        if (user.password !== hashedPassword) {
          return NextResponse.json(
            { error: "Incorrect password. Please try again." },
            { status: 401 }
          );
        }

        if (finalGid && finalGid !== user.gid) {
          const gidExists = await User.findOne({ gid: finalGid });
          if (gidExists) {
            return NextResponse.json(
              { error: "This Google Ambassador GID is already registered by another user." },
              { status: 400 }
            );
          }
          user.gid = finalGid;
          await user.save();
        }
      }
    }

    // Set cookie session
    await setOrganizerSession({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      gid: user.gid,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        gid: user.gid,
      },
    });
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}
