import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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


export { registerUser }