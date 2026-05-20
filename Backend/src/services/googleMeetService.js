import dotenv from "dotenv";
dotenv.config();

let google;
try {
  const mod = await import("googleapis");
  google = mod.google;
} catch {
  // googleapis not available — all methods become no-ops
}

const isConfigured = () =>
  !!(
    google &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );

const getCalendar = () => {
  if (!isConfigured()) return null;
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/auth/google/callback"
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: "v3", auth: oauth2Client });
};

/**
 * Create a Google Calendar event with a Google Meet conference link.
 * Returns { meetingLink, googleEventId } — both empty strings on failure.
 */
export const createMeetEvent = async ({ title, description = "", startTime, endTime }) => {
  const calendar = getCalendar();
  if (!calendar) return { meetingLink: "", googleEventId: "" };

  try {
    const { data: event } = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      requestBody: {
        summary: title,
        description,
        start: { dateTime: new Date(startTime).toISOString(), timeZone: "UTC" },
        end: { dateTime: new Date(endTime).toISOString(), timeZone: "UTC" },
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    const meetingLink =
      event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ||
      event.hangoutLink ||
      "";

    console.log(`[GoogleMeet] Created event "${title}" → ${meetingLink || "no link"}`);
    return { meetingLink, googleEventId: event.id || "" };
  } catch (err) {
    console.error("[GoogleMeet] createMeetEvent failed:", err.message);
    return { meetingLink: "", googleEventId: "" };
  }
};

/**
 * Patch an existing Calendar event (title/time change).
 * Silently no-ops if Google not configured or eventId missing.
 */
export const updateMeetEvent = async (googleEventId, { title, description, startTime, endTime }) => {
  const calendar = getCalendar();
  if (!calendar || !googleEventId) return;

  try {
    await calendar.events.patch({
      calendarId: "primary",
      eventId: googleEventId,
      requestBody: {
        summary: title,
        description: description || "",
        start: { dateTime: new Date(startTime).toISOString(), timeZone: "UTC" },
        end: { dateTime: new Date(endTime).toISOString(), timeZone: "UTC" },
      },
    });
    console.log(`[GoogleMeet] Updated event ${googleEventId}`);
  } catch (err) {
    console.error("[GoogleMeet] updateMeetEvent failed:", err.message);
  }
};

/**
 * Cancel (delete) a Google Calendar event.
 * Silently no-ops if Google not configured or eventId missing.
 */
export const cancelMeetEvent = async (googleEventId) => {
  const calendar = getCalendar();
  if (!calendar || !googleEventId) return;

  try {
    await calendar.events.delete({ calendarId: "primary", eventId: googleEventId });
    console.log(`[GoogleMeet] Cancelled event ${googleEventId}`);
  } catch (err) {
    console.error("[GoogleMeet] cancelMeetEvent failed:", err.message);
  }
};

export const googleMeetConfigured = () => isConfigured();
