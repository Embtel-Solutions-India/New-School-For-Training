import api from "./api";

const S = "/student";

// ── Overview
const getOverview = () => api.get(`${S}/overview`);

// ── Courses
const getAllCourses = (params) => api.get(`${S}/courses`, { params });
const getCourseCategories = () => api.get(`${S}/courses/categories`);
const getEnrolledCourses = (params) => api.get(`${S}/enrolled`, { params });

// ── Lessons
const getCourseLessons = (courseId) => api.get(`${S}/courses/${courseId}/lessons`);
const markLessonComplete = (courseId, lessonId) => api.post(`${S}/courses/${courseId}/lessons/${lessonId}/complete`);

// ── Certificates
const getMyCertificates = () => api.get(`${S}/certificates`);
const verifyCertificate = (certId) => api.get(`${S}/certificates/verify/${certId}`);

// ── Learning Progress
const getLearningProgress = () => api.get(`${S}/progress`);

// ── Live Classes
const getUpcomingLiveClasses = () => api.get(`${S}/live`);

// ── Assignments
const getMyAssignments = (params) => api.get(`${S}/assignments`, { params });
const submitAssignment = (courseId, assignmentId, data) =>
  api.post(`${S}/courses/${courseId}/assignments/${assignmentId}/submit`, data);

// ── Quizzes
const getQuizHistory = (params) => api.get(`${S}/quizzes`, { params });
const getCourseQuizzes = (courseId) => api.get(`${S}/courses/${courseId}/quizzes`);
const submitQuizAttempt = (courseId, quizId, data) =>
  api.post(`${S}/courses/${courseId}/quizzes/${quizId}/attempt`, data);

// ── Leaderboard & Achievements
const getLeaderboard = () => api.get(`${S}/leaderboard`);
const getMyAchievements = () => api.get(`${S}/achievements`);

// ── Notifications
const getNotifications = (params) => api.get(`${S}/notifications`, { params });
const markNotificationRead = (id) => api.patch(`${S}/notifications/${id}/read`);
const markAllNotificationsRead = () => api.patch(`${S}/notifications/read-all`);

// ── Bookmarks
const getBookmarks = (params) => api.get(`${S}/bookmarks`, { params });
const addBookmark = (data) => api.post(`${S}/bookmarks`, data);
const removeBookmark = (id) => api.delete(`${S}/bookmarks/${id}`);

// ── Enrollment
const enrollCourse = (courseId) => api.post(`${S}/courses/${courseId}/enroll`);

// ── Downloads
const getDownloads = () => api.get(`${S}/downloads`);

// ── Profile
const getProfile = () => api.get(`${S}/profile`);
const updateProfile = (data) => api.patch(`${S}/profile`, data);
const changePassword = (data) => api.patch(`${S}/profile/password`, data);

const studentApi = {
  getOverview,
  getAllCourses, getCourseCategories, getEnrolledCourses, enrollCourse,
  getCourseLessons, markLessonComplete,
  getMyCertificates, verifyCertificate,
  getLearningProgress,
  getUpcomingLiveClasses,
  getMyAssignments, submitAssignment,
  getQuizHistory, getCourseQuizzes, submitQuizAttempt,
  getLeaderboard, getMyAchievements,
  getNotifications, markNotificationRead, markAllNotificationsRead,
  getBookmarks, addBookmark, removeBookmark,
  getDownloads,
  getProfile, updateProfile, changePassword,
};

export default studentApi;
