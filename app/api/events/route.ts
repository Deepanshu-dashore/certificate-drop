import { getOrganizerSession } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Certificate, Event, Participant, User } from "@/lib/models";
import { resolveTemplateUrl } from "@/lib/utils/geturl";
import { NextRequest, NextResponse } from "next/server";

// Helper to generate a URL slug from the title
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "") + "-" + Math.random().toString(36).substring(2, 6);
}

// GET: List all events and calculate dashboard stats
export async function GET() {
  try {
    const session = await getOrganizerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get all events for organizer
    const events = await Event.find({ organizerId: session.userId }).sort({
      createdAt: -1,
    });

    const eventIds = events.map((e) => e._id);

    // Calculate metrics
    const totalEvents = events.length;

    const totalParticipants = await Participant.countDocuments({
      eventId: { $in: eventIds },
    });

    const totalCertificates = await Certificate.countDocuments({
      eventId: { $in: eventIds },
    });

    const certDownloads = await Certificate.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: null, total: { $sum: "$downloadCount" } } },
    ]);

    const totalDownloads = certDownloads[0]?.total || 0;

    return NextResponse.json({
      events,
      stats: {
        totalEvents,
        totalParticipants,
        totalCertificates,
        totalDownloads,
      },
    });
  } catch (error: any) {
    console.error("GET /api/events error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new event
export async function POST(req: NextRequest) {
  try {
    const session = await getOrganizerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.userId);
    if (!user || !user.gid) {
      return NextResponse.json(
        { error: "You must configure your Google Ambassador GID in your profile settings before creating events." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, date, templateUrl } = body;

    if (!title) {
      return NextResponse.json({ error: "Event Title is required" }, { status: 400 });
    }

    const slug = slugify(title);

    const event = await Event.create({
      organizerId: session.userId,
      title,
      description,
      date: date ? new Date(date) : undefined,
      templateUrl,
      slug,
      status: "draft",
    });

    const eventObj = event.toObject();
    eventObj.templateUrl = resolveTemplateUrl(eventObj.templateUrl);

    return NextResponse.json({ success: true, event: eventObj });
  } catch (error: any) {
    console.error("POST /api/events error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}
