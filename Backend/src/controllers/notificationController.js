import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";

const logAction = async (action, req, resourceId, details = {}) => {
  try {
    await AuditLog.create({
      action,
      actor: { userId: req.user?._id, name: req.user?.name || "", email: req.user?.email || "", role: req.user?.role || "admin" },
      resource: "notification",
      resourceId,
      details,
      ipAddress: req.ip || "unknown",
      status: "success",
    });
  } catch (_) {}
};

export const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const targetAudience = req.query.targetAudience || "";

    const query = {};
    if (targetAudience) query.targetAudience = targetAudience;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate("sentBy", "name email avatar")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      Notification.countDocuments(query),
    ]);

    res.json({ success: true, notifications, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendNotification = async (req, res) => {
  try {
    const { title, message, type, targetAudience, targetUsers } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required" });
    }

    const notification = await Notification.create({
      title,
      message,
      type: type || "announcement",
      targetAudience: targetAudience || "all",
      targetUsers: targetAudience === "specific" ? (targetUsers || []) : [],
      sentBy: req.user._id,
      isActive: true,
    });

    await logAction("NOTIFICATION_SENT", req, notification._id, {
      title,
      targetAudience: notification.targetAudience,
    });

    res.status(201).json({ success: true, message: "Notification sent successfully", notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndDelete(notificationId);
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });

    await logAction("NOTIFICATION_DELETED", req, notificationId, { title: notification.title });
    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findById(notificationId);
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });

    notification.isActive = !notification.isActive;
    await notification.save();

    res.json({ success: true, message: `Notification ${notification.isActive ? "activated" : "deactivated"}`, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
