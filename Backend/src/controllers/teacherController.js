import User from "../models/User.js";
import Teacher from "../models/Teacher.js";
import bcryptjs from "bcryptjs";

export const createTeacher = async (req, res) => {
  try {
    const { name, email, password, avatar, expertise, assignedCourses } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }

    // Pass plain password — User model's pre-save hook hashes it
    const newTeacher = new User({
      name,
      email,
      password,
      role: "teacher",
      provider: "local",
      avatar: avatar || "",
      expertise: expertise || [],
      assignedCourses: assignedCourses || [],
      isVerified: true,
      accountStatus: "active",
      username: email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase(),
    });

    await newTeacher.save();

    const teacherProfile = new Teacher({
      userId: newTeacher._id,
      expertise: expertise || [],
      assignedCourses: assignedCourses || [],
      approvalStatus: "approved",
      isVerified: true,
    });

    await teacherProfile.save();

    res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      teacher: {
        _id: newTeacher._id,
        name: newTeacher.name,
        email: newTeacher.email,
        role: newTeacher.role,
        avatar: newTeacher.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { name, avatar, expertise, assignedCourses, bio } = req.body;

    const teacher = await User.findByIdAndUpdate(
      teacherId,
      {
        name: name || undefined,
        avatar: avatar || undefined,
        expertise: expertise || undefined,
        assignedCourses: assignedCourses || undefined,
        bio: bio || undefined,
      },
      { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    if (expertise) {
      await Teacher.findOneAndUpdate(
        { userId: teacherId },
        { expertise, assignedCourses },
        { new: true }
      );
    }

    res.json({ success: true, message: "Teacher updated successfully", teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await User.findByIdAndDelete(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    await Teacher.findOneAndDelete({ userId: teacherId });

    res.json({ success: true, message: "Teacher deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const suspendTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await User.findByIdAndUpdate(
      teacherId,
      { isSuspended: true, accountStatus: "suspended" },
      { new: true }
    ).select("-password -refreshToken");

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    res.json({ success: true, message: "Teacher suspended successfully", teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activateTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await User.findByIdAndUpdate(
      teacherId,
      { isSuspended: false, accountStatus: "active" },
      { new: true }
    ).select("-password -refreshToken");

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    res.json({ success: true, message: "Teacher activated successfully", teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetTeacherPassword = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 8 characters long" 
      });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 12);

    const teacher = await User.findByIdAndUpdate(
      teacherId,
      { password: hashedPassword },
      { new: true }
    ).select("-password -refreshToken");

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    res.json({ success: true, message: "Password reset successfully", teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeacherAnalytics = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await User.findById(teacherId).select("-password -refreshToken");
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    const teacherProfile = await Teacher.findOne({ userId: teacherId });

    const analytics = {
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        avatar: teacher.avatar,
        expertise: teacher.expertise,
      },
      statistics: {
        totalStudents: teacherProfile?.totalStudents || 0,
        totalCourses: teacherProfile?.totalCourses || 0,
        averageRating: teacherProfile?.averageRating || 0,
        totalReviews: teacherProfile?.totalReviews || 0,
        totalEarnings: teacherProfile?.totalEarnings || 0,
      },
      createdAt: teacher.createdAt,
      lastLogin: teacher.lastLogin,
    };

    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
