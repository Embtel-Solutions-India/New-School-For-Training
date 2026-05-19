import mongoose from "mongoose";

const liveClassSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: "" },
    scheduledAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: 60 },
    meetingLink: { type: String, trim: true, default: "" },
    meetingId: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["scheduled", "live", "ended", "cancelled"],
      default: "scheduled",
      index: true,
    },
    startedAt: Date,
    endedAt: Date,
    recordingUrl: { type: String, trim: true, default: "" },
    attendanceCount: { type: Number, default: 0 },
    notifiedStudents: { type: Boolean, default: false },
  },
  { timestamps: true }
);

liveClassSchema.index({ teacher: 1, scheduledAt: -1 });

export default mongoose.model("LiveClass", liveClassSchema);
