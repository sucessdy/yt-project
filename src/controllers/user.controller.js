import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.models.js";
import { uploadOnCloudinary } from "../services/cloudinary.service.js";

const registerUser = asyncHandler(async (req, res) => {
  console.log("📥 Processing user registration...");

  const { username, email, fullName, password } = req.body;

  if (!username || !email || !fullName || !password) {
    throw new ApiError(
      400,
      "All fields (username, email, fullName, password) are required"
    );
  }

  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  let avatarUrl = null;

  if (req.files && req.files.avatar && req.files.avatar.length > 0) {
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    console.log("📤 Uploading avatar to Cloudinary:", avatarLocalPath);

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar is required");
    }
    const cloudinaryResponse = await uploadOnCloudinary(avatarLocalPath);
    if (cloudinaryResponse) {
      avatarUrl = cloudinaryResponse.secure_url;
      console.log("✅ Avatar uploaded:", avatarUrl);
    } else {
      throw new ApiError(400, "Failed to upload avatar. Please try again.");
    }
  } else {
    throw new ApiError(400, "Avatar is required");
  }

  let coverImageUrl = null;
  if (req.files && req.files.coverImage && req.files.coverImage.length > 0) {
    const coverLocalPath = req.files.coverImage[0].path;
    console.log("📤 Uploading cover image to Cloudinary:", coverLocalPath);

    const cloudinaryResponse = await uploadOnCloudinary(coverLocalPath);
    if (cloudinaryResponse) {
      coverImageUrl = cloudinaryResponse.url;
      console.log("✅ Cover image uploaded:", coverImageUrl);
    }
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    fullName,
    password,
    avatar: avatarUrl,
    coverImage: coverImageUrl,
  });
  console.log(user);

  console.log("✅ User created successfully:", user._id);

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, "User registered successfully", createdUser));
});

export { registerUser };
