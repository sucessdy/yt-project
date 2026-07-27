import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
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

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: "user_avatars",
        });

        console.log("✅ File uploaded to Cloudinary:", response.url);

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
            console.log("🗑️ Local file deleted:", localFilePath);
        }

        return response;
    } catch (error) {
    console.error("❌ Cloudinary upload error:");
    console.error(error);

    if (error.response) {
        console.log(error.response);
    }

    if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
    }

    return null;
}
    
};



export { uploadOnCloudinary };