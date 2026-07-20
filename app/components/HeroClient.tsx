"use client";

import { Award, CheckCircle2, ChevronRight, Share2, ShieldCheck, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface HeroClientProps {
  hasSession: boolean;
}

export default function HeroClient({ hasSession }: HeroClientProps) {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const badgeVariants: any = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="relative overflow-hidden py-20 sm:py-28 flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
      {/* Background glow graphics */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-600/5 animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[10%] right-[20%] w-[450px] h-[450px] rounded-full bg-indigo-500/10 blur-[100px] dark:bg-indigo-600/5 animate-pulse duration-[10000ms]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.4] dark:bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] dark:opacity-[0.15]" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-5xl text-center space-y-10"
      >
        {/* Animated Badge */}
        <motion.div variants={badgeVariants} className="flex justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-teal-500/10 px-4 py-2 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/10 shadow-sm backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 animate-pulse" />
            Built for Google Ambassadors & Tech Organizers
          </div>
        </motion.div>

        {/* Heading & Subtitle */}
        <div className="space-y-5">
          <motion.h1
            variants={itemVariants}
            className="text-5xl font-extrabold tracking-tight text-slate-950 dark:text-zinc-50 sm:text-7xl leading-[1.1]"
          >
            Generate. Share.{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-teal-400 bg-clip-text text-transparent">
              Verify.
            </span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-600 dark:text-zinc-400 leading-relaxed font-medium"
          >
            Ditch the manual Google Drive uploads and email PDFs one by one. CertDrop is the centralized portal where organizers generate certificates and participants search & download verified copies instantly.
          </motion.p>
        </div>

        {/* Animated Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <Link
            href={hasSession ? "/dashboard" : "/login"}
            className="group relative flex w-full sm:w-auto items-center justify-center gap-2 overflow-hidden rounded-2xl bg-blue-600 px-7 py-4 text-base font-semibold text-white shadow-xl shadow-blue-500/25 hover:bg-blue-500 transition-all duration-300 hover:scale-[1.02]"
          >
            Start Generating Certificates
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1 duration-300" />
          </Link>
          <Link
            href="/verify"
            className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur px-7 py-4 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all duration-300 hover:scale-[1.02]"
          >
            <CheckCircle2 className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
            Verify Authenticity
          </Link>
        </motion.div>

        {/* Animated Feature Grid */}
        <motion.div
          variants={itemVariants}
          className="grid gap-6 sm:grid-cols-3 pt-12"
        >
          {/* Card 1 */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/40 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all"
          >
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shadow-inner">
              <Upload className="h-5.5 w-5.5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-zinc-50">1. Upload Template & CSV</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Upload your certificate design PNG and a list of participants. Define text overlay placement coordinates visually.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/40 shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all"
          >
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 shadow-inner">
              <Share2 className="h-5.5 w-5.5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-zinc-50">2. Share One Single Link</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Publish your event and share one link. Participants search for their certificate and download PDF copies instantly.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-md p-6 text-center dark:border-zinc-800 dark:bg-zinc-900/40 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all"
          >
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 shadow-inner">
              <Award className="h-5.5 w-5.5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-zinc-50">3. Verification Built-In</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
              Every certificate contains a unique code and validation QR code to prevent forged certificate credentials.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
