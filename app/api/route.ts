import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    version: "2",
    message: "CertDrop API is online and running version 2",
    timestamp: new Date().toISOString()
  });
}
