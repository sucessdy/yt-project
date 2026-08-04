import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.models.js";
import { uploadOnCloudinary } from "../services/cloudinary.service.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate access and refresh tokens");
  }
};

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
    $or: [
      { email: email?.toLowerCase() },
      { username: username?.toLowerCase() },
    ],
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
      avatarUrl = cloudinaryResponse?.secure_url;
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
      coverImageUrl = cloudinaryResponse.secure_url;
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

const loginUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;
  // req body
  // username or email
  // find the user
  // password check
  // access and referesh token
  // send cookie

  if (!(email || username) || !password) {
    throw new ApiError(400, "Email/Username and password are required");
  }
  const existingUser = await User.findOne({
    $or: [
      { email: email?.trim().toLowerCase() },
      { username: username?.trim().toLowerCase() },
    ],
  });

  if (!existingUser) {
    throw new ApiError(404, "user doesn't exits");
  }

  const isPasswordValid = await existingUser.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(existingUser._id);

  const loggedInUser = await User.findById(existingUser._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: false,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: false,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully", {}));
});

const refreshTokenUser = asyncHandler(async (req, res) => {
  const incomingRequestToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRequestToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRequestToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid request token");
    }
    if (incomingRequestToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, "Access token refreshed successfully", {
          accessToken,
          refreshToken,
        })
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req?.user._id);
  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old password is incorrect");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully", {}));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "Current user fetched successfully", req.user));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "Invalid request");
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, "Account updated successfully", user));
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "Email already exists");
    }
    throw error;
  }
});

const uploadUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar?.secure_url) {
    throw new ApiError(400, "Error while uploading");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.secure_url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, "Avatar updated successfully", user));
});

const uploadUserCoverImage = asyncHandler(async (req, res) => {
  const CoverImageLocalPath = req.file?.path;

  if (!CoverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is required");
  }
  const coverImage = await uploadOnCloudinary(CoverImageLocalPath);
  if (!coverImage?.secure_url) {
    throw new ApiError(400, "Error while uploading");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.secure_url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, "Cover Image updated successfully", user));
}); 
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshTokenUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  uploadUserAvatar,
  uploadUserCoverImage
};
