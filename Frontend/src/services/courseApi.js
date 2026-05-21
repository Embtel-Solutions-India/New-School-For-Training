import API from "./api";

export const courseApi = {
  getPublicCourses: (params) => API.get("/courses/public", { params }),
  getPublicCategories: () => API.get("/courses/public/categories"),
  getPublicCourseById: (courseId) => API.get(`/courses/public/${courseId}`),
  getCourseReviews: (courseId, params) => API.get(`/courses/public/${courseId}/reviews`, { params }),
  getTopReviews: () => API.get("/courses/public/top-reviews"),
  list: () => API.get("/courses"),
  create: (payload) => API.post("/courses", payload),
  update: (courseId, payload) => API.patch(`/courses/${courseId}`, payload),
  remove: (courseId) => API.delete(`/courses/${courseId}`),
  publish: (courseId, published) => API.patch(`/courses/${courseId}/publish`, { published }),
  createLesson: (courseId, payload) => API.post(`/courses/${courseId}/lessons`, payload),
  updateLesson: (courseId, lessonId, payload) =>
    API.patch(`/courses/${courseId}/lessons/${lessonId}`, payload),
  deleteLesson: (courseId, lessonId) => API.delete(`/courses/${courseId}/lessons/${lessonId}`),
  reorderLessons: (courseId, order) => API.patch(`/courses/${courseId}/lessons/reorder`, { order }),
  createQuiz: (courseId, payload) => API.post(`/courses/${courseId}/quizzes`, payload),
  createAssignment: (courseId, payload) => API.post(`/courses/${courseId}/assignments`, payload),
};

export default courseApi;
