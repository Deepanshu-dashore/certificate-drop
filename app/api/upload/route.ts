import { CloudneryService } from "@/lib/services/CloudneryService";
import { resolveTemplateUrl } from "@/lib/utils/geturl";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Upload to Cloudinary
    // Using folder name "certificate-templates" and resource_type "image"
    const uploadResult = await CloudneryService.upload(file, "certificate-templates", "image");

    if (!uploadResult) {
      return NextResponse.json(
        { error: "Failed to upload file to Cloudinary" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url, // Storable partial URL (e.g. v1628172938/certificate-templates/abc.png)
      fileName: file.name,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file: " + error.message },
      { status: 500 }
    );
  }
}
