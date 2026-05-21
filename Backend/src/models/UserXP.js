import mongoose from "mongoose";
const { Schema } = mongoose;

const userXPSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    unlockedBadges: [{ type: String }],
    // Dedup log: each entry is a unique event key + timestamp
    eventLog: [
      {
        key: { type: String, required: true },
        awardedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

userXPSchema.index({ totalXP: -1 });

export default mongoose.model("UserXP", userXPSchema);
