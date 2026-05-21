import { GoogleGenerativeAI } from "@google/generative-ai";

const DICEBEAR_STYLES = ["adventurer", "avataaars", "big-ears", "bottts", "fun-emoji", "lorelei", "micah", "notionists", "open-peeps", "personas"];

export const generateAIAvatarUrl = async ({ name, skills = [], interests = [], learningGoals = [], completedCourses = 0 }) => {
  if (!process.env.GEMINI_API_KEY) throw new Error("AI_NOT_CONFIGURED");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are helping pick an avatar style for a learner on an online education platform.

Learner profile:
- Name: ${name}
- Skills: ${skills.slice(0, 5).join(", ") || "none listed"}
- Interests: ${interests.slice(0, 5).join(", ") || "none listed"}
- Goals: ${learningGoals.slice(0, 3).join(", ") || "none listed"}
- Completed courses: ${completedCourses}

Available DiceBear avatar styles: ${DICEBEAR_STYLES.join(", ")}

Based on the learner's profile, pick ONE style from the list above and ONE descriptive seed word (e.g. their first name, a hobby keyword, or personality trait).

Respond ONLY with a JSON object in this exact format (no markdown, no explanation):
{"style":"<style>","seed":"<seed>"}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const style = DICEBEAR_STYLES.includes(parsed.style) ? parsed.style : "adventurer";
    const seed = encodeURIComponent(parsed.seed || name);
    const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
    const promptSummary = `Style: ${style}, Seed: ${parsed.seed || name}`;

    return { avatarUrl, promptSummary };
  } catch {
    // Fallback: use name as seed with adventurer style
    const seed = encodeURIComponent(name);
    return {
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`,
      promptSummary: `Style: adventurer, Seed: ${name}`,
    };
  }
};
