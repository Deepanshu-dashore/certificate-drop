"use strict";

export const dynamic = "force-dynamic";

import { getOrganizerSession } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Certificate, Event, Participant, User } from "@/lib/models";
import { redirect } from "next/navigation";
import EventDetailClient from "./EventDetailClient";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getOrganizerSession();

  if (!session) {
    redirect("/login");
  }

  await dbConnect();

  const user = await User.findById(session.userId);
  const organizerGid = user?.gid || "";

  // Find event and verify ownership
  const eventData = await Event.findOne({
    _id: id,
    organizerId: session.userId,
  });

  if (!eventData) {
    redirect("/dashboard");
  }

  // Fetch participants for this event
  const participantsData = await Participant.find({ eventId: id }).sort({
    createdAt: -1,
  });

  // Fetch certificates to get download counts and codes
  const participantIds = participantsData.map((p) => p._id);
  const certificatesData = await Certificate.find({
    participantId: { $in: participantIds },
  });

  // Map certificates to participants
  const certMap = new Map(
    certificatesData.map((c) => [c.participantId.toString(), c])
  );

  const participants = participantsData.map((p) => {
    const cert = certMap.get(p._id.toString());
    return {
      id: p._id.toString(),
      name: p.name,
      email: p.email,
      college: p.college,
      registrationId: p.registrationId || "",
      certificateCode: cert ? cert.certificateCode : null,
      downloadCount: cert ? cert.downloadCount : 0,
      createdAt: p.createdAt.toISOString(),
    };
  });

  // Serialize Event object safely for client component
  const event = {
    id: eventData._id.toString(),
    title: eventData.title,
    description: eventData.description || "",
    date: eventData.date ? eventData.date.toISOString() : null,
    slug: eventData.slug,
    templateUrl: eventData.templateUrl || "",
    status: eventData.status,
    templateSettings: JSON.parse(JSON.stringify(eventData.templateSettings || {})),
    createdAt: eventData.createdAt.toISOString(),
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-zinc-950 min-h-screen">
      <EventDetailClient event={event} initialParticipants={participants} organizerGid={organizerGid} />
    </div>
  );
}
