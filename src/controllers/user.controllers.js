import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user =await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError("Something went wrong while generating access and refresh token ", 500);
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation of fields - not empty
    // check if user already exists - username or email
    // check for image, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in database
    // remove password and refresh token from response
    // check for user creation success
    // return res


    const { fullname, username, email, password } = req.body

    // console.log("email ",email)

    // if(fullname === ""){
    //     return new ApiError("Fullname is required", 400)
    // }

    if(
        [fullname, username, email, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError("All fields are required", 400)
    }

    const existedUer = await User.findOne({
        $or: [
            { username },
            { email },

        ]
    })
    if(existedUer){
        throw new ApiError("User already exists", 409)
    }

    // console.log("req.files ", req.files)

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalpath = req.files?.coverImage[0]?.path;

    let coverImageLocalpath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalpath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath) {
        throw new ApiError("Avatar is required", 400)
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalpath)

    if(!avatar) {
        throw new ApiError("Avatar upload failed", 500)
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError("User creation failed", 500)
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User created successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // generate access and refresh token
    // sned cookies

    const { username, email, password } = req.body;

    if(!username && !email) {
        throw new ApiError("Username or email is required", 400)
    }

    if(!password) {
        throw new ApiError("Password is required", 400)
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(!user) {
        throw new ApiError("User not found", 404)
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError("Invalid user credentials ", 401)
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser =await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
        200,{
            user: loggedInUser,accessToken, refreshToken,
        },
        "User logged in successfully"
    )
})

const logoutUser = asyncHandler(async (req, res) => {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                refreshToken: null
            },
            {
                new: true,
            }
        )

        const options = {
            httpOnly: true,
            secure: true,
        }

        return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(
            new ApiResponse(200, null, "User logged out successfully")
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incommingRefreshToken) {
        throw new ApiError("unauthorized request", 401)
    }

    try {
        const decodedToken = jwt.verify(
            incommingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user =await User.findById(decodedToken?._id)
    
        if(!user) {
            throw new ApiError("unauthorized request", 401)
        }
        if(user.refreshToken !== incommingRefreshToken) {
            throw new ApiError("Refresh Token expired!", 401)
        }
    
        const options = {
            httpOnly: true,
            secure: true,
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                { accessToken, refreshToken: newRefreshToken }, 
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(error?.message || "Invalid refresh token" , 401)
    }
})

export { 
    registerUser, 
    loginUser,
    logoutUser,
    generateAccessAndRefreshToken
}