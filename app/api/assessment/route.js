import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Assessment from "@/models/Assessment";
import Credential from "@/models/Credential";
import User from "@/models/User";
import { askGemini } from "@/lib/gemini";

function getUserFromToken(req) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  try { return jwt.verify(token, process.env.NEXTAUTH_SECRET); }
  catch { return null; }
}

// GET → generate questions for a skill
export async function GET(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const skill = searchParams.get("skill");
    const difficulty = searchParams.get("difficulty") || "Beginner";
    const type = searchParams.get("type") || "mcq";

    if (!skill) {
      return NextResponse.json({ error: "Skill is required" }, { status: 400 });
    }

    if (type === "mcq") {
      const prompt = `Generate exactly 5 multiple choice questions to test "${skill}" knowledge at "${difficulty}" level.

Each question must test practical understanding, not just definitions.

Return ONLY this JSON format, nothing else:
{
  "questions": [
    {
      "question": "question text here",
      "options": ["option A", "option B", "option C", "option D"],
      "correctAnswer": "option A",
      "explanation": "why this is correct"
    }
  ]
}`;

      const result = await askGemini(prompt, true);

      return NextResponse.json({
        type: "mcq",
        skill,
        difficulty,
        questions: result.questions || [],
      });

    } else {
      // Code challenge
      const prompt = `Generate ONE simple coding challenge for "${skill}" at "${difficulty}" level.

The challenge must:
- Be solvable by writing a single function
- Not require any imports or external libraries
- Be testable with simple inputs and outputs

Return ONLY this JSON format:
{
  "problem": "Write a function called add that takes two numbers and returns their sum.",
  "example": "add(2, 3) should return 5",
  "hint": "Use the + operator",
  "testCases": [
    { "input": "2, 3", "expectedOutput": "5" },
    { "input": "0, 0", "expectedOutput": "0" },
    { "input": "-1, 1", "expectedOutput": "0" }
  ],
  "starterCode": "function add(a, b) {\\n  // write your code here\\n}"
}`;

      const result = await askGemini(prompt, true);

      return NextResponse.json({
        type: "code",
        skill,
        difficulty,
        challenge: result,
      });
    }

  } catch (err) {
    console.error("Assessment GET error:", err.message);
    return NextResponse.json(
      { error: "Failed to generate questions: " + err.message },
      { status: 500 }
    );
  }
}

// POST → submit answers and get results
export async function POST(req) {
  try {
    const decoded = getUserFromToken(req);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      skill,
      difficulty,
      type,
      answers,      // MCQ answers array
      codeAnswer,   // code submission object
      antiCheat,
      timeSpent,
    } = body;

    if (!skill || !type) {
      return NextResponse.json({ error: "Skill and type are required" }, { status: 400 });
    }

    await connectDB();

    let score = 0;
    let questions = [];
    let codeChallenge = null;
    let aiFeedback = "";

    // ── Grade MCQ ──
    if (type === "mcq" && answers?.length > 0) {
      questions = answers.map(a => ({
        question: a.question,
        options: a.options || [],
        correctAnswer: a.correctAnswer,
        userAnswer: a.userAnswer,
        isCorrect: a.userAnswer?.trim() === a.correctAnswer?.trim(),
        points: a.userAnswer?.trim() === a.correctAnswer?.trim() ? 20 : 0,
      }));
      score = questions.reduce((sum, q) => sum + q.points, 0);
    }

    // ── Grade Code with Gemini ──
    if (type === "code" && codeAnswer) {
      const evalPrompt = `You are evaluating a coding solution.

Problem: "${codeAnswer.problem}"

Student's code:
${codeAnswer.userCode}

Test cases:
${(codeAnswer.testCases || []).map(tc => `Input: ${tc.input} → Expected: ${tc.expectedOutput}`).join("\n")}

Evaluate if the code logic is correct. Be fair but strict.

Return ONLY this JSON:
{
  "score": 75,
  "testResults": [
    { "input": "2, 3", "expectedOutput": "5", "passed": true },
    { "input": "0, 0", "expectedOutput": "0", "passed": true }
  ],
  "feedback": "Your solution is correct! Good use of the + operator.",
  "issues": ["Consider handling edge cases"]
}`;

      const evalResult = await askGemini(evalPrompt, true);
      score = Math.min(100, Math.max(0, evalResult.score || 0));
      aiFeedback = evalResult.feedback || "";
      codeChallenge = {
        problem: codeAnswer.problem,
        userCode: codeAnswer.userCode,
        testCases: evalResult.testResults || [],
        aiFeedback,
      };
    }

    // ── Anti-cheat penalty ──
    const pasteCount = antiCheat?.pasteCount || 0;
    const tabSwitches = antiCheat?.tabSwitches || 0;
    const isSuspicious = pasteCount > 2 || tabSwitches > 3;
    if (isSuspicious) score = Math.floor(score * 0.7);

    // ── Determine level from score ──
    const level =
      score >= 86 ? "Expert" :
      score >= 66 ? "Advanced" :
      score >= 41 ? "Intermediate" : "Beginner";

    const passed = score >= 40;

    // ── Save assessment to MongoDB ──
    const assessment = await Assessment.create({
      userId: decoded.id,
      skill,
      type,
      difficulty: difficulty || level,
      questions,
      codeChallenge,
      score,
      passed,
      timeSpent: timeSpent || 0,
      antiCheat: {
        pasteCount,
        tabSwitches,
        suspicious: isSuspicious,
        flags: antiCheat?.flags || [],
      },
    });

    // ── Issue credential if passed ──
    let credential = null;
    if (passed) {
      credential = await Credential.create({
        userId: decoded.id,
        userName: decoded.name,
        userUsername: decoded.username,
        skill,
        level,
        score,
        assessmentId: assessment._id,
        isClean: !isSuspicious,
      });

      assessment.credentialIssued = true;
      assessment.credentialId = credential.credentialId;
      await assessment.save();

      // ── Update skill level in User ──
      const user = await User.findById(decoded.id);
      const existingSkill = user.skills.find(
        s => s.name.toLowerCase() === skill.toLowerCase()
      );
      if (existingSkill) {
        existingSkill.level = level;
        existingSkill.verified = true;
      } else {
        user.skills.push({ name: skill, level, verified: true });
      }
      user.xp += Math.floor(score / 10) * 5;
      await user.save();
    }

    return NextResponse.json({
      score,
      passed,
      level,
      feedback: aiFeedback,
      suspicious: isSuspicious,
      credential: credential ? {
        id: credential.credentialId,
        skill: credential.skill,
        level: credential.level,
        verifyUrl: credential.verifyUrl,
        score: credential.score,
      } : null,
      message: passed
        ? `🎉 You passed! ${level} credential issued for ${skill}!`
        : `Score: ${score}/100. You need 40+ to pass. Keep practicing!`,
    });

  } catch (err) {
    console.error("Assessment POST error:", err.message);
    return NextResponse.json(
      { error: "Assessment failed: " + err.message },
      { status: 500 }
    );
  }
}