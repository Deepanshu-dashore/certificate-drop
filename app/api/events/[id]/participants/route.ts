import { getOrganizerSession } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Certificate, Event, Participant } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";

// Helper to generate a unique certificate code
async function generateUniqueCode(): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    code = `CD-${part1}-${part2}`;

    // Verify uniqueness in DB
    const existing = await Certificate.findOne({ certificateCode: code });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  return code;
}

// POST: Add participants and pre-generate certificates
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getOrganizerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;
    const body = await req.json();
    const { participants } = body; // Array of { name, email, college, registrationId }

    if (!participants || !Array.isArray(participants)) {
      return NextResponse.json(
        { error: "Participants array is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify event ownership
    const event = await Event.findOne({
      _id: eventId,
      organizerId: session.userId,
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Extract emails and filter duplicates within the uploaded list itself
    const uniqueUploads: any[] = [];
    const seenEmailsInUpload = new Set<string>();

    for (const p of participants) {
      if (!p.name || !p.email || !p.college) continue;
      const cleanEmail = p.email.trim().toLowerCase();
      if (!seenEmailsInUpload.has(cleanEmail)) {
        seenEmailsInUpload.add(cleanEmail);
        const regId = p.registrationId && p.registrationId.trim()
          ? p.registrationId.trim()
          : `REG-${Array.from({ length: 6 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join("")}`;
        
        uniqueUploads.push({
          eventId,
          name: p.name.trim(),
          email: cleanEmail,
          college: p.college.trim(),
          registrationId: regId,
        });
      }
    }

    let importedCount = 0;
    let updatedCount = 0;

    for (const u of uniqueUploads) {
      // Find if participant already exists by eventId and email
      const existing = await Participant.findOne({ eventId, email: u.email });

      if (existing) {
        // Update existing participant details
        existing.name = u.name;
        existing.college = u.college;
        existing.registrationId = u.registrationId;
        await existing.save();
        updatedCount++;
      } else {
        // Insert new participant
        const newParticipant = await Participant.create(u);

        // Generate and save Certificate
        const code = await generateUniqueCode();
        await Certificate.create({
          certificateCode: code,
          participantId: newParticipant._id,
          eventId: eventId,
          downloadCount: 0,
        });
        
        importedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed list: ${importedCount} new participants imported, ${updatedCount} updated.`,
      importedCount,
      updatedCount,
    });
  } catch (error: any) {
    console.error("POST /api/events/[id]/participants error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}

// GET: Retrieve participants for an event
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getOrganizerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;

    await dbConnect();

    // Verify ownership
    const event = await Event.findOne({
      _id: eventId,
      organizerId: session.userId,
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Find participants and join certificates
    const participants = await Participant.find({ eventId }).sort({ createdAt: -1 });
    const participantIds = participants.map((p) => p._id);

    const certificates = await Certificate.find({
      participantId: { $in: participantIds },
    });

    // Map certificates to participants
    const certMap = new Map(
      certificates.map((c) => [c.participantId.toString(), c])
    );

    const data = participants.map((p) => {
      const cert = certMap.get(p._id.toString());
      return {
        id: p._id,
        name: p.name,
        email: p.email,
        college: p.college,
        registrationId: p.registrationId,
        certificateCode: cert ? cert.certificateCode : null,
        downloadCount: cert ? cert.downloadCount : 0,
      };
    });

    return NextResponse.json({ participants: data });
  } catch (error: any) {
    console.error("GET /api/events/[id]/participants error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}
