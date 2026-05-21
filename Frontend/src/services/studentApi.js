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
const saveLessonProgress = (courseId, lessonId, data) => api.post(`${S}/courses/${courseId}/lessons/${lessonId}/progress`, data);
const getLessonProgress = (courseId, lessonId) => api.get(`${S}/courses/${courseId}/lessons/${lessonId}/progress`);

// ── Certificates
const getMyCertificates = () => api.get(`${S}/certificates`);
const verifyCertificate = (certId) => api.get(`${S}/certificates/verify/${certId}`);
const downloadCertificate = (certId) =>
  api.get(`/certificate/download/${certId}`, { responseType: "blob" });

// ── Learning Progress
const getLearningProgress = () => api.get(`${S}/progress`);

// ── Video Playback (signed S3 URLs)
const getVideoSignedUrl = (lessonId) => api.get(`/lesson/video/${lessonId}`);

// ── Live Classes
const getUpcomingLiveClasses = () => api.get(`${S}/live`);
const joinLiveClass = (id) => api.post(`${S}/live/${id}/join`);
const leaveLiveClass = (id) => api.post(`${S}/live/${id}/leave`);
const getAttendanceHistory = () => api.get(`${S}/live/attendance`);

// ── Assignments
const getMyAssignments = (params) => api.get(`${S}/assignments`, { params });
const submitAssignment = (courseId, assignmentId, data) =>
  api.post(`${S}/courses/${courseId}/assignments/${assignmentId}/submit`, data);

// ── Quizzes
const getQuizHistory = (params) => api.get(`${S}/quizzes`, { params });
const getAvailableQuizzes = () => api.get(`${S}/quizzes/available`);
const getCourseQuizzes = (courseId) => api.get(`${S}/courses/${courseId}/quizzes`);
const submitQuizAttempt = (courseId, quizId, data) =>
  api.post(`${S}/courses/${courseId}/quizzes/${quizId}/attempt`, data);

// ── Leaderboard, Achievements & XP
const getLeaderboard = (params) => api.get(`${S}/leaderboard`, { params });
const getMyAchievements = () => api.get(`${S}/achievements`);
const getXpProfile = () => api.get(`${S}/xp`);

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

// ── Community
const getMyCommunities = () => api.get(`${S}/community`);
const getTrendingPosts = () => api.get(`${S}/community/trending`);
const getCoursePosts = (courseId, params) => api.get(`${S}/community/${courseId}/posts`, { params });
const createCommunityPost = (courseId, data) => api.post(`${S}/community/${courseId}/posts`, data);
const getCourseAnnouncements = (courseId) => api.get(`${S}/community/${courseId}/announcements`);
const getPostReplies = (postId) => api.get(`${S}/community/posts/${postId}/replies`);
const replyToPost = (postId, data) => api.post(`${S}/community/posts/${postId}/reply`, data);
const likePost = (postId) => api.post(`${S}/community/posts/${postId}/like`);
const summarizePost = (postId) => api.post(`${S}/community/posts/${postId}/summarize`);

// ── Placement / Jobs
const getJobs = (params) => api.get("/jobs", { params });
const getRecommendedJobs = () => api.get("/jobs/recommended");
const getJobById = (id) => api.get(`/jobs/${id}`);
const getMyApplications = () => api.get("/jobs/my-applications");
const getSavedJobs = () => api.get("/jobs/saved");
const applyJob = (id, data) => api.post(`/jobs/${id}/apply`, data);
const toggleSaveJob = (id) => api.post(`/jobs/${id}/save`);

// ── Resume
const getMyResume = () => api.get("/resume");
const saveResume = (data) => api.post("/resume", data);
const autofillResume = () => api.post("/resume/autofill");
const aiEnhanceResume = (data) => api.post("/resume/ai-enhance", { resumeData: data });
const downloadResumePDF = () => api.get("/resume/download", { responseType: "blob" });

// ── Profile
const getProfile = () => api.get(`${S}/profile`);
const updateProfile = (data) => api.patch(`${S}/profile`, data);
const changePassword = (data) => api.patch(`${S}/profile/password`, data);
const generateAIAvatar = () => api.post(`${S}/profile/avatar/generate`);
const getStudentActivity = (params) => api.get(`${S}/profile/activity`, { params });

const studentApi = {
  getOverview,
  getAllCourses, getCourseCategories, getEnrolledCourses, enrollCourse,
  getCourseLessons, markLessonComplete, saveLessonProgress, getLessonProgress,
  getVideoSignedUrl,
  getMyCertificates, verifyCertificate, downloadCertificate,
  getLearningProgress,
  getUpcomingLiveClasses, joinLiveClass, leaveLiveClass, getAttendanceHistory,
  getMyAssignments, submitAssignment,
  getQuizHistory, getAvailableQuizzes, getCourseQuizzes, submitQuizAttempt,
  getLeaderboard, getMyAchievements, getXpProfile,
  getNotifications, markNotificationRead, markAllNotificationsRead,
  getBookmarks, addBookmark, removeBookmark,
  getDownloads,
  getMyCommunities, getTrendingPosts, getCoursePosts, createCommunityPost,
  getCourseAnnouncements, getPostReplies, replyToPost, likePost, summarizePost,
  getProfile, updateProfile, changePassword, generateAIAvatar, getStudentActivity,
  getJobs, getRecommendedJobs, getJobById, getMyApplications, getSavedJobs, applyJob, toggleSaveJob,
  getMyResume, saveResume, autofillResume, aiEnhanceResume, downloadResumePDF,
};

export default studentApi;
