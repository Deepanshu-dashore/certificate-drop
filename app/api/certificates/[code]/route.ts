import { generateCertificatePdf } from "@/lib/certificate";
import dbConnect from "@/lib/db";
import { Certificate, Event, Participant, User } from "@/lib/models";
import { resolveTemplateUrl } from "@/lib/utils/geturl";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const url = new URL(req.url);
    const shouldDownload = url.searchParams.get("download") === "true";

    await dbConnect();

    // Find certificate and populate participant and event
    const certificate = await Certificate.findOne({ certificateCode: code });
    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const participant = await Participant.findById(certificate.participantId);
    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const event = await Event.findById(certificate.eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Verify participant email and name/registration ID matches
    const emailParam = url.searchParams.get("email");
    const nameOrRegIdParam = url.searchParams.get("nameOrRegId");
    const gidParam = url.searchParams.get("gid");

    if (!emailParam || !nameOrRegIdParam) {
      return NextResponse.json(
        { error: "Verification details (email and name/registration ID) are required to access this certificate." },
        { status: 400 }
      );
    }

    const cleanEmail = emailParam.trim().toLowerCase();
    const cleanNameOrRegId = nameOrRegIdParam.trim().replace(/\s+/g, " ").toLowerCase();
    const cleanGid = gidParam ? gidParam.trim().toLowerCase() : "";

    const isEmailMatch = participant.email.trim().toLowerCase() === cleanEmail;
    const isNameMatch = participant.name.trim().replace(/\s+/g, " ").toLowerCase() === cleanNameOrRegId;
    const isRegIdMatch = participant.registrationId && (
      participant.registrationId.trim().replace(/\s+/g, " ").toLowerCase() === cleanNameOrRegId ||
      participant.registrationId.trim().replace(/\s+/g, " ").toLowerCase() === cleanGid
    );

    if (!isEmailMatch || (!isNameMatch && !isRegIdMatch)) {
      return NextResponse.json(
        { error: "Verification failed. The email or name/registration ID does not match this certificate ID." },
        { status: 403 }
      );
    }

    if (shouldDownload) {
      // Check if template exists
      if (!event.templateUrl) {
        return NextResponse.json(
          { error: "Event template not configured" },
          { status: 400 }
        );
      }

      let templatePath = "";
      if (
        event.templateUrl.startsWith("http://") ||
        event.templateUrl.startsWith("https://") ||
        (!event.templateUrl.startsWith("/") && !event.templateUrl.startsWith("public"))
      ) {
        templatePath = resolveTemplateUrl(event.templateUrl);
      } else {
        templatePath = path.join(process.cwd(), "public", event.templateUrl);
        if (!fs.existsSync(templatePath)) {
          return NextResponse.json(
            { error: "Certificate template file not found on server" },
            { status: 500 }
          );
        }
      }

      // Increment download count
      certificate.downloadCount += 1;
      await certificate.save();

      // Define verification URL to bake into the QR code
      const host = req.headers.get("host") || "localhost:3000";
      const proto = req.headers.get("x-forwarded-proto") || "http";
      const verificationUrl = `${proto}://${host}/verify/${code}`;

      // Date formatting for certificate
      const eventDateStr = event.date
        ? new Date(event.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "N/A";

      // Settings and placeholder values
      const settings = event.templateSettings;
      const finalCertificateCode = event.certificateIdSource === "registrationId"
        ? (participant.registrationId || code)
        : code;

      const data = {
        name: participant.name,
        email: participant.email,
        college: participant.college,
        eventTitle: event.title,
        eventDate: eventDateStr,
        certificateCode: finalCertificateCode,
        verificationUrl,
        registrationId: participant.registrationId || "",
      };

      // Generate the PDF binary
      const pdfBytes = await generateCertificatePdf(templatePath, settings, data);

      // Return PDF binary response
      const headers = new Headers();
      headers.set("Content-Type", "application/pdf");
      headers.set(
        "Content-Disposition",
        `attachment; filename="${participant.name.replace(/\s+/g, "_")}_Certificate.pdf"`
      );

      return new NextResponse(pdfBytes as any, {
        status: 200,
        headers,
      });
    }

    const organizer = await User.findById(event.organizerId);

    // Find classmates from the same college in this event (excluding the participant themselves)
    const classmatesParticipants = await Participant.find({
      eventId: event._id,
      college: participant.college,
      _id: { $ne: participant._id }
    });

    const classmateIds = classmatesParticipants.map((c) => c._id);
    const classmatesCertificates = await Certificate.find({
      eventId: event._id,
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

    // Return verification info
    return NextResponse.json({
      certificateCode: certificate.certificateCode,
      downloadCount: certificate.downloadCount,
      createdAt: certificate.createdAt,
      participant: {
        name: participant.name,
        email: participant.email,
        college: participant.college,
        registrationId: participant.registrationId || "",
      },
      event: {
        id: event._id.toString(),
        title: event.title,
        description: event.description,
        date: event.date,
        slug: event.slug,
        status: event.status,
        templateUrl: resolveTemplateUrl(event.templateUrl) || "",
        templateSettings: event.templateSettings || {},
        organizerName: organizer ? organizer.name : "N/A",
      },
      classmates,
    });
  } catch (error: any) {
    console.error("GET /api/certificates/[code] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}
