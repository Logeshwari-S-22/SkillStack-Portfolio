import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Main function to call Gemini
export async function askGemini(prompt, jsonMode = false) {
  try {
    // Use gemini-1.5-pro-latest or gemini-1.5-flash-latest
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro-latest",
    });

    const fullPrompt = jsonMode
      ? `${prompt}\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, no backticks, no explanation. Just raw JSON.`
      : prompt;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text().trim();

    if (jsonMode) {
      // Clean any accidental markdown
      const clean = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(clean);
    }

    return text;
  } catch (err) {
    console.error("Gemini error:", err.message);
    throw new Error("AI request failed: " + err.message);
  }
}