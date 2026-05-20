import API from "./api";

const B = "/blogs";
const T = "/teacher/blogs";
const ADM = "/admin/blogs";

const blogApi = {
  // ── Public
  getPublicBlogs: (params) => API.get(B, { params }),
  getPublicCategories: () => API.get(`${B}/categories`),
  getBlogBySlug: (slug) => API.get(`${B}/${slug}`),

  // ── Teacher (authenticated)
  getMyBlogs: () => API.get(T),
  getBlogAnalytics: () => API.get(`${T}/analytics`),
  createBlog: (data) => API.post(T, data),
  updateBlog: (id, data) => API.put(`${T}/${id}`, data),
  deleteBlog: (id) => API.delete(`${T}/${id}`),
  submitForReview: (id) => API.post(`${T}/${id}/submit`),

  // ── Likes (authenticated)
  toggleLike: (blogId) => API.post(`${B}/${blogId}/like`),
  getLikeStatus: (blogId) => API.get(`${B}/${blogId}/like-status`),

  // ── Comments
  getComments: (blogId) => API.get(`${B}/${blogId}/comments`),
  createComment: (blogId, data) => API.post(`${B}/${blogId}/comments`, data),
  updateComment: (blogId, commentId, data) => API.put(`${B}/${blogId}/comments/${commentId}`, data),
  deleteComment: (blogId, commentId) => API.delete(`${B}/${blogId}/comments/${commentId}`),

  // ── Admin
  getAllBlogsAdmin: (params) => API.get(ADM, { params }),
  getPendingBlogs: () => API.get(`${ADM}/pending`),
  approveBlog: (id) => API.post(`${ADM}/${id}/approve`),
  rejectBlog: (id, note) => API.post(`${ADM}/${id}/reject`, { note }),
  adminDeleteBlog: (id) => API.delete(`${ADM}/${id}`),
};

export default blogApi;
