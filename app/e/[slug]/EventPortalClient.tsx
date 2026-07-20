"use client";

import { Award, Download, ExternalLink, Search, Share2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getUrls } from "@/lib/utils/geturl";

interface EventPortalClientProps {
  event: {
    id: string;
    title: string;
    description: string;
    date: string | null;
    templateUrl: string;
    slug: string;
  };
  ambassadorName?: string;
}

export default function EventPortalClient({ event, ambassadorName }: EventPortalClientProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    participant: {
      name: string;
      email: string;
      college: string;
      registrationId?: string;
    };
    certificateCode: string;
    certificateIdSource?: string;
    classmates?: any[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedClassmateIndex, setCopiedClassmateIndex] = useState<number | null>(null);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);

  // Search certificate logic
  const searchCertificate = async (searchName: string, searchEmail: string, searchRegId: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams();
      params.append("name", searchName.trim());
      params.append("email", searchEmail.trim());
      params.append("registrationId", searchRegId.trim());

      const res = await fetch(`/api/events/${event.id}/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResult(data);

      // Fetch event template settings to render preview coordinates correctly
      const eventRes = await fetch(`/api/events/${event.id}`);
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setSettings(eventData.event.templateSettings);
      }
    } catch (err: any) {
      setError(err.message || "No certificate found matching the provided details.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch certificate directly by code/ID
  const fetchCertificateByCode = async (cCode: string, cEmail: string, cNameOrGid: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/certificates/${cCode.trim().toUpperCase()}?email=${encodeURIComponent(cEmail.trim())}&nameOrRegId=${encodeURIComponent(cNameOrGid.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load certificate");
      }

      setResult(data);

      // Fetch event template settings to render preview coordinates correctly
      const eventRes = await fetch(`/api/events/${event.id}`);
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setSettings(eventData.event.templateSettings);
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify certificate.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlRegId = params.get("gid") || params.get("registrationId") || params.get("regId") || "";
      const urlName = params.get("name") || "";
      const urlEmail = params.get("email") || "";
      const urlCertId = params.get("certificateId") || params.get("code") || params.get("id") || "";

      if (urlRegId) setRegistrationId(urlRegId);
      if (urlName) setName(urlName);
      if (urlEmail) setEmail(urlEmail);

      if (urlCertId.trim() && urlEmail.trim() && (urlName.trim() || urlRegId.trim())) {
        fetchCertificateByCode(urlCertId, urlEmail, urlName.trim() || urlRegId.trim());
      } else if (urlRegId.trim() && urlName.trim() && urlEmail.trim()) {
        searchCertificate(urlName, urlEmail, urlRegId);
      }
    }
  }, []);

  // Preview coordinates scaling helper
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalWidth, setNaturalWidth] = useState(1920);
  const [naturalHeight, setNaturalHeight] = useState(1080);
  const [previewWidth, setPreviewWidth] = useState(600);
  const [previewHeight, setPreviewHeight] = useState(337);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !registrationId.trim()) return;
    await searchCertificate(name, email, registrationId);
  };

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
  }, [event.templateUrl]);

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
    <div className="space-y-8">
      {/* Search form box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {ambassadorName && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl bg-blue-50/50 p-4 border border-blue-100/60 dark:bg-blue-950/10 dark:border-blue-900/30">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              <div className="text-sm">
                <span className="text-slate-500 dark:text-zinc-400">Referred by Ambassador: </span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{ambassadorName}</span>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              Verified Referral
            </span>
          </div>
        )}
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Registered Name
              </label>fix error

              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Registered Email
              </label>
              <input
                type="email"
                required
                placeholder="e.g. john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                GID of Ambassador
              </label>
              <input
                type="text"
                required
                placeholder="e.g. REG-1234"
                value={registrationId}
                onChange={(e) => setRegistrationId(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim() || !email.trim() || !registrationId.trim()}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 disabled:opacity-55 cursor-pointer disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Find Certificate</span>
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

      {/* Result showcase */}
      {result && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {/* Top row: Name & College on left, Badge & ID on right */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-4 mb-4 text-center sm:text-left">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-50 capitalize">
                  {result.participant.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                  {result.participant.college}
                </p>
              </div>
              <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
                {/* Gradient Verified Badge */}
                <div className="bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 p-[1px] rounded-full w-fit select-none">
                  <div className="bg-white dark:bg-zinc-900 px-3 py-0.5 rounded-full flex items-center gap-1.5 text-[10px] font-bold">
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                    <span className="text-slate-700 dark:text-zinc-300">Certificate Found</span>
                    <span className="text-emerald-500 dark:text-emerald-400">& Verified</span>
                  </div>
                </div>
                {/* Certificate ID */}
                <span className="font-mono text-[10px] bg-slate-50 dark:bg-zinc-800/40 px-2 py-0.5 rounded text-slate-500 dark:text-zinc-400 border border-slate-100 dark:border-zinc-800">
                  ID: {result.certificateCode}
                </span>
              </div>
            </div>

            {/* Bottom row: Compact Action Buttons */}
            <div className="flex flex-wrap gap-2 items-center justify-center sm:justify-start">
              <a
                href={`/api/certificates/${result.certificateCode}?download=true&email=${encodeURIComponent(result.participant.email)}&nameOrRegId=${encodeURIComponent(result.participant.registrationId || result.participant.name)}`}
                className="flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </a>
              <a
                href={`/verify?id=${result.certificateCode}&email=${encodeURIComponent(result.participant.email)}&nameOrRegId=${encodeURIComponent(result.participant.registrationId || result.participant.name)}`}
                target="_blank"
                className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-colors whitespace-nowrap"
              >
                Verify Authenticity
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => {
                  const portalUrl = `${window.location.origin}/e/${event.slug}?code=${result.certificateCode}&email=${encodeURIComponent(result.participant.email)}&name=${encodeURIComponent(result.participant.name)}${result.participant.registrationId ? `&gid=${encodeURIComponent(result.participant.registrationId)}` : ""}`;
                  navigator.clipboard.writeText(portalUrl);
                  setCopiedPortalLink(true);
                  setTimeout(() => setCopiedPortalLink(false), 2000);
                }}
                className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Share2 className="h-3.5 w-3.5" />
                {copiedPortalLink ? "Copied Link!" : "Share Link"}
              </button>
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
                  const classmateUrl = `${window.location.origin}/e/${event.slug}?code=${classmate.certificateCode}&email=${encodeURIComponent(classmate.email)}&name=${encodeURIComponent(classmate.name)}${classmate.registrationId ? `&gid=${encodeURIComponent(classmate.registrationId)}` : ""}`;
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

          {/* Certificate Visual Preview overlay */}
          {event.templateUrl && settings && (
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
                  src={getUrls.getUrl(event.templateUrl)}
                  alt="Certificate Preview"
                  onLoad={handleImageLoad}
                  className="w-full h-auto pointer-events-none"
                />

                {isImageLoaded && (
                  <>
                    {/* Name */}
                    {settings.name?.show !== false && (
                      <div
                        style={{
                          left: `${settings.name.x * scale}px`,
                          top: `${settings.name.y * scale}px`,
                          fontSize: `${settings.name.fontSize * scale}px`,
                          color: settings.name.color,
                        }}
                        className={`absolute whitespace-nowrap origin-top-left ${getCssFontFamily(settings.name.font)
                          } ${getCssFontWeight(settings.name.font)
                          }`}
                      >
                        {result.participant.name}
                      </div>
                    )}

                    {/* Email */}
                    {settings.email?.show !== false && (
                      <div
                        style={{
                          left: `${settings.email.x * scale}px`,
                          top: `${settings.email.y * scale}px`,
                          fontSize: `${settings.email.fontSize * scale}px`,
                          color: settings.email.color,
                        }}
                        className={`absolute whitespace-nowrap origin-top-left ${getCssFontFamily(settings.email.font)
                          } ${getCssFontWeight(settings.email.font)
                          }`}
                      >
                        {result.participant.email}
                      </div>
                    )}

                    {/* College */}
                    {settings.college?.show !== false && (
                      <div
                        style={{
                          left: `${settings.college.x * scale}px`,
                          top: `${settings.college.y * scale}px`,
                          fontSize: `${settings.college.fontSize * scale}px`,
                          color: settings.college.color,
                        }}
                        className={`absolute whitespace-nowrap origin-top-left ${getCssFontFamily(settings.college.font)
                          } ${getCssFontWeight(settings.college.font)
                          }`}
                      >
                        {result.participant.college}
                      </div>
                    )}

                    {/* Event Title */}
                    {settings.event?.show !== false && (
                      <div
                        style={{
                          left: `${settings.event.x * scale}px`,
                          top: `${settings.event.y * scale}px`,
                          fontSize: `${settings.event.fontSize * scale}px`,
                          color: settings.event.color,
                        }}
                        className={`absolute whitespace-nowrap origin-top-left ${getCssFontFamily(settings.event.font)
                          } ${getCssFontWeight(settings.event.font)
                          }`}
                      >
                        {event.title}
                      </div>
                    )}

                    {/* Date */}
                    {settings.date?.show !== false && (
                      <div
                        style={{
                          left: `${settings.date.x * scale}px`,
                          top: `${settings.date.y * scale}px`,
                          fontSize: `${settings.date.fontSize * scale}px`,
                          color: settings.date.color,
                        }}
                        className={`absolute whitespace-nowrap origin-top-left ${getCssFontFamily(settings.date.font)
                          } ${getCssFontWeight(settings.date.font)
                          }`}
                      >
                        {event.date
                          ? new Date(event.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                          : ""}
                      </div>
                    )}

                    {/* Certificate Code */}
                    {settings.certificateId?.show !== false && (
                      <div
                        style={{
                          left: `${settings.certificateId.x * scale}px`,
                          top: `${settings.certificateId.y * scale}px`,
                          fontSize: `${settings.certificateId.fontSize * scale}px`,
                          color: settings.certificateId.color,
                        }}
                        className={`absolute whitespace-nowrap origin-top-left ${getCssFontFamily(settings.certificateId.font)
                          } ${getCssFontWeight(settings.certificateId.font)
                          }`}
                      >
                        {result.certificateCode}
                      </div>
                    )}

                    {/* Registration ID */}
                    {settings.registrationId?.show !== false && (
                      <div
                        style={{
                          left: `${settings.registrationId.x * scale}px`,
                          top: `${settings.registrationId.y * scale}px`,
                          fontSize: `${settings.registrationId.fontSize * scale}px`,
                          color: settings.registrationId.color,
                        }}
                        className={`absolute whitespace-nowrap origin-top-left ${getCssFontFamily(settings.registrationId.font)
                          } ${getCssFontWeight(settings.registrationId.font)
                          }`}
                      >
                        {result.participant.registrationId}
                      </div>
                    )}

                    {/* QR Code */}
                    {settings.qrCode?.show !== false && (
                      <div
                        style={{
                          left: `${settings.qrCode.x * scale}px`,
                          top: `${settings.qrCode.y * scale}px`,
                          width: `${settings.qrCode.size * scale}px`,
                          height: `${settings.qrCode.size * scale}px`,
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
