import mongoose from "mongoose";

// --- USER SCHEMA ---
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
  gid: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);

// --- EVENT SCHEMA ---
const EventSchema = new mongoose.Schema({
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date },
  slug: { type: String, required: true, unique: true },
  templateUrl: { type: String }, // stores relative path to template, e.g. /uploads/filename.png
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  certificateIdSource: { type: String, enum: ["code", "registrationId"], default: "code" },
  templateSettings: {
    name: {
      x: { type: Number, default: 400 },
      y: { type: Number, default: 300 },
      fontSize: { type: Number, default: 36 },
      color: { type: String, default: "#1e293b" },
      show: { type: Boolean, default: true },
      font: { type: String, default: "Helvetica" },
    },
    email: {
      x: { type: Number, default: 400 },
      y: { type: Number, default: 220 },
      fontSize: { type: Number, default: 16 },
      color: { type: String, default: "#64748b" },
      show: { type: Boolean, default: true },
      font: { type: String, default: "Helvetica" },
    },
    college: {
      x: { type: Number, default: 400 },
      y: { type: Number, default: 260 },
      fontSize: { type: Number, default: 18 },
      color: { type: String, default: "#475569" },
      show: { type: Boolean, default: true },
      font: { type: String, default: "Helvetica" },
    },
    event: {
      x: { type: Number, default: 400 },
      y: { type: Number, default: 380 },
      fontSize: { type: Number, default: 28 },
      color: { type: String, default: "#2563eb" },
      show: { type: Boolean, default: true },
      font: { type: String, default: "Helvetica" },
    },
    date: {
      x: { type: Number, default: 400 },
      y: { type: Number, default: 150 },
      fontSize: { type: Number, default: 16 },
      color: { type: String, default: "#64748b" },
      show: { type: Boolean, default: true },
      font: { type: String, default: "Helvetica" },
    },
    certificateId: {
      x: { type: Number, default: 100 },
      y: { type: Number, default: 100 },
      fontSize: { type: Number, default: 12 },
      color: { type: String, default: "#94a3b8" },
      show: { type: Boolean, default: true },
      font: { type: String, default: "Helvetica" },
    },
    registrationId: {
      x: { type: Number, default: 100 },
      y: { type: Number, default: 150 },
      fontSize: { type: Number, default: 12 },
      color: { type: String, default: "#94a3b8" },
      show: { type: Boolean, default: false },
      font: { type: String, default: "Helvetica" },
    },
    qrCode: {
      x: { type: Number, default: 700 },
      y: { type: Number, default: 80 },
      size: { type: Number, default: 80 },
      show: { type: Boolean, default: true },
    },
  },
  createdAt: { type: Date, default: Date.now },
});

export const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

// --- PARTICIPANT SCHEMA ---
const ParticipantSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  college: { type: String, required: true },
  registrationId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Compound index to ensure name or email uniqueness per event if necessary
ParticipantSchema.index({ eventId: 1, email: 1 }, { unique: true });

export const Participant = mongoose.models.Participant || mongoose.model("Participant", ParticipantSchema);

// --- CERTIFICATE SCHEMA ---
const CertificateSchema = new mongoose.Schema({
  certificateCode: { type: String, required: true, unique: true }, // e.g. CD-XXXX-YYYY
  participantId: { type: mongoose.Schema.Types.ObjectId, ref: "Participant", required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  downloadCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const Certificate = mongoose.models.Certificate || mongoose.model("Certificate", CertificateSchema);
