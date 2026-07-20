import cloudinary from "../config/Cloudnery";

export class CloudneryService {
  static async upload(
    file: any,
    folder = "default",
    resource_type = "raw",
    format = "",
  ): Promise<{ url: string; id: string } | null> {
    try {
      if (!file) {
        throw new Error("No file provided");
      }
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadOptions: any = {
        resource_type,
        folder,
      };
      // Only set format if it's a valid file extension (not 'image', 'auto', etc.)
      if (format && !["image", "video", "raw", "auto"].includes(format)) {
        uploadOptions.format = format;
      }

      const result: any = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(uploadOptions, (error, result) => {
            if (error) reject(error);
            resolve(result);
          })
          .end(buffer);
      });
      if (result) {
        console.log(result.secure_url);
        const buildUrl = result.secure_url.split("upload/")[1];
        return {
          url: buildUrl,
          id: result.public_id,
        };
      }
      return null;
    } catch (error) {
      console.log("Error in cloudnery service -", error);
      return null;
    }
  }

  static async delete(fileId: string, resource_type = "raw"): Promise<{ success: boolean } | null> {
    try {
      let publicId = null;
      const fileName = fileId.split("/");
      if (resource_type !== "raw") {
        publicId = fileName.slice(1).join("/").split(".")[0];
      } else {
        publicId = fileName.slice(1).join("/");
      }
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type,
      });
      if (result) {
        return {
          success: true,
        };
      }
      return null;
    } catch (error) {
      console.log("Error in cloudnery service -", error);
      return null;
    }
  }
}
