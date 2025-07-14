const asyncHandler = (requesHandler) => {
    (req, res, next) =>{
        Promise.resolve(requesHandler(req, res, next)).catch((error)=>{
            next(error)
        })
    }
}



export { asyncHandler}

// const asyncHandler = (fn) => () => {}
// const asyncHandler = (fn) => async () => {}



// try catch method 

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     }catch (error){
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message || "Internal server error"
//         })
//     }
// }