"use strict";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import LoginPageClient from "./LoginPageClient";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 dark:bg-zinc-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-sm border border-slate-100 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex flex-col items-center justify-center text-center">
          <Link href="/">
            <img
              src="/logo-dark.png"
              alt="CertDrop Logo"
              className="h-12 w-auto object-contain bg-zinc-950 dark:bg-transparent rounded-lg px-4 py-1.5 mb-4"
            />
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            Welcome to CertDrop
          </h2>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
            Manage, generate, and verify community credentials
          </p>
        </div>

        {/* Client-side form handler */}
        <LoginPageClient />

        <div className="text-center mt-4">
          <Link
            href="/"
            className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
