"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, Home, Search, Share2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function VerifyContent() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [nameOrRegId, setNameOrRegId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedClassmateIndex, setCopiedClassmateIndex] = useState<number | null>(null);

  // Preview coordinates scaling helper
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalWidth, setNaturalWidth] = useState(1920);
  const [naturalHeight, setNaturalHeight] = useState(1080);
  const [previewWidth, setPreviewWidth] = useState(600);
  const [previewHeight, setPreviewHeight] = useState(337);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Initialize from search params
  useEffect(() => {
    const idParam = searchParams.get("id") || searchParams.get("code") || searchParams.get("certificateId") || searchParams.get("certId") || searchParams.get("certificateCode") || "";
    const emailParam = searchParams.get("email") || "";
    const nameOrRegIdParam = searchParams.get("nameOrRegId") || searchParams.get("registrationId") || searchParams.get("regId") || searchParams.get("gid") || "";

    if (idParam) setCode(idParam.toUpperCase());
    if (emailParam) setEmail(emailParam);
    if (nameOrRegIdParam) setNameOrRegId(nameOrRegIdParam);

    // Auto verify if all params are present
    if (idParam && emailParam && nameOrRegIdParam) {
      triggerVerify(idParam.toUpperCase(), emailParam, nameOrRegIdParam);
    }
  }, [searchParams]);

  // Clear previous results/previews if inputs are changed
  const handleInputChange = (field: string, val: string) => {
    if (field === "code") setCode(val.toUpperCase());
    else if (field === "email") setEmail(val);
    else if (field === "nameOrRegId") setNameOrRegId(val);

    // Clear previous details & preview
    setResult(null);
    setError(null);
  };

  const triggerVerify = async (c: string, em: string, nr: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/certificates/${c.trim().toUpperCase()}?email=${encodeURIComponent(em.trim())}&nameOrRegId=${encodeURIComponent(nr.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Verification failed. Please double-check your inputs.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !email.trim() || !nameOrRegId.trim()) return;
    triggerVerify(code, email, nameOrRegId);
  };

  const handleShareLink = () => {
    if (!result) return;
    const shareUrl = `${window.location.origin}/verify?id=${code}&email=${encodeURIComponent(email)}&nameOrRegId=${encodeURIComponent(nameOrRegId)}&gid=${encodeURIComponent(result.participant.registrationId || "")}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Preview dimensions scaling
  const updatePreviewSize = () => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth;
      setPreviewWidth(w);
      const ratio = w / naturalWidth;
      setPreviewHeight(naturalHeight * ratio);
    }
  };

  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      const img = imageRef.current;
      setNaturalWidth(img.naturalWidth || 1920);
      setNaturalHeight(img.naturalHeight || 1080);
      setIsImageLoaded(true);
    }
  }, [result?.event?.templateUrl]);

  useEffect(() => {
    if (isImageLoaded) {
      updatePreviewSize();
      window.addEventListener("resize", updatePreviewSize);
    }
    return () => window.removeEventListener("resize", updatePreviewSize);
  }, [isImageLoaded, naturalWidth, naturalHeight]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setNaturalWidth(e.currentTarget.naturalWidth || 1920);
    setNaturalHeight(e.currentTarget.naturalHeight || 1080);
    setIsImageLoaded(true);
  };

  const getCssFontFamily = (fontSetting?: string) => {
    if (!fontSetting) return "";
    if (fontSetting.startsWith("Times")) return "font-serif";
    if (fontSetting.startsWith("Courier")) return "font-mono";
    return "font-sans";
  };

  const getCssFontWeight = (fontSetting?: string) => {
    if (!fontSetting) return "";
    if (fontSetting.endsWith("Bold")) return "font-bold";
    return "font-normal";
  };

  const scale = previewWidth / naturalWidth;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center">
      {/* Verify Box */}
      <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            Verify Certificate Authenticity
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
            Enter the certificate details below to verify cryptographic status and unlock downloading/previewing.
          </p>
        </div>

        <form onSubmit={handleVerifySubmit} className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Certificate ID
              </label>
              <input
                type="text"
                required
                disabled={!!searchParams.get("id") || !!searchParams.get("code")}
                placeholder="e.g. CD-A1B2-C3D4"
                value={code}
                onChange={(e) => handleInputChange("code", e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-mono text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Registered Email
              </label>
              <input
                type="email"
                required
                placeholder="e.g. email@example.com"
                value={email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Name or GID of Ambassador
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe or REG-1234"
                value={nameOrRegId}
                onChange={(e) => handleInputChange("nameOrRegId", e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !code.trim() || !email.trim() || !nameOrRegId.trim()}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 disabled:opacity-55 cursor-pointer transition-all"
          >
            {isLoading ? (
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Verify Authenticity</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        )}
      </div>

      {/* Verification Result details */}
      {result && (
        <div className="mt-8 space-y-6">
          <div className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-md dark:border-emerald-950/20 dark:bg-zinc-900/60 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 h-32 w-32 bg-emerald-500/10 rounded-full blur-2xl" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 mb-3">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">
                  Verified Authentic Certificate
                </h2>
                <span className="mt-1.5 font-mono text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-3 py-1 rounded-full">
                  ID: {result.certificateCode}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <a
                  href={`/api/certificates/${result.certificateCode}?download=true&email=${encodeURIComponent(email)}&nameOrRegId=${encodeURIComponent(nameOrRegId)}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-500 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
                <button
                  onClick={handleShareLink}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  {copied ? "Copied Link!" : "Share Link"}
                </button>
              </div>
            </div>

            {/* Certificate metadata table */}
            <div className="mt-8 space-y-4 border-t border-slate-100 dark:border-zinc-800 pt-6 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-zinc-800/40">
                <span className="text-slate-500 dark:text-zinc-400">Recipient Name</span>
                <span className="font-semibold text-slate-900 dark:text-zinc-100">{result.participant.name}</span>
              </div>
              {result.participant.registrationId && (
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-zinc-800/40">
                  <span className="text-slate-500 dark:text-zinc-400">GID of Ambassador</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100">{result.participant.registrationId}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-zinc-800/40">
                <span className="text-slate-500 dark:text-zinc-400">Institution / College</span>
                <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right max-w-[320px] truncate">{result.participant.college}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-zinc-800/40">
                <span className="text-slate-500 dark:text-zinc-400">Event Title</span>
                <span className="font-semibold text-slate-900 dark:text-zinc-100 text-right max-w-[320px] truncate">{result.event.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-zinc-800/40">
                <span className="text-slate-500 dark:text-zinc-400">Date of Event</span>
                <span className="font-semibold text-slate-900 dark:text-zinc-100">
                  {result.event.date
                    ? new Date(result.event.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-zinc-800/40">
                <span className="text-slate-500 dark:text-zinc-400">Organized By</span>
                <span className="font-semibold text-slate-900 dark:text-zinc-100">{result.event.organizerName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-zinc-400">Downloads count</span>
                <span className="font-semibold text-slate-900 dark:text-zinc-100">{result.downloadCount} downloads</span>
              </div>
            </div>
          </div>

          {/* Classmates same university share */}
          {result.classmates && result.classmates.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 animate-fade-in">
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-3">
                Classmates from {result.participant.college}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 max-h-60 overflow-y-auto pr-1">
                {result.classmates.map((classmate: any, index: number) => {
                  const classmateUrl = `${window.location.origin}/verify?id=${classmate.certificateCode}&email=${encodeURIComponent(classmate.email)}&nameOrRegId=${encodeURIComponent(classmate.name)}&gid=${encodeURIComponent(classmate.registrationId || "")}`;
                  return (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 text-xs">
                      <div className="truncate pr-2">
                        <p className="font-semibold text-slate-900 dark:text-zinc-100 truncate">{classmate.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {classmate.certificateCode}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(classmateUrl);
                          setCopiedClassmateIndex(index);
                          setTimeout(() => setCopiedClassmateIndex(null), 2000);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 shrink-0"
                      >
                        <Share2 className="h-3 w-3" />
                        {copiedClassmateIndex === index ? "Copied!" : "Share Link"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Certificate visual rendering preview */}
          {result.event.templateUrl && result.event.templateSettings && (
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Digital Preview
              </span>
              <div
                ref={containerRef}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-md dark:border-zinc-800 select-none"
                style={{ height: isImageLoaded ? previewHeight : "337px" }}
              >
                <img
                  ref={imageRef}
                  src={result.event.templateUrl}
                  alt="Certificate Preview"
                  onLoad={handleImageLoad}
                  className="w-full h-auto pointer-events-none"
                />

                {isImageLoaded && (
                  <>
                    {/* Name */}
                    {result.event.templateSettings.name?.show !== false && (
                      <div
                        style={{
                          left: `${result.event.templateSettings.name.x * scale}px`,
                          top: `${result.event.templateSettings.name.y * scale}px`,
                          fontSize: `${result.event.templateSettings.name.fontSize * scale}px`,
                          color: result.event.templateSettings.name.color,
                        }}
                        className={`absolute whitespace-nowrap origin-top-left ${
                          getCssFontFamily(result.event.templateSettings.name.font)
                        } ${
                          getCssFontWeight(result.event.templateSettings.name.font)
                        }`}
                      >
                        {result.participant.name}
                      </div>
                    )}

                    {/* Email */}
                    {result.event.templateSettings.email?.show !== false && (
                      <div
                        style={{
                          left: `${result.event.templateSettings.email.x * scale}px`,
                          top: `${result.event.templateSettings.email.y * scale}px`,
                          fontSize: `${result.event.templateSettings.email.fontSize * scale}px`,
                          color: result.event.templateSettings.email.color,
                        }}
                        className={`absolute whitespace-nowrap origin-top-left ${
                          getCssFontFamily(result.event.templateSettings.email.font)
                        } ${
                          getCssFontWeight(result.event.templateSettings.email.font)
                        }`}
                      >
                        {result.participant.email}
                      </div>
                    )}

                    {/* College */}
                    {result.event.templateSettings.college?.show !== false && (
                      <div
                        style={{
                          left: `${result.event.templateSettings.college.x * scale}px`,
                          top: `${result.event.templateSettings.college.y * scale}px`,
                          fontSize: `${result.event.templateSettings.college.fontSize * scale}px`,
                          color: result.event.templateSettings.college.color,
                        }}
                        className={`absolute whitespace-nowrap origin-top-left ${
                          getCssFontFamily(result.event.templateSettings.college.font)
                        } ${
                          getCssFontWeight(result.event.templateSettings.college.font)
                        }`}
                      >
                        {result.participant.college}
                      </div>
                    )}

                    {/* Event Title */}
                    {result.event.templateSettings.event?.show !== false && (
                      <div
                        style={{
                          left: `${result.event.templateSettings.event.x * scale}px`,
                          top: `${result.event.templateSettings.event.y * scale}px`,
                          fontSize: `${result.event.templateSettings.event.fontSize * scale}px`,
                          color: result.event.templateSettings.event.color,
                        }}
                        className={`absolute whitespace-nowrap origin-top-left ${
                          getCssFontFamily(result.event.templateSettings.event.font)
                        } ${
                          getCssFontWeight(result.event.templateSettings.event.font)
                        }`}
                      >
                        {result.event.title}
                      </div>
                    )}

                    {/* Date */}
                    {result.event.templateSettings.date?.show !== false && (
                      <div
                        style={{
                          left: `${result.event.templateSettings.date.x * scale}px`,
                          top: `${result.event.templateSettings.date.y * scale}px`,
                          fontSize: `${result.event.templateSettings.date.fontSize * scale}px`,
                          color: result.event.templateSettings.date.color,
                        }}
                        className={`absolute whitespace-nowrap origin-top-left ${
                          getCssFontFamily(result.event.templateSettings.date.font)
                        } ${
                          getCssFontWeight(result.event.templateSettings.date.font)
                        }`}
                      >
                        {result.event.date
                          ? new Date(result.event.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : ""}
                      </div>
                    )}

                    {/* Certificate Code */}
                    {result.event.templateSettings.certificateId?.show !== false && (
                      <div
                        style={{
                          left: `${result.event.templateSettings.certificateId.x * scale}px`,
                          top: `${result.event.templateSettings.certificateId.y * scale}px`,
                          fontSize: `${result.event.templateSettings.certificateId.fontSize * scale}px`,
                          color: result.event.templateSettings.certificateId.color,
                        }}
                        className={`absolute whitespace-nowrap origin-top-left ${
                          getCssFontFamily(result.event.templateSettings.certificateId.font)
                        } ${
                          getCssFontWeight(result.event.templateSettings.certificateId.font)
                        }`}
                      >
                        {result.certificateCode}
                      </div>
                    )}

                    {/* Registration ID */}
                    {result.event.templateSettings.registrationId?.show !== false && (
                      <div
                        style={{
                          left: `${result.event.templateSettings.registrationId.x * scale}px`,
                          top: `${result.event.templateSettings.registrationId.y * scale}px`,
                          fontSize: `${result.event.templateSettings.registrationId.fontSize * scale}px`,
                          color: result.event.templateSettings.registrationId.color,
                        }}
                        className={`absolute whitespace-nowrap origin-top-left ${
                          getCssFontFamily(result.event.templateSettings.registrationId.font)
                        } ${
                          getCssFontWeight(result.event.templateSettings.registrationId.font)
                        }`}
                      >
                        {result.participant.registrationId}
                      </div>
                    )}

                    {/* QR Code */}
                    {result.event.templateSettings.qrCode?.show !== false && (
                      <div
                        style={{
                          left: `${result.event.templateSettings.qrCode.x * scale}px`,
                          top: `${result.event.templateSettings.qrCode.y * scale}px`,
                          width: `${result.event.templateSettings.qrCode.size * scale}px`,
                          height: `${result.event.templateSettings.qrCode.size * scale}px`,
                        }}
                        className="absolute border border-slate-300 bg-white p-0.5 flex items-center justify-center"
                      >
                        <div className="relative w-full h-full border border-slate-200">
                          <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border border-slate-800 bg-white" />
                          <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border border-slate-800 bg-white" />
                          <div className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border border-slate-800 bg-white" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GeneralVerifyPage() {
  return (
    <div className="flex-1 bg-slate-50 dark:bg-zinc-950 min-h-screen flex flex-col justify-between">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo-dark.png"
              alt="CertDrop Logo"
              className="h-8 w-auto object-contain"
            />
            <span className="text-sm font-semibold tracking-tight text-slate-500 dark:text-zinc-400">
              | Verify
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
      <Suspense fallback={
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-16 sm:px-6 lg:px-8 flex flex-col justify-center text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-12 w-12 bg-slate-200 rounded-full mx-auto" />
            <div className="h-6 bg-slate-200 rounded w-1/2 mx-auto" />
            <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto" />
          </div>
        </main>
      }>
        <VerifyContent />
      </Suspense>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-slate-400 dark:text-zinc-500">
          Powered by <span className="font-bold text-slate-600 dark:text-zinc-400">CertDrop</span>. All certificates are cryptographically verifiable.
        </div>
      </footer>
    </div>
  );
}
