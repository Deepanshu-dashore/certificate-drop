"use strict";

export const dynamic = "force-dynamic";

import { getOrganizerSession } from "@/lib/auth";
import { Award, CheckCircle2, ChevronRight, Share2, ShieldCheck, Sparkles, Upload } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  const session = await getOrganizerSession();

  return (
    <div className="flex-1 bg-slate-50 dark:bg-zinc-950 min-h-screen flex flex-col justify-between">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo-dark.png"
              alt="CertDrop Logo"
              className="h-10 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/verify"
              className="text-sm font-semibold text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Verify Certificate
            </Link>
            <Link
              href={session ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/10 hover:bg-blue-500 hover:shadow-blue-500/20 transition-all"
            >
              {session ? "Organizer Dashboard" : "Sign In"}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30">
            <Sparkles className="h-3.5 w-3.5" />
            Built for Google Ambassadors & Tech Organizers
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 dark:text-zinc-50 sm:text-6xl">
              Generate. Share. Verify.
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-zinc-400 leading-relaxed">
              Ditch the manual Google Drive uploads and email PDFs one by one. CertDrop is the centralized portal where organizers generate certificates and participants search & download verified copies instantly.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href={session ? "/dashboard" : "/login"}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 hover:translate-y-[-1px] transition-all duration-200"
            >
              Start Generating Certificates
              <ChevronRight className="h-5 w-5" />
            </Link>
            <Link
              href="/verify"
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all"
            >
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
              Verify Authenticity
            </Link>
          </div>

          {/* Feature Grid */}
          <div className="grid gap-6 sm:grid-cols-3 pt-16">
            <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Upload className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-zinc-50">1. Upload Template & CSV</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
                Upload your certificate design PNG and a list of participants. Define text overlay placement coordinates visually.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                <Share2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-zinc-50">2. Share One Single Link</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
                Publish your event and share one link. Participants search for their certificate and download PDF copies instantly.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-zinc-50">3. Verification Built-In</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
                Every certificate contains a unique code and validation QR code to prevent forged certificate credentials.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-zinc-500">
          <div>
            © {new Date().getFullYear()} CertDrop. All rights reserved.
          </div>
          <div className="flex gap-4">
            <Link href="/verify" className="hover:text-slate-700 dark:hover:text-zinc-300">Verification Registry</Link>
            <span className="text-slate-350 dark:text-zinc-800">•</span>
            <Link href={session ? "/dashboard" : "/login"} className="hover:text-slate-700 dark:hover:text-zinc-300">Ambassador Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
