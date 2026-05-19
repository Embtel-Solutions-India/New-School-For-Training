import API from "./api";

const B = "/blogs";
const T = "/teacher/blogs";

const blogApi = {
  // ── Public
  getPublicBlogs: (params) => API.get(B, { params }),
  getPublicCategories: () => API.get(`${B}/categories`),
  getBlogBySlug: (slug) => API.get(`${B}/${slug}`),

  // ── Teacher (authenticated)
  getMyBlogs: () => API.get(T),
  createBlog: (data) => API.post(T, data),
  updateBlog: (id, data) => API.put(`${T}/${id}`, data),
  deleteBlog: (id) => API.delete(`${T}/${id}`),
};

export default blogApi;
