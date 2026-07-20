export class getUrls {
  static getUrl(url: string | null | undefined, resource_type = "image"): string {
    if (!url) return "";
    // If it's already an absolute URL or a relative local path, return it as is
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
      return url;
    }
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME || process.env.CLOUDINARY_NAME;
    return `https://res.cloudinary.com/${cloudName}/${resource_type}/upload/${url}`;
  }
}

export function resolveTemplateUrl(url: string | null | undefined): string {
  return getUrls.getUrl(url, "image");
}
