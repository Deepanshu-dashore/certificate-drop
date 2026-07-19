"use strict";

export const dynamic = "force-dynamic";

import { getOrganizerSession } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Certificate, Event, Participant, User } from "@/lib/models";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getOrganizerSession();

  if (!session) {
    redirect("/login");
  }

  await dbConnect();

  const user = await User.findById(session.userId);
  const updatedSession = {
    userId: session.userId,
    email: user?.email || session.email,
    name: user?.name || session.name,
    avatar: user?.avatar || session.avatar,
    gid: user?.gid || "",
  };

  // Fetch all events for the current organizer
  const eventsData = await Event.find({ organizerId: session.userId }).sort({
    createdAt: -1,
  });

  const eventIds = eventsData.map((e) => e._id);

  // Calculate dashboard stats
  const totalEvents = eventsData.length;

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

  // Convert mongoose documents to plain JS objects for client component safely
  const events = eventsData.map((e) => ({
    id: e._id.toString(),
    title: e.title,
    description: e.description || "",
    date: e.date ? e.date.toISOString() : null,
    slug: e.slug,
    templateUrl: e.templateUrl || "",
    status: e.status,
    createdAt: e.createdAt.toISOString(),
  }));

  const stats = {
    totalEvents,
    totalParticipants,
    totalCertificates,
    totalDownloads,
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-zinc-950 min-h-screen">
      <DashboardClient session={updatedSession} events={events} stats={stats} />
    </div>
  );
}
