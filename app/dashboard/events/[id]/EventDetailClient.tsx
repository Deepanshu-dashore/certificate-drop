"use client";

import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle,
  Copy,
  Download,
  ExternalLink,
  Info,
  Layout,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Trash,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getUrls } from "@/lib/utils/geturl";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { useEffect, useRef, useState } from "react";

interface PlaceholderConfig {
  x: number;
  y: number;
  fontSize: number;
  color: string;
  show?: boolean;
  font?: string;
}

interface TemplateSettings {
  name: PlaceholderConfig;
  email: PlaceholderConfig;
  college: PlaceholderConfig;
  event: PlaceholderConfig;
  date: PlaceholderConfig;
  certificateId: PlaceholderConfig;
  registrationId: PlaceholderConfig;
  qrCode: {
    x: number;
    y: number;
    size: number;
    show?: boolean;
  };
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string | null;
  slug: string;
  templateUrl: string;
  status: string;
  templateSettings: TemplateSettings;
  createdAt: string;
}

interface ParticipantItem {
  id: string;
  name: string;
  email: string;
  college: string;
  registrationId: string;
  certificateCode: string | null;
  downloadCount: number;
  createdAt: string;
}

interface EventDetailClientProps {
  event: EventItem;
  initialParticipants: ParticipantItem[];
  organizerGid: string;
}

