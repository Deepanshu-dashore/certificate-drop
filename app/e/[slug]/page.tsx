"use strict";

export const dynamic = "force-dynamic";

import dbConnect from "@/lib/db";
import { Event, User } from "@/lib/models";
import { Award, Calendar, Home } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import EventPortalClient from "./EventPortalClient";

export default async function EventPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const { gid } = await searchParams;

  await dbConnect();

  // Find the event and ensure it is published
  const eventData = await Event.findOne({ slug, status: "published" });

  if (!eventData) {
    notFound();
  }

  // Find ambassador if gid is provided in searchParams
  let ambassadorName = "";
  if (gid && typeof gid === "string") {
    const ambassador = await User.findOne({ gid });
    if (ambassador) {
      ambassadorName = ambassador.name;
    }
  }

  const event = {
    id: eventData._id.toString(),
    title: eventData.title,
    description: eventData.description || "",
    date: eventData.date ? eventData.date.toISOString() : null,
    templateUrl: eventData.templateUrl || "",
    slug: eventData.slug,
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-zinc-950 min-h-screen flex flex-col justify-between">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo-dark.png"
              alt="CertDrop Logo"
              className="h-8 w-auto object-contain bg-zinc-950 dark:bg-transparent rounded-lg px-2 py-0.5"
            />
            <span className="text-sm font-semibold tracking-tight text-slate-500 dark:text-zinc-400">
              | Portal
            </span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-zinc-300 font-semibold"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-zinc-50 sm:text-4xl">
            {event.title}
          </h1>
          <p className="mt-3 text-base text-slate-500 dark:text-zinc-400 max-w-xl mx-auto">
            {event.description || "Enter your details below to find and download your verified completion certificate."}
          </p>

          {event.date && (
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400">
              <Calendar className="h-4 w-4 text-blue-500" />
              Event Date:{" "}
              {new Date(event.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}
        </div>

        {/* Client component for interactive search & preview */}
        <EventPortalClient event={event} ambassadorName={ambassadorName} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-slate-400 dark:text-zinc-500">
          Powered by <span className="font-bold text-slate-600 dark:text-zinc-400">CertDrop</span>. All certificates are cryptographically verifiable.
        </div>
      </footer>
    </div>
  );
}
