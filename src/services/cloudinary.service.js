import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.log("❌ No file path provided");
            return null;
        }

   
        if (!fs.existsSync(localFilePath)) {
            console.log("❌ File does not exist:", localFilePath);
            return null;
        }

        console.log("📤 Uploading to Cloudinary:", localFilePath);

        // Upload file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "user_avatars",
        });

        console.log("✅ File uploaded to Cloudinary:", response.url);

        // Remove local file after successful upload
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
            console.log("🗑️ Local file deleted:", localFilePath);
        }

        return response;
    } catch (error) {
        console.error("❌ Cloudinary upload error:", error.message);
        
        // Remove local file if upload fails
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
            console.log("🗑️ Local file deleted after error:", localFilePath);
        }

        return null;
    }
};

// ❌ REMOVE THIS TEST CODE - it's causing issues
// cloudinary.v2.uploader.upload("dog.mp4", { ... })

export { uploadOnCloudinary };