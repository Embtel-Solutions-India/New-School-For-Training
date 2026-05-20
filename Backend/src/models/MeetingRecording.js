import mongoose from "mongoose";

const meetingRecordingSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveClass",
      required: true,
      index: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, required: true },
    platform: {
      type: String,
      enum: ["google_drive", "youtube", "s3", "other"],
      default: "other",
    },
    durationMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

meetingRecordingSchema.index({ session: 1 });

export default mongoose.model("MeetingRecording", meetingRecordingSchema);
