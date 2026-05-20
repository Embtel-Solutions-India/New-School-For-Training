import api from "./api";

const T = "/teacher";

// ── Dashboard Overview
const getOverview = () => api.get(`${T}/overview`);

// ── Courses
const getCourses = (params) => api.get(`${T}/courses`, { params });
const getCourseById = (id) => api.get(`${T}/courses/${id}`);
const createCourse = (data) => api.post(`${T}/courses`, data);
const updateCourse = (id, data) => api.patch(`${T}/courses/${id}`, data);
const deleteCourse = (id) => api.delete(`${T}/courses/${id}`);
const publishCourse = (id, published) => api.patch(`${T}/courses/${id}/publish`, { published });

// ── Sections
const getSections = (courseId) => api.get(`${T}/courses/${courseId}/sections`);
const createSection = (courseId, data) => api.post(`${T}/courses/${courseId}/sections`, data);
const updateSection = (courseId, sectionId, data) => api.patch(`${T}/courses/${courseId}/sections/${sectionId}`, data);
const deleteSection = (courseId, sectionId) => api.delete(`${T}/courses/${courseId}/sections/${sectionId}`);

// ── Lessons
const createLesson = (courseId, data) => api.post(`${T}/courses/${courseId}/lessons`, data);
const updateLesson = (courseId, lessonId, data) => api.patch(`${T}/courses/${courseId}/lessons/${lessonId}`, data);
const deleteLesson = (courseId, lessonId) => api.delete(`${T}/courses/${courseId}/lessons/${lessonId}`);
const reorderLessons = (courseId, order) => api.patch(`${T}/courses/${courseId}/lessons/reorder`, { order });

// ── Quizzes
const createQuiz = (courseId, data) => api.post(`${T}/courses/${courseId}/quizzes`, data);
const updateQuiz = (courseId, quizId, data) => api.patch(`${T}/courses/${courseId}/quizzes/${quizId}`, data);
const deleteQuiz = (courseId, quizId) => api.delete(`${T}/courses/${courseId}/quizzes/${quizId}`);

// ── Assignments
const createAssignment = (courseId, data) => api.post(`${T}/courses/${courseId}/assignments`, data);
const updateAssignment = (courseId, assignId, data) => api.patch(`${T}/courses/${courseId}/assignments/${assignId}`, data);
const deleteAssignment = (courseId, assignId) => api.delete(`${T}/courses/${courseId}/assignments/${assignId}`);

// ── Live Classes
const getLiveClasses = (params) => api.get(`${T}/live`, { params });
const getLiveClass = (id) => api.get(`${T}/live/${id}`);
const createLiveClass = (data) => api.post(`${T}/live`, data);
const updateLiveClass = (id, data) => api.patch(`${T}/live/${id}`, data);
const deleteLiveClass = (id) => api.delete(`${T}/live/${id}`);
const cancelLiveClass = (id) => api.patch(`${T}/live/${id}/cancel`);
const startLiveClass = (id) => api.patch(`${T}/live/${id}/start`);
const endLiveClass = (id, data) => api.patch(`${T}/live/${id}/end`, data);
const getSessionAttendance = (sessionId) => api.get(`${T}/live/${sessionId}/attendance`);
const markAttendance = (sessionId, data) => api.post(`${T}/live/${sessionId}/attendance`, data);
const getAttendanceReport = (params) => api.get(`${T}/attendance/report`, { params });
const attachRecording = (id, data) => api.post(`${T}/live/${id}/recording`, data);
const getRecordings = (id) => api.get(`${T}/live/${id}/recordings`);

// ── Notifications
const sendNotification = (data) => api.post(`${T}/notifications`, data);

// ── Student Progress
const getStudents = (params) => api.get(`${T}/students`, { params });
const getProgressAnalytics = (params) => api.get(`${T}/students/analytics`, { params });
const updateStudentProgress = (enrollmentId, data) => api.patch(`${T}/students/${enrollmentId}/progress`, data);

// ── Reviews
const getReviews = (params) => api.get(`${T}/reviews`, { params });
const replyToReview = (id, reply) => api.patch(`${T}/reviews/${id}/reply`, { reply });
const deleteReviewReply = (id) => api.delete(`${T}/reviews/${id}/reply`);

// ── Discussions
const getDiscussions = (courseId, params) => api.get(`${T}/discussions/${courseId}`, { params });
const replyToDiscussion = (id, content) => api.post(`${T}/discussions/${id}/reply`, { content });
const pinDiscussion = (id) => api.patch(`${T}/discussions/${id}/pin`);
const deleteDiscussion = (id) => api.delete(`${T}/discussions/${id}`);

// ── Question Bank
const getQuestions = (params) => api.get(`${T}/question-bank`, { params });
const createQuestion = (data) => api.post(`${T}/question-bank`, data);
const updateQuestion = (id, data) => api.patch(`${T}/question-bank/${id}`, data);
const deleteQuestion = (id) => api.delete(`${T}/question-bank/${id}`);
const getQuestionStats = () => api.get(`${T}/question-bank/stats`);

// ── Content Analytics
const getContentAnalytics = (params) => api.get(`${T}/analytics/content`, { params });

const teacherApi = {
  getOverview,
  getCourses, getCourseById, createCourse, updateCourse, deleteCourse, publishCourse,
  getSections, createSection, updateSection, deleteSection,
  createLesson, updateLesson, deleteLesson, reorderLessons,
  createQuiz, updateQuiz, deleteQuiz,
  createAssignment, updateAssignment, deleteAssignment,
  getLiveClasses, getLiveClass, createLiveClass, updateLiveClass, deleteLiveClass,
  cancelLiveClass, startLiveClass, endLiveClass,
  getSessionAttendance, markAttendance, getAttendanceReport,
  attachRecording, getRecordings,
  sendNotification,
  getStudents, getProgressAnalytics, updateStudentProgress,
  getReviews, replyToReview, deleteReviewReply,
  getDiscussions, replyToDiscussion, pinDiscussion, deleteDiscussion,
  getQuestions, createQuestion, updateQuestion, deleteQuestion, getQuestionStats,
  getContentAnalytics,
};

export default teacherApi;
