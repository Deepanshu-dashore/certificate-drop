import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import qr from "qrcode";

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

interface CertificateData {
  name: string;
  email: string;
  college: string;
  eventTitle: string;
  eventDate: string;
  certificateCode: string;
  verificationUrl: string;
  registrationId: string;
}

// Convert Hex color to PDF-lib RGB colors
function hexToRgb(hex: string) {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
}

/**
 * Generates a certificate PDF by overlaying text and a QR code on a PNG/JPEG template.
 * @param templatePath Absolute path to the template image on disk
 * @param settings Coordinate and font configurations
 * @param data The participant-specific data to insert
 */
export async function generateCertificatePdf(
  templatePath: string,
  settings: TemplateSettings,
  data: CertificateData
): Promise<Uint8Array> {
  // Read template image bytes
  let imageBytes: Buffer | Uint8Array;
  if (templatePath.startsWith("http://") || templatePath.startsWith("https://")) {
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch template image from URL: ${templatePath}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    imageBytes = new Uint8Array(arrayBuffer);
  } else {
    imageBytes = fs.readFileSync(templatePath);
  }

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Embed template image
  let image;
  const cleanPath = templatePath.split("?")[0];
  const ext = path.extname(cleanPath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") {
    image = await pdfDoc.embedJpg(imageBytes);
  } else {
    image = await pdfDoc.embedPng(imageBytes);
  }

  const { width, height } = image;

  // Add a page with the exact dimensions of the template image
  const page = pdfDoc.addPage([width, height]);

  // Draw the background template image
  page.drawImage(image, {
    x: 0,
    y: 0,
    width,
    height,
  });

  // Embed standard fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
  const courierBoldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // Helper to convert HTML-friendly top-left coordinates to PDF-lib bottom-left coordinates
  // HTML coords have (0,0) at top-left. PDF-lib has (0,0) at bottom-left.
  const drawTextAt = (
    text: string,
    config: PlaceholderConfig,
    isBoldDefault = false
  ) => {
    if (!text || config.show === false) return;
    
    // Select font family and weight
    let font = isBoldDefault ? helveticaBoldFont : helveticaFont;
    const fontSetting = config.font || (isBoldDefault ? "Helvetica-Bold" : "Helvetica");

    if (fontSetting === "Helvetica") font = helveticaFont;
    else if (fontSetting === "Helvetica-Bold") font = helveticaBoldFont;
    else if (fontSetting === "Times-Roman") font = timesRomanFont;
    else if (fontSetting === "Times-Bold") font = timesRomanBoldFont;
    else if (fontSetting === "Courier") font = courierFont;
    else if (fontSetting === "Courier-Bold") font = courierBoldFont;

    // Y-conversion: pdf_y = page_height - html_y - fontSize (to account for baseline difference roughly)
    const pdfY = height - config.y - config.fontSize;
    const color = hexToRgb(config.color);

    page.drawText(text, {
      x: config.x,
      y: pdfY,
      size: config.fontSize,
      font,
      color,
    });
  };

  // Draw fields on top of template
  drawTextAt(data.name, settings.name, true);
  drawTextAt(data.email, settings.email, false);
  drawTextAt(data.college, settings.college, false);
  drawTextAt(data.eventTitle, settings.event, true);
  drawTextAt(data.eventDate, settings.date, false);
  drawTextAt(data.certificateCode, settings.certificateId, false);
  drawTextAt(data.registrationId, settings.registrationId, false);

  if (settings.qrCode.show !== false) {
    // Generate QR Code
    // QR codes are generated as a PNG buffer
    const qrBuffer = await qr.toBuffer(data.verificationUrl, {
      type: "png",
      margin: 1,
      width: settings.qrCode.size,
    });

    // Embed and draw QR code
    const qrImage = await pdfDoc.embedPng(qrBuffer);
    // Y-conversion for QR code image
    const qrPdfY = height - settings.qrCode.y - settings.qrCode.size;

    page.drawImage(qrImage, {
      x: settings.qrCode.x,
      y: qrPdfY,
      width: settings.qrCode.size,
      height: settings.qrCode.size,
    });
  }

  // Save PDF and return as Uint8Array
  return await pdfDoc.save();
}
