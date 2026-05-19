import AuditLog from "../models/AuditLog.js";

export const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const action = req.query.action || "";
    const resource = req.query.resource || "";
    const status = req.query.status || "";
    const actorId = req.query.actorId || "";

    const query = {};
    if (action) query.action = { $regex: action, $options: "i" };
    if (resource) query.resource = resource;
    if (status) query.status = status;
    if (actorId) query["actor.userId"] = actorId;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      AuditLog.countDocuments(query),
    ]);

    res.json({ success: true, logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAuditLogStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [byAction, byResource, recentCount] = await Promise.all([
      AuditLog.aggregate([
        { $group: { _id: "$action", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AuditLog.aggregate([
        { $group: { _id: "$resource", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AuditLog.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    res.json({ success: true, stats: { byAction, byResource, recentCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
