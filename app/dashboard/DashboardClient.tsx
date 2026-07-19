"use client";

import {
  Award,
  Calendar,
  CheckCircle,
  Download,
  ExternalLink,
  FileText,
  LogOut,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string | null;
  slug: string;
  templateUrl: string;
  status: string;
  createdAt: string;
}

interface Stats {
  totalEvents: number;
  totalParticipants: number;
  totalCertificates: number;
  totalDownloads: number;
}

interface DashboardClientProps {
  session: {
    userId: string;
    email: string;
    name: string;
    avatar?: string;
    gid?: string;
  };
  events: EventItem[];
  stats: Stats;
}

export default function DashboardClient({
  session,
  events,
  stats,
}: DashboardClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ambassadorGid, setAmbassadorGid] = useState(session.gid || "");
  const [isSavingGid, setIsSavingGid] = useState(false);
  const [gidSuccess, setGidSuccess] = useState<string | null>(null);
  const [gidError, setGidError] = useState<string | null>(null);

  const handleSaveGid = async () => {
    setIsSavingGid(true);
    setGidSuccess(null);
    setGidError(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gid: ambassadorGid.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }
      setGidSuccess("Google Ambassador GID updated successfully!");
      router.refresh();
    } catch (err: any) {
      setGidError(err.message || "An unexpected error occurred");
    } finally {
      setIsSavingGid(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          date,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create event");
      }

      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setDate("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo-dark.png"
              alt="CertDrop Logo"
              className="h-9 w-auto object-contain bg-zinc-950 dark:bg-transparent rounded-lg px-2.5 py-1"
            />
            <span className="text-sm font-semibold tracking-tight text-slate-500 dark:text-zinc-400">
              | Dashboard
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="flex items-center gap-2.5">
              {session.avatar ? (
                <div className="relative h-8 w-8 overflow-hidden rounded-full border border-slate-200 dark:border-zinc-800">
                  <Image
                    src={session.avatar}
                    alt={session.name}
                    fill
                    sizes="32px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {session.name.charAt(0)}
                </div>
              )}
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                  {session.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                  {session.email}
                </p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Card 1 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                Total Events
              </span>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-slate-900 dark:text-zinc-50">
                {stats.totalEvents}
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                Participants
              </span>
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-slate-900 dark:text-zinc-50">
                {stats.totalParticipants}
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                Certificates
              </span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-slate-900 dark:text-zinc-50">
                {stats.totalCertificates}
              </span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                Downloads
              </span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <Download className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-slate-900 dark:text-zinc-50">
                {stats.totalDownloads}
              </span>
            </div>
          </div>
        </div>

        {/* Google Ambassador GID Profile Banner */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-md font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                  Google Developer Ambassador Profile
                  {session.gid && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-800 dark:text-blue-300">
                      Active: {session.gid}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Manage your Ambassador GID and certification credentials.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Enter GID (e.g. GID-98765)"
                value={ambassadorGid}
                onChange={(e) => setAmbassadorGid(e.target.value)}
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <button
                onClick={handleSaveGid}
                disabled={isSavingGid}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 px-4 py-2 text-xs font-semibold transition-colors shrink-0 disabled:opacity-50"
              >
                {isSavingGid ? "Saving..." : "Save GID"}
              </button>
            </div>
          </div>
          {gidSuccess && (
            <p className="mt-2 text-xs font-medium text-green-600 dark:text-green-400">
              {gidSuccess}
            </p>
          )}
          {gidError && (
            <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-450">
              {gidError}
            </p>
          )}
        </div>

        {/* Section header */}
        <div className="mt-12 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-950 dark:text-zinc-50">
              My Events
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Manage your certificate templates and participant lists.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/10 transition-all hover:bg-blue-500 hover:shadow-blue-500/20"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </button>
        </div>

        {/* Events Grid */}
        <div className="mt-6">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-zinc-50">
                No events created yet
              </h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-zinc-400">
                Get started by creating your first event and uploading a certificate template.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500"
              >
                <Plus className="h-4 w-4" />
                Create First Event
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div>
                    {/* Event Status badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          event.status === "published"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            event.status === "published" ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        {event.status === "published" ? "Published" : "Draft"}
                      </span>

                      {event.status === "published" && (
                        <Link
                          href={`/e/${event.slug}${session.gid ? `?gid=${encodeURIComponent(session.gid)}` : ""}`}
                          target="_blank"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
                        >
                          Public Page
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400 line-clamp-2 min-h-[40px]">
                      {event.description || "No description provided."}
                    </p>

                    {event.date && (
                      <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(event.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-4 dark:border-zinc-800">
                    <Link
                      href={`/dashboard/events/${event.id}`}
                      className="flex w-full items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200/80 px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200"
                    >
                      Manage Event
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-50">
              Create New Event
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
              Set up a portal to generate and verify certificates.
            </p>

            <form onSubmit={handleCreateEvent} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js Developer Bootcamp"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Tell participants what this event was about..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-700 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Event Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-700"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
