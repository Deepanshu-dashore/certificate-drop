import { getOrganizerSession } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Event, Participant } from "@/lib/models";
import { CloudneryService } from "@/lib/services/CloudneryService";
import { NextRequest, NextResponse } from "next/server";

// GET: Retrieve a single event details with participant count
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getOrganizerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    const event = await Event.findOne({
      _id: id,
      organizerId: session.userId,
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const participantCount = await Participant.countDocuments({ eventId: id });

    return NextResponse.json({
      event,
      participantCount,
    });
  } catch (error: any) {
    console.error("GET /api/events/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}

// PUT: Update event details or template configuration
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getOrganizerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    await dbConnect();

    // Verify ownership
    const event = await Event.findOne({
      _id: id,
      organizerId: session.userId,
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // White-list fields to update
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.date !== undefined) updateData.date = body.date ? new Date(body.date) : null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.certificateIdSource !== undefined) updateData.certificateIdSource = body.certificateIdSource;
    if (body.templateSettings !== undefined) updateData.templateSettings = body.templateSettings;

    if (body.templateUrl !== undefined) {
      updateData.templateUrl = body.templateUrl;
      // Delete old template from Cloudinary if replacing it
      if (
        event.templateUrl &&
        event.templateUrl !== body.templateUrl &&
        !event.templateUrl.startsWith("/") &&
        !event.templateUrl.startsWith("http")
      ) {
        try {
          await CloudneryService.delete(event.templateUrl, "image");
        } catch (e) {
          console.error("Failed to delete old template from Cloudinary:", e);
        }
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedEvent) {
      return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error: any) {
    console.error("PUT /api/events/[id] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}
