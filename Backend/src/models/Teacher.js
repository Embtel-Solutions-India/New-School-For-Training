import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
      index: true,
    },
    expertise: [{
      type: String,
      trim: true,
    }],
    bio: {
      type: String,
      default: "",
      maxlength: [500, "Bio must be less than 500 characters"],
    },
    qualifications: [{
      title: String,
      institution: String,
      year: Number,
    }],
    socialLinks: {
      linkedin: String,
      twitter: String,
      website: String,
    },
    assignedCourses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    }],
    totalStudents: {
      type: Number,
      default: 0,
      index: true,
    },
    totalCourses: {
      type: Number,
      default: 0,
      index: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    responseTime: {
      type: Number,
      default: 24,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: String,
    verificationDocuments: [{
      type: String,
      url: String,
      uploadedAt: Date,
    }],
    statistics: {
      lessonsCreated: {
        type: Number,
        default: 0,
      },
      assignmentsCreated: {
        type: Number,
        default: 0,
      },
      quizzesCreated: {
        type: Number,
        default: 0,
      },
      studentsEnrolled: {
        type: Number,
        default: 0,
      },
      coursesCompleted: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

teacherSchema.index({ userId: 1 });
teacherSchema.index({ approvalStatus: 1 });
teacherSchema.index({ isVerified: 1 });

export default mongoose.model("Teacher", teacherSchema);