export default function EventDetailClient({
  event,
  initialParticipants,
  organizerGid,
}: EventDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"design" | "participants" | "settings">("design");
  const [participants, setParticipants] = useState<ParticipantItem[]>(initialParticipants);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedParticipantId, setCopiedParticipantId] = useState<string | null>(null);

  // Event Details State
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [date, setDate] = useState(event.date ? event.date.substring(0, 10) : "");
  const [status, setStatus] = useState(event.status);
  const [certificateIdSource, setCertificateIdSource] = useState((event as any).certificateIdSource || "code");

  // Manual Participant Form State
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualCollege, setManualCollege] = useState("");
  const [manualRegId, setManualRegId] = useState("");
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  // Template settings state
  const [templateUrl, setTemplateUrl] = useState(event.templateUrl);
  const [settings, setSettings] = useState<TemplateSettings>({
    name: {
      x: event.templateSettings?.name?.x ?? 400,
      y: event.templateSettings?.name?.y ?? 300,
      fontSize: event.templateSettings?.name?.fontSize ?? 36,
      color: event.templateSettings?.name?.color ?? "#1e293b",
      show: event.templateSettings?.name?.show ?? true,
      font: event.templateSettings?.name?.font ?? "Helvetica-Bold",
    },
    email: {
      x: event.templateSettings?.email?.x ?? 400,
      y: event.templateSettings?.email?.y ?? 220,
      fontSize: event.templateSettings?.email?.fontSize ?? 16,
      color: event.templateSettings?.email?.color ?? "#64748b",
      show: event.templateSettings?.email?.show ?? true,
      font: event.templateSettings?.email?.font ?? "Helvetica",
    },
    college: {
      x: event.templateSettings?.college?.x ?? 400,
      y: event.templateSettings?.college?.y ?? 260,
      fontSize: event.templateSettings?.college?.fontSize ?? 18,
      color: event.templateSettings?.college?.color ?? "#475569",
      show: event.templateSettings?.college?.show ?? true,
      font: event.templateSettings?.college?.font ?? "Helvetica",
    },
    event: {
      x: event.templateSettings?.event?.x ?? 400,
      y: event.templateSettings?.event?.y ?? 380,
      fontSize: event.templateSettings?.event?.fontSize ?? 28,
      color: event.templateSettings?.event?.color ?? "#2563eb",
      show: event.templateSettings?.event?.show ?? true,
      font: event.templateSettings?.event?.font ?? "Helvetica-Bold",
    },
    date: {
      x: event.templateSettings?.date?.x ?? 400,
      y: event.templateSettings?.date?.y ?? 150,
      fontSize: event.templateSettings?.date?.fontSize ?? 16,
      color: event.templateSettings?.date?.color ?? "#64748b",
      show: event.templateSettings?.date?.show ?? true,
      font: event.templateSettings?.date?.font ?? "Helvetica",
    },
    certificateId: {
      x: event.templateSettings?.certificateId?.x ?? 100,
      y: event.templateSettings?.certificateId?.y ?? 100,
      fontSize: event.templateSettings?.certificateId?.fontSize ?? 12,
      color: event.templateSettings?.certificateId?.color ?? "#94a3b8",
      show: event.templateSettings?.certificateId?.show ?? true,
      font: event.templateSettings?.certificateId?.font ?? "Helvetica",
    },
    registrationId: {
      x: event.templateSettings?.registrationId?.x ?? 100,
      y: event.templateSettings?.registrationId?.y ?? 150,
      fontSize: event.templateSettings?.registrationId?.fontSize ?? 12,
      color: event.templateSettings?.registrationId?.color ?? "#94a3b8",
      show: event.templateSettings?.registrationId?.show ?? false,
      font: event.templateSettings?.registrationId?.font ?? "Helvetica",
    },
    qrCode: {
      x: event.templateSettings?.qrCode?.x ?? 700,
      y: event.templateSettings?.qrCode?.y ?? 80,
      size: event.templateSettings?.qrCode?.size ?? 80,
      show: event.templateSettings?.qrCode?.show ?? true,
    },
  });

  // Active placeholder field for coordinates adjustments
  const [activeField, setActiveField] = useState<
    "name" | "email" | "college" | "event" | "date" | "certificateId" | "registrationId" | "qrCode"
  >("name");

  // Visual Preview Coordinates Scale
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [naturalWidth, setNaturalWidth] = useState(1920);
  const [naturalHeight, setNaturalHeight] = useState(1080);
  const [previewWidth, setPreviewWidth] = useState(800);
  const [previewHeight, setPreviewHeight] = useState(450);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // File upload variables
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // CSV upload variables
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvValidation, setCsvValidation] = useState<{
    valid: boolean;
    errors: string[];
    newCount: number;
  }>({ valid: true, errors: [], newCount: 0 });
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Copy status variables
  const [copiedLink, setCopiedLink] = useState(false);

  // Cache loading verification ref to prevent image template cropping
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      const img = imageRef.current;
      setNaturalWidth(img.naturalWidth || 1920);
      setNaturalHeight(img.naturalHeight || 1080);
      setIsImageLoaded(true);
    }
  }, [templateUrl]);

  // Recalculate preview scale factor when image loaded or window resized
  const updatePreviewSize = () => {
    if (imageContainerRef.current) {
      const containerWidth = imageContainerRef.current.clientWidth;
      setPreviewWidth(containerWidth);
      const ratio = containerWidth / naturalWidth;
      setPreviewHeight(naturalHeight * ratio);
    }
  };

  useEffect(() => {
    if (isImageLoaded) {
      updatePreviewSize();
      window.addEventListener("resize", updatePreviewSize);
    }
    return () => {
      window.removeEventListener("resize", updatePreviewSize);
    };
  }, [isImageLoaded, naturalWidth, naturalHeight]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalWidth(img.naturalWidth || 1920);
    setNaturalHeight(img.naturalHeight || 1080);
    setIsImageLoaded(true);
  };

  // Upload Template Image
  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingTemplate(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload template");
      }

      setTemplateUrl(data.url);
      setIsImageLoaded(false); // trigger reload

      // Update event with new template URL
      await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateUrl: data.url }),
      });

      router.refresh();
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  // Delete Template Image
  const handleTemplateDelete = async () => {
    if (!window.confirm("Are you sure you want to delete the template background image?")) return;

    setIsUploadingTemplate(true);
    setUploadError(null);

    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateUrl: "" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete template");
      }

      setTemplateUrl("");
      setIsImageLoaded(false); // trigger reload
      router.refresh();
    } catch (err: any) {
      setUploadError(err.message || "Delete failed");
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  // Handle saving coordinate coordinates changes
  const handleSaveSettings = async () => {
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateSettings: settings }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save template configuration");
      }

      alert("Certificate coordinate layout saved successfully!");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Handle Event Settings Details Update
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSettings(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          date,
          status,
          certificateIdSource,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update event details");
      }

      alert("Event details updated!");
      router.refresh();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // Add Participant Manually handler
  const handleAddManualParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualEmail.trim() || !manualCollege.trim()) {
      setManualError("Name, Email, and College are required");
      return;
    }

    setIsManualSubmitting(true);
    setManualError(null);
    setManualSuccess(null);

    try {
      const res = await fetch(`/api/events/${event.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participants: [
            {
              name: manualName.trim(),
              email: manualEmail.trim().toLowerCase(),
              college: manualCollege.trim(),
              registrationId: manualRegId.trim(),
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add participant");
      }

      setManualSuccess("Participant added successfully!");
      setManualName("");
      setManualEmail("");
      setManualCollege("");
      setManualRegId("");

      // Fetch updated participants list
      const updateRes = await fetch(`/api/events/${event.id}/participants`);
      if (updateRes.ok) {
        const updateData = await updateRes.json();
        setParticipants(updateData.participants);
      }
      router.refresh();
    } catch (err: any) {
      setManualError(err.message || "An error occurred");
    } finally {
      setIsManualSubmitting(false);
    }
  };

  // Parse and validate CSV data
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setImportMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        setCsvPreview(data);

        // Validation logic
        const errors: string[] = [];
        const seenEmails = new Set<string>();
        let newRecordsCount = 0;
        data.forEach((row, index) => {
          const rowNum = index + 1;
          const regId = row["Registration ID"] || row.RegistrationID || row.registrationId || "";
           if (!row.Name || !row.Email || !row.College) {
            errors.push(
              `Row ${rowNum}: Missing fields (Name, Email, and College are required)`
            );
          }

          if (row.Email) {
            const email = row.Email.trim().toLowerCase();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              errors.push(`Row ${rowNum}: Invalid email syntax "${row.Email}"`);
            }

            if (seenEmails.has(email)) {
              errors.push(`Row ${rowNum}: Duplicate email in CSV file "${row.Email}"`);
            } else {
              seenEmails.add(email);
            }

            // Check if email already exists in DB participants
            const existsInDb = participants.some(
              (p) => p.email.toLowerCase() === email
            );
            if (!existsInDb) {
              newRecordsCount++;
            }
          }
        });

        setCsvValidation({
          valid: errors.length === 0,
          errors,
          newCount: newRecordsCount,
        });
      },
      error: (err) => {
        setCsvValidation({
          valid: false,
          errors: ["Failed to parse CSV: " + err.message],
          newCount: 0,
        });
      },
    });
  };

  // Import Parsed Participants
  const handleImportParticipants = async () => {
    if (csvPreview.length === 0 || isImporting) return;

    setIsImporting(true);
    setImportMessage(null);

    // Format fields to match API
    const formattedParticipants = csvPreview.map((row) => ({
      name: row.Name,
      email: row.Email,
      college: row.College,
      registrationId: row["Registration ID"] || row.RegistrationID || row.registrationId || "",
    }));

    try {
      const res = await fetch(`/api/events/${event.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants: formattedParticipants }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Import failed");
      }

      setImportMessage(data.message);
      setCsvFile(null);
      setCsvPreview([]);

      // Fetch updated participants list
      const updateRes = await fetch(`/api/events/${event.id}/participants`);
      if (updateRes.ok) {
        const updateData = await updateRes.json();
        setParticipants(updateData.participants);
      }

      router.refresh();
    } catch (err: any) {
      setImportMessage("Error: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Helper to copy links to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getPublicEventUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.protocol}//${window.location.host}/e/${event.slug}${organizerGid ? `?gid=${encodeURIComponent(organizerGid)}` : ""}`;
    }
    return `/e/${event.slug}${organizerGid ? `?gid=${encodeURIComponent(organizerGid)}` : ""}`;
  };

  // Filter participants list by search query
  const filteredParticipants = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.certificateCode && p.certificateCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Helpers to map custom font family and weight dynamically in layout CSS
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

  // Helper to handle coordinates edits from input/slider
  const handleCoordinateChange = (
    field: typeof activeField,
    prop: keyof PlaceholderConfig,
    value: number | string
  ) => {
    setSettings((prev: any) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [prop]: prop === "color" || prop === "font" ? value : Number(value),
      },
    }));
  };

  const scale = previewWidth / naturalWidth;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header section */}
      <div className="bg-white border-b border-slate-200 dark:bg-zinc-950 dark:border-zinc-800 py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-zinc-50">
                    {event.title}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      status === "published"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                    }`}
                  >
                    {status === "published" ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                  Slug: <code className="bg-slate-100 dark:bg-zinc-900 px-1 py-0.5 rounded text-xs">/e/{event.slug}</code>
                </p>
              </div>
            </div>

            {/* Tabs Selector */}
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-zinc-900 self-start sm:self-center">
              <button
                onClick={() => setActiveTab("design")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                  activeTab === "design"
                    ? "bg-white text-slate-950 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                    : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <Layout className="h-4 w-4" />
                Template Design
              </button>
              <button
                onClick={() => setActiveTab("participants")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                  activeTab === "participants"
                    ? "bg-white text-slate-950 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                    : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <Users className="h-4 w-4" />
                Participants ({participants.length})
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                  activeTab === "settings"
                    ? "bg-white text-slate-950 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                    : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* --- DESIGN TAB --- */}
        {activeTab === "design" && (
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Live Preview column */}
            <div className="lg:col-span-8 space-y-6">
              {!templateUrl ? (
                /* Empty Upload Template state */
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white py-24 px-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                    <Upload className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-zinc-50">
                    Upload Certificate Template
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-zinc-400">
                    Upload a high-resolution PNG background image of your certificate.
                  </p>
                  <div className="mt-6">
                    <label className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 cursor-pointer">
                      <Plus className="h-4 w-4" />
                      Choose PNG File
                      <input
                        type="file"
                        accept="image/png"
                        onChange={handleTemplateUpload}
                        disabled={isUploadingTemplate}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {isUploadingTemplate && <p className="mt-4 text-xs text-slate-500">Uploading...</p>}
                  {uploadError && <p className="mt-2 text-xs text-red-500">{uploadError}</p>}
                </div>
              ) : (
                /* Layout Coordinator Visual Preview */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800 dark:text-zinc-300">
                      Live Certificate Preview ({naturalWidth}x{naturalHeight})
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-blue-600 hover:text-blue-500 font-semibold cursor-pointer dark:text-blue-400">
                        Change Template PNG
                        <input
                          type="file"
                          accept="image/png"
                          onChange={handleTemplateUpload}
                          disabled={isUploadingTemplate}
                          className="hidden"
                        />
                      </label>
                      <span className="text-slate-300 dark:text-zinc-700">|</span>
                      <button
                        onClick={handleTemplateDelete}
                        disabled={isUploadingTemplate}
                        className="text-xs text-red-600 hover:text-red-500 font-semibold cursor-pointer"
                      >
                        Delete Template
                      </button>
                    </div>
                  </div>

                  <div
                    ref={imageContainerRef}
                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm dark:border-zinc-800 select-none"
                    style={{ height: isImageLoaded ? previewHeight : "450px" }}
                  >
                    {/* Background Template */}
                    <img
                      ref={imageRef}
                      src={getUrls.getUrl(templateUrl)}
                      alt="Certificate Template"
                      onLoad={handleImageLoad}
                      className="w-full h-auto pointer-events-none"
                    />

                    {isImageLoaded && (
                      <>
                        {/* 1. Name overlay */}
                        {(settings.name.show !== false || activeField === "name") && (
                          <div
                            onClick={() => setActiveField("name")}
                            style={{
                              left: `${settings.name.x * scale}px`,
                              top: `${settings.name.y * scale}px`,
                              fontSize: `${settings.name.fontSize * scale}px`,
                              color: settings.name.color,
                            }}
                            className={`absolute whitespace-nowrap cursor-pointer origin-top-left transition-all ${
                              getCssFontFamily(settings.name.font)
                            } ${
                              getCssFontWeight(settings.name.font)
                            } ${
                              activeField === "name"
                                ? "ring-2 ring-blue-500 ring-offset-2 rounded px-1.5 py-0.5 bg-blue-500/10 z-30"
                                : "hover:bg-slate-500/10"
                            } ${settings.name.show === false ? "opacity-35 line-through decoration-red-500" : ""}`}
                          >
                            John Doe
                          </div>
                        )}

                        {/* 2. Email overlay */}
                        {(settings.email.show !== false || activeField === "email") && (
                          <div
                            onClick={() => setActiveField("email")}
                            style={{
                              left: `${settings.email.x * scale}px`,
                              top: `${settings.email.y * scale}px`,
                              fontSize: `${settings.email.fontSize * scale}px`,
                              color: settings.email.color,
                            }}
                            className={`absolute whitespace-nowrap cursor-pointer origin-top-left transition-all ${
                              getCssFontFamily(settings.email.font)
                            } ${
                              getCssFontWeight(settings.email.font)
                            } ${
                              activeField === "email"
                                ? "ring-2 ring-blue-500 ring-offset-2 rounded px-1.5 py-0.5 bg-blue-500/10 z-30"
                                : "hover:bg-slate-500/10"
                            } ${settings.email.show === false ? "opacity-35 line-through decoration-red-500" : ""}`}
                          >
                            ambassador@google.com
                          </div>
                        )}

                        {/* 3. College overlay */}
                        {(settings.college.show !== false || activeField === "college") && (
                          <div
                            onClick={() => setActiveField("college")}
                            style={{
                              left: `${settings.college.x * scale}px`,
                              top: `${settings.college.y * scale}px`,
                              fontSize: `${settings.college.fontSize * scale}px`,
                              color: settings.college.color,
                            }}
                            className={`absolute whitespace-nowrap cursor-pointer origin-top-left transition-all ${
                              getCssFontFamily(settings.college.font)
                            } ${
                              getCssFontWeight(settings.college.font)
                            } ${
                              activeField === "college"
                                ? "ring-2 ring-blue-500 ring-offset-2 rounded px-1.5 py-0.5 bg-blue-500/10 z-30"
                                : "hover:bg-slate-500/10"
                            } ${settings.college.show === false ? "opacity-35 line-through decoration-red-500" : ""}`}
                          >
                            Google Developer Student Club University
                          </div>
                        )}

                        {/* 4. Event overlay */}
                        {(settings.event.show !== false || activeField === "event") && (
                          <div
                            onClick={() => setActiveField("event")}
                            style={{
                              left: `${settings.event.x * scale}px`,
                              top: `${settings.event.y * scale}px`,
                              fontSize: `${settings.event.fontSize * scale}px`,
                              color: settings.event.color,
                            }}
                            className={`absolute whitespace-nowrap cursor-pointer origin-top-left transition-all ${
                              getCssFontFamily(settings.event.font)
                            } ${
                              getCssFontWeight(settings.event.font)
                            } ${
                              activeField === "event"
                                ? "ring-2 ring-blue-500 ring-offset-2 rounded px-1.5 py-0.5 bg-blue-500/10 z-30"
                                : "hover:bg-slate-500/10"
                            } ${settings.event.show === false ? "opacity-35 line-through decoration-red-500" : ""}`}
                          >
                            {title}
                          </div>
                        )}

                        {/* 5. Date overlay */}
                        {(settings.date.show !== false || activeField === "date") && (
                          <div
                            onClick={() => setActiveField("date")}
                            style={{
                              left: `${settings.date.x * scale}px`,
                              top: `${settings.date.y * scale}px`,
                              fontSize: `${settings.date.fontSize * scale}px`,
                              color: settings.date.color,
                            }}
                            className={`absolute whitespace-nowrap cursor-pointer origin-top-left transition-all ${
                              getCssFontFamily(settings.date.font)
                            } ${
                              getCssFontWeight(settings.date.font)
                            } ${
                              activeField === "date"
                                ? "ring-2 ring-blue-500 ring-offset-2 rounded px-1.5 py-0.5 bg-blue-500/10 z-30"
                                : "hover:bg-slate-500/10"
                            } ${settings.date.show === false ? "opacity-35 line-through decoration-red-500" : ""}`}
                          >
                            {date
                              ? new Date(date).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "July 18, 2026"}
                          </div>
                        )}

                        {/* 6. Certificate ID overlay */}
                        {(settings.certificateId.show !== false || activeField === "certificateId") && (
                          <div
                            onClick={() => setActiveField("certificateId")}
                            style={{
                              left: `${settings.certificateId.x * scale}px`,
                              top: `${settings.certificateId.y * scale}px`,
                              fontSize: `${settings.certificateId.fontSize * scale}px`,
                              color: settings.certificateId.color,
                            }}
                            className={`absolute whitespace-nowrap cursor-pointer origin-top-left transition-all ${
                              getCssFontFamily(settings.certificateId.font)
                            } ${
                              getCssFontWeight(settings.certificateId.font)
                            } ${
                              activeField === "certificateId"
                                ? "ring-2 ring-blue-500 ring-offset-2 rounded px-1.5 py-0.5 bg-blue-500/10 z-30"
                                : "hover:bg-slate-500/10"
                            } ${settings.certificateId.show === false ? "opacity-35 line-through decoration-red-500" : ""}`}
                          >
                            CD-DEMO-CODE
                          </div>
                        )}

                        {/* 6.5. Registration ID overlay */}
                        {(settings.registrationId.show !== false || activeField === "registrationId") && (
                          <div
                            onClick={() => setActiveField("registrationId")}
                            style={{
                              left: `${settings.registrationId.x * scale}px`,
                              top: `${settings.registrationId.y * scale}px`,
                              fontSize: `${settings.registrationId.fontSize * scale}px`,
                              color: settings.registrationId.color,
                            }}
                            className={`absolute whitespace-nowrap cursor-pointer origin-top-left transition-all ${
                              getCssFontFamily(settings.registrationId.font)
                            } ${
                              getCssFontWeight(settings.registrationId.font)
                            } ${
                              activeField === "registrationId"
                                ? "ring-2 ring-blue-500 ring-offset-2 rounded px-1.5 py-0.5 bg-blue-500/10 z-30"
                                : "hover:bg-slate-500/10"
                            } ${settings.registrationId.show === false ? "opacity-35 line-through decoration-red-500" : ""}`}
                          >
                            REG-123456
                          </div>
                        )}

                        {/* 7. QR Code overlay */}
                        {(settings.qrCode.show !== false || activeField === "qrCode") && (
                          <div
                            onClick={() => setActiveField("qrCode")}
                            style={{
                              left: `${settings.qrCode.x * scale}px`,
                              top: `${settings.qrCode.y * scale}px`,
                              width: `${settings.qrCode.size * scale}px`,
                              height: `${settings.qrCode.size * scale}px`,
                            }}
                            className={`absolute border border-slate-400 bg-white/90 p-1 flex items-center justify-center cursor-pointer transition-all ${
                              activeField === "qrCode"
                                ? "ring-2 ring-blue-500 ring-offset-2 bg-blue-500/10 z-30"
                                : "hover:bg-slate-500/10"
                            } ${settings.qrCode.show === false ? "opacity-35 bg-red-50" : ""}`}
                          >
                            <div className="relative w-full h-full border border-slate-300">
                              {/* Simulated QR Pattern */}
                              <div className="absolute top-1 left-1 w-2.5 h-2.5 border-2 border-slate-700 bg-white" />
                              <div className="absolute top-1 right-1 w-2.5 h-2.5 border-2 border-slate-700 bg-white" />
                              <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-2 border-slate-700 bg-white" />
                              <div className="absolute inset-2 flex items-center justify-center text-[8px] text-slate-500 font-mono">
                                QR
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Coordination controls column */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                  Placeholder Coordinates
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Select a placeholder to adjust coordinates and styling on the certificate.
                </p>

                {/* Field tabs selector */}
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-1 rounded-xl bg-slate-100 p-1 text-center text-xs font-semibold dark:bg-zinc-950">
                  {(
                    ["name", "email", "college", "event", "date", "certificateId", "registrationId", "qrCode"] as const
                  ).map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveField(f)}
                      className={`rounded-lg py-1 px-0.5 capitalize transition-all ${
                        activeField === f
                          ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                          : "text-slate-500 hover:text-slate-900 dark:text-zinc-400"
                      }`}
                    >
                      {f === "certificateId" ? "Cert ID" : f === "registrationId" ? "Reg ID" : f === "qrCode" ? "QR Code" : f}
                    </button>
                  ))}
                </div>

                {/* Adjuster controls */}
                <div className="mt-6 space-y-4">
                  {/* Enable/Disable Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/60 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-300">
                        Enable Placeholder
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-550 leading-normal mt-0.5">
                        Render this field on certificate PDF
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(settings as any)[activeField].show !== false}
                        onChange={() => {
                          const isShowing = (settings as any)[activeField].show !== false;
                          setSettings((prev: any) => ({
                            ...prev,
                            [activeField]: {
                              ...prev[activeField],
                              show: !isShowing,
                            },
                          }));
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-850 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-700 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className={`space-y-4 transition-all duration-200 ${(settings as any)[activeField].show === false ? "opacity-35 pointer-events-none select-none" : ""}`}>
                    {/* X slider */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-zinc-400">
                        <span>X Coordinate</span>
                        <span className="font-mono">
                          {(settings as any)[activeField].x} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={naturalWidth}
                        value={(settings as any)[activeField].x}
                        onChange={(e) =>
                          handleCoordinateChange(activeField, "x", e.target.value)
                        }
                        className="mt-1 w-full h-1.5 bg-slate-200 dark:bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    {/* Y slider */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-zinc-400">
                        <span>Y Coordinate</span>
                        <span className="font-mono">
                          {(settings as any)[activeField].y} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={naturalHeight}
                        value={(settings as any)[activeField].y}
                        onChange={(e) =>
                          handleCoordinateChange(activeField, "y", e.target.value)
                        }
                        className="mt-1 w-full h-1.5 bg-slate-200 dark:bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    {/* Size config (font size for text, width for QR Code) */}
                    {activeField !== "qrCode" ? (
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-zinc-400">
                          <span>Font Size</span>
                          <span className="font-mono">
                            {(settings as any)[activeField].fontSize} px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="8"
                          max="120"
                          value={(settings as any)[activeField].fontSize}
                          onChange={(e) =>
                            handleCoordinateChange(
                              activeField,
                              "fontSize",
                              e.target.value
                            )
                          }
                          className="mt-1 w-full h-1.5 bg-slate-200 dark:bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-zinc-400">
                          <span>QR Code Size</span>
                          <span className="font-mono">
                            {settings.qrCode.size} px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="40"
                          max="300"
                          value={settings.qrCode.size}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              qrCode: {
                                ...prev.qrCode,
                                size: Number(e.target.value),
                              },
                            }))
                          }
                          className="mt-1 w-full h-1.5 bg-slate-200 dark:bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    )}

                    {/* Color selector (only for text placeholders) */}
                    {activeField !== "qrCode" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">
                            Text Color (Hex)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={(settings as any)[activeField].color}
                              onChange={(e) =>
                                handleCoordinateChange(
                                  activeField,
                                  "color",
                                  e.target.value
                                )
                              }
                              className="h-9 w-9 rounded-lg border border-slate-200 dark:border-zinc-800 bg-transparent p-0 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={(settings as any)[activeField].color}
                              onChange={(e) =>
                                handleCoordinateChange(
                                  activeField,
                                  "color",
                                  e.target.value
                                )
                              }
                              className="flex-1 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-mono dark:border-zinc-800 dark:bg-zinc-950"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1.5">
                            Font Family
                          </label>
                          <select
                            value={(settings as any)[activeField].font || (activeField === "name" || activeField === "event" ? "Helvetica-Bold" : "Helvetica")}
                            onChange={(e) =>
                              handleCoordinateChange(
                                activeField,
                                "font",
                                e.target.value
                              )
                            }
                            className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                          >
                            <option value="Helvetica">Helvetica (Sans)</option>
                            <option value="Helvetica-Bold">Helvetica Bold</option>
                            <option value="Times-Roman">Times (Serif)</option>
                            <option value="Times-Bold">Times Bold</option>
                            <option value="Courier">Courier (Mono)</option>
                            <option value="Courier-Bold">Courier Bold</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-4 dark:border-zinc-800">
                  <button
                    onClick={handleSaveSettings}
                    disabled={!templateUrl}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
                  >
                    Save Coordinate Layout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- PARTICIPANTS TAB --- */}
        {activeTab === "participants" && (
          <div className="space-y-8">
            {/* Import & Register Panel Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* CSV Import Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                        Import Participant List (CSV)
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-zinc-400">
                        Upload a CSV file containing event participant details.
                      </p>
                    </div>
                    <a
                      href="/CertDrop_Empty_Participant_Template.csv"
                      download="CertDrop_Empty_Participant_Template.csv"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-850 dark:hover:text-zinc-50 ml-4 shrink-0"
                    >
                      <Download className="h-4 w-4" />
                      <span>Template</span>
                    </a>
                  </div>

                  <div className="mt-6 grid gap-6 md:grid-cols-12 items-start">
                    <div className="md:col-span-5">
                      {/* File Upload Box */}
                      <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 py-8 px-4 text-center cursor-pointer hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950/20 dark:hover:bg-zinc-900/40">
                        <Upload className="h-8 w-8 text-slate-400" />
                        <span className="mt-2.5 text-sm font-semibold text-slate-700 dark:text-zinc-300 truncate max-w-full">
                          {csvFile ? csvFile.name : "Select CSV"}
                        </span>
                        <span className="mt-1 text-[10px] text-slate-500">
                          Name, Email, College
                        </span>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCsvChange}
                          className="hidden"
                        />
                      </label>

                      {importMessage && (
                        <div className="mt-4 rounded-xl bg-slate-100 p-3 text-xs text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {importMessage}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-7 space-y-4">
                      {csvPreview.length > 0 ? (
                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">
                            <span>Parsed ({csvPreview.length} rows)</span>
                            <span
                              className={
                                csvValidation.valid ? "text-green-600" : "text-red-500"
                              }
                            >
                              {csvValidation.valid ? "✓ Valid" : "⚠ Has Errors"}
                            </span>
                          </div>

                          {csvValidation.errors.length > 0 && (
                            <div className="mb-3 max-h-24 overflow-y-auto rounded-lg bg-red-50 border border-red-100 p-2 text-[10px] text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
                              <ul className="list-disc pl-3 space-y-0.5">
                                {csvValidation.errors.slice(0, 3).map((e, idx) => (
                                  <li key={idx}>{e}</li>
                                ))}
                                {csvValidation.errors.length > 3 && (
                                  <li>And {csvValidation.errors.length - 3} more errors...</li>
                                )}
                              </ul>
                            </div>
                          )}

                          <div className="mb-3 text-[11px] font-medium text-slate-650 dark:text-zinc-400">
                            {csvValidation.newCount} new participants will be added.
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={handleImportParticipants}
                              disabled={!csvValidation.valid || csvValidation.newCount === 0 || isImporting}
                              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                            >
                              {isImporting ? "Importing..." : "Import"}
                            </button>
                            <button
                              onClick={() => {
                                setCsvFile(null);
                                setCsvPreview([]);
                              }}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full flex-col justify-center rounded-2xl border border-dashed border-slate-200 p-4 text-center dark:border-zinc-800">
                          <Info className="h-4.5 w-4.5 mx-auto text-slate-400" />
                          <p className="mt-1.5 text-[11px] text-slate-550 dark:text-zinc-400">
                            Upload a .csv file to review and validation-preview here.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual Entry Form Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                  Add Participant Manually
                </h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  Register a single participant and generate certificate.
                </p>

                <form onSubmit={handleAddManualParticipant} className="mt-6 space-y-4">
                  {manualError && (
                    <div className="rounded-xl bg-red-50 p-3 text-xs text-red-750 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                      {manualError}
                    </div>
                  )}
                  {manualSuccess && (
                    <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                      {manualSuccess}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-555 dark:text-zinc-400 uppercase tracking-wider mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-555 dark:text-zinc-400 uppercase tracking-wider mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-555 dark:text-zinc-400 uppercase tracking-wider mb-1">
                        College / Institution
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Stanford University"
                        value={manualCollege}
                        onChange={(e) => setManualCollege(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-555 dark:text-zinc-400 uppercase tracking-wider mb-1">
                        GID of Ambassador (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. GDG-1002"
                        value={manualRegId}
                        onChange={(e) => setManualRegId(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isManualSubmitting || !manualName || !manualEmail || !manualCollege}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-500 disabled:opacity-50 transition-colors"
                    >
                      {isManualSubmitting ? "Adding..." : "Add Participant"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Participants list */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                    Imported Participants
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400">
                    Search and monitor certificate codes and download statistics.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full max-w-xs">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name, email, code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-zinc-800">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">College</th>
                      <th className="py-3 px-4 text-center">Downloads</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParticipants.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 px-4 text-center text-slate-400 dark:text-zinc-500"
                        >
                          No participants found.
                        </td>
                      </tr>
                    ) : (
                      filteredParticipants.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-slate-100 hover:bg-slate-50/50 dark:border-zinc-800 dark:hover:bg-zinc-900/30"
                        >
                          <td className="py-4 px-4 font-semibold text-slate-900 dark:text-zinc-100">
                            {p.name}
                          </td>
                          <td className="py-4 px-4 text-slate-600 dark:text-zinc-400">
                            {p.email}
                          </td>
                          <td className="py-4 px-4 text-slate-600 dark:text-zinc-400 max-w-[200px] truncate">
                            {p.college}
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-slate-700 dark:text-zinc-300">
                            {p.downloadCount}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {p.certificateCode && (
                              <div className="flex justify-end gap-2.5">
                                <Link
                                  href={`/api/certificates/${p.certificateCode}?download=true&email=${encodeURIComponent(p.email)}&nameOrRegId=${encodeURIComponent(p.name)}&gid=${encodeURIComponent(p.registrationId || "")}`}
                                  title="Download certificate PDF"
                                  className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 font-semibold"
                                >
                                  Download PDF
                                </Link>
                                <span className="text-slate-300 dark:text-zinc-700">|</span>
                                <Link
                                  href={`/verify?id=${p.certificateCode}&email=${encodeURIComponent(p.email)}&nameOrRegId=${encodeURIComponent(p.name)}&gid=${encodeURIComponent(p.registrationId || "")}`}
                                  target="_blank"
                                  title="Verify authenticity page"
                                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                                >
                                  Verify Page
                                </Link>
                                <span className="text-slate-300 dark:text-zinc-700">|</span>
                                <button
                                  onClick={() => {
                                    const portalUrl = `${window.location.protocol}//${window.location.host}/e/${event.slug}?code=${p.certificateCode}&email=${encodeURIComponent(p.email)}&name=${encodeURIComponent(p.name)}${p.registrationId ? `&gid=${encodeURIComponent(p.registrationId)}` : ""}`;
                                    navigator.clipboard.writeText(portalUrl);
                                    setCopiedParticipantId(p.id);
                                    setTimeout(() => setCopiedParticipantId(null), 2000);
                                  }}
                                  title="Copy direct certificate portal link"
                                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-semibold cursor-pointer"
                                >
                                  {copiedParticipantId === p.id ? "Copied!" : "Copy Link"}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === "settings" && (
          <div className="grid gap-8 md:grid-cols-12 items-start">
            <div className="md:col-span-8 space-y-6">
              {/* Event details form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                  Event Details
                </h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  Modify the configuration of your public distribution page.
                </p>

                <form onSubmit={handleUpdateEvent} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                      Event Title
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 resize-none"
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
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                      Certificate ID Field to Display
                    </label>
                    <select
                      value={certificateIdSource}
                      onChange={(e) => setCertificateIdSource(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    >
                      <option value="code">Generated Certificate Code (e.g. CD-ABCD-1234)</option>
                      <option value="registrationId">Participant Registration ID (e.g. REG-1001)</option>
                    </select>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
                      Determines what ID is rendered in the <code className="font-mono text-[10px] bg-slate-100 dark:bg-zinc-900 px-1 py-0.5 rounded">{"{{certificate_id}}"}</code> placeholder on the PDF.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
                    <button
                      type="submit"
                      disabled={isUpdatingSettings}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 disabled:opacity-55"
                    >
                      {isUpdatingSettings ? "Updating..." : "Update Event Info"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="md:col-span-4 space-y-6">
              {/* Publication Switch card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">
                  Publish Event
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Once published, participants can look up and download certificates via the public link.
                </p>

                <div className="mt-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850">
                    <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                      Distribution Status
                    </span>
                    <button
                      onClick={async () => {
                        const newStatus = status === "published" ? "draft" : "published";
                        setStatus(newStatus);
                        await fetch(`/api/events/${event.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: newStatus }),
                        });
                        router.refresh();
                      }}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        status === "published" ? "bg-emerald-500" : "bg-slate-200 dark:bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          status === "published" ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {status === "published" && (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-zinc-800">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Public Link
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={getPublicEventUrl()}
                            className="w-full bg-transparent text-xs font-mono text-slate-700 dark:text-zinc-300 focus:outline-none select-all truncate"
                          />
                          <button
                            onClick={() => copyToClipboard(getPublicEventUrl())}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 dark:hover:bg-zinc-800 dark:text-zinc-400 transition-colors"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {copiedLink && (
                        <p className="text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          ✓ Link copied to clipboard
                        </p>
                      )}

                      <Link
                        href={`/e/${event.slug}${organizerGid ? `?gid=${encodeURIComponent(organizerGid)}` : ""}`}
                        target="_blank"
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      >
                        Visit Event Portal
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
