"use strict";

export const dynamic = "force-dynamic";

import { getOrganizerSession } from "@/lib/auth";
import { Award, CheckCircle2, ChevronRight, Share2, ShieldCheck, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import HeroClient from "./components/HeroClient";

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

      {/* Hero Section with Fluid Animations */}
      <HeroClient hasSession={!!session} />

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
