import mongoose, { Schema} from "mongoose";

const subscriptionSchema = new Schema(
    {
        // one user who subscribes to another channel
        subscriber: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // the channel that the user subscribes to
        channel: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    }, 
    {timestamps: true}
)

export const Subscription = mongoose.model("Subscription", subscriptionSchema)