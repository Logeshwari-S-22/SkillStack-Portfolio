// lib/gemini.js - Updated to use OpenRouter
import axios from "axios";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Main function to call OpenRouter
export async function askGemini(prompt, jsonMode = false) {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not set in environment variables");
    }

    const fullPrompt = jsonMode
      ? `${prompt}\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, no backticks, no explanation. Just raw JSON.`
      : prompt;

    // Use OpenRouter to call a model
    // Available models: gpt-4-turbo, claude-3-opus, mistral-large, etc.
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: "gpt-3.5-turbo",  // Fast and reliable
        messages: [
          {
            role: "user",
            content: fullPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
          "X-Title": "SkillVault",
        },
      }
    );

    const text = response.data.choices[0].message.content.trim();

    if (jsonMode) {
      // Clean any accidental markdown
      const clean = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      console.log("Cleaned response:", clean.substring(0, 200));

      try {
        return JSON.parse(clean);
      } catch (parseErr) {
        console.error("JSON parse failed. Raw response:", text);
        throw new Error(`Invalid JSON from AI: ${parseErr.message}`);
      }
    }

    return text;
  } catch (err) {
    console.error("OpenRouter error:", err.message);
    throw new Error("AI request failed: " + err.message);
  }
}