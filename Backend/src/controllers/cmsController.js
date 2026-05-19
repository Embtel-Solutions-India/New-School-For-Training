import CmsContent from "../models/CmsContent.js";
import AuditLog from "../models/AuditLog.js";

const logAction = async (action, req, resourceId, details = {}) => {
  try {
    await AuditLog.create({
      action,
      actor: { userId: req.user?._id, name: req.user?.name || "", email: req.user?.email || "", role: req.user?.role || "admin" },
      resource: "cms",
      resourceId,
      details,
      ipAddress: req.ip || "unknown",
      status: "success",
    });
  } catch (_) {}
};

export const getCmsContent = async (req, res) => {
  try {
    const type = req.query.type || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const query = {};
    if (type) query.type = type;

    const [items, total] = await Promise.all([
      CmsContent.find(query)
        .populate("createdBy", "name email")
        .sort({ order: 1, createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      CmsContent.countDocuments(query),
    ]);

    const summary = await CmsContent.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    res.json({ success: true, items, total, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCmsItem = async (req, res) => {
  try {
    const { type, title, content, image, active, order, author, tags, metadata } = req.body;

    const item = await CmsContent.create({
      type,
      title,
      content: content || "",
      image: image || "",
      active: active !== undefined ? active : true,
      order: order || 0,
      author: author || "",
      tags: tags || [],
      metadata: metadata || {},
      createdBy: req.user._id,
    });

    await logAction("CMS_ITEM_CREATED", req, item._id, { type, title });
    res.status(201).json({ success: true, message: "CMS item created", item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCmsItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { title, content, image, active, order, author, tags, metadata } = req.body;

    const item = await CmsContent.findByIdAndUpdate(
      itemId,
      { title, content, image, active, order, author, tags, metadata },
      { new: true, runValidators: true }
    );

    if (!item) return res.status(404).json({ success: false, message: "CMS item not found" });

    await logAction("CMS_ITEM_UPDATED", req, itemId, { type: item.type, title: item.title });
    res.json({ success: true, message: "CMS item updated", item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCmsItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await CmsContent.findByIdAndDelete(itemId);
    if (!item) return res.status(404).json({ success: false, message: "CMS item not found" });

    await logAction("CMS_ITEM_DELETED", req, itemId, { type: item.type, title: item.title });
    res.json({ success: true, message: "CMS item deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
