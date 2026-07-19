import dbConnect from "@/lib/db";
import { Certificate, Event, Participant } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const url = new URL(req.url);
    const query = url.searchParams.get("query");
    const nameParam = url.searchParams.get("name");
    const emailParam = url.searchParams.get("email");
    const regIdParam = url.searchParams.get("registrationId");

    await dbConnect();

    // Verify event is published
    const event = await Event.findById(eventId);
    if (!event || event.status !== "published") {
      return NextResponse.json(
        { error: "Event not found or not published" },
        { status: 404 }
      );
    }

    let participant = null;

    if (nameParam || emailParam || regIdParam) {
      const matchCriteria: any = { eventId };
      if (emailParam) {
        matchCriteria.email = emailParam.trim().toLowerCase();
      }
      if (nameParam) {
        matchCriteria.name = { $regex: new RegExp(`^${nameParam.trim()}$`, "i") };
      }
      if (regIdParam) {
        matchCriteria.registrationId = { $regex: new RegExp(`^${regIdParam.trim()}$`, "i") };
      }
      participant = await Participant.findOne(matchCriteria);
    } else if (query) {
      const trimmedQuery = query.trim();
      participant = await Participant.findOne({
        eventId,
        $or: [
          { email: trimmedQuery.toLowerCase() },
          { name: { $regex: new RegExp(`^${trimmedQuery}$`, "i") } },
          { registrationId: { $regex: new RegExp(`^${trimmedQuery}$`, "i") } },
        ],
      });
    } else {
      return NextResponse.json(
        { error: "Search query or fields are required" },
        { status: 400 }
      );
    }

    if (!participant) {
      return NextResponse.json(
        { error: "No certificate found matching the provided details." },
        { status: 404 }
      );
    }

    // Find certificate
    const certificate = await Certificate.findOne({
      participantId: participant._id,
      eventId,
    });

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate record not generated yet. Contact organizer." },
        { status: 404 }
      );
    }

    // Find classmates from the same college in this event (excluding the participant themselves)
    const classmatesParticipants = await Participant.find({
      eventId,
      college: participant.college,
      _id: { $ne: participant._id }
    });

    const classmateIds = classmatesParticipants.map((c) => c._id);
    const classmatesCertificates = await Certificate.find({
      eventId,
      participantId: { $in: classmateIds }
    });

    const classmatesCertMap = new Map(
      classmatesCertificates.map((c) => [c.participantId.toString(), c])
    );

    const classmates = classmatesParticipants.map((c) => {
      const cert = classmatesCertMap.get(c._id.toString());
      return {
        name: c.name,
        email: c.email,
        registrationId: c.registrationId || "",
        certificateCode: cert ? cert.certificateCode : null
      };
    }).filter((c) => c.certificateCode !== null);

    return NextResponse.json({
      success: true,
      participant: {
        name: participant.name,
        email: participant.email,
        college: participant.college,
        registrationId: participant.registrationId || "",
      },
      certificateCode: certificate.certificateCode,
      certificateIdSource: event.certificateIdSource || "code",
      classmates,
    });
  } catch (error: any) {
    console.error("GET /api/events/[id]/search error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}
