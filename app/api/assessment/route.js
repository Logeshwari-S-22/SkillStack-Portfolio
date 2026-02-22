import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jwtVerify } from "jose";
import { askGemini } from "@/lib/gemini";
import User from "@/models/User";
import Credential from "@/models/Credential";
import Assessment from "@/models/Assessment";
import AssessmentSession from "@/models/AssessmentSession"; // NEW MODEL NEEDED

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "skillstacktn_super_secret_key_2024"
);

// ============================================
// POST - Submit assessment (CORRECTED)
// ============================================
export async function POST(req) {
  try {
    console.log("=== POST /api/assessment ===");
    
    // Get auth token
    const cookies = req.headers.get('cookie') || '';
    console.log("Cookies received:", cookies);
    
    const tokenMatch = cookies.match(/auth-token=([^;]*)/);
    const token = tokenMatch ? tokenMatch[1] : null;
    
    console.log("Extracted token:", token ? "Found" : "Not found");

    let userId = null;

    if (token) {
      try {
        const verified = await jwtVerify(token, SECRET);
        userId = verified.payload.userId;
        console.log("✅ User ID from token:", userId);
      } catch (tokenErr) {
        console.warn("⚠️ Token verification failed:", tokenErr.message);
      }
    } else {
      console.warn("⚠️ No token found in cookies");
    }

    const body = await req.json();
    const { skill, difficulty, type, answers, antiCheat, timeSpent, sessionId } = body;

    console.log("Assessment POST data:", {
      skill,
      difficulty,
      type,
      userId,
      sessionId, // ✅ NEW: Session ID to retrieve original questions
      answersCount: answers?.length,
      timeSpent,
    });

    // Validate
    if (!skill || !difficulty || !type || !answers || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields: skill, difficulty, type, answers, sessionId" },
        { status: 400 }
      );
    }

    await connectDB();

    // ✅ CRITICAL FIX: Retrieve original questions from database using sessionId
    const assessmentSession = await AssessmentSession.findById(sessionId);
    
    if (!assessmentSession) {
      console.error("❌ Assessment session not found:", sessionId);
      return NextResponse.json(
        { error: "Invalid or expired assessment session" },
        { status: 400 }
      );
    }

    if (assessmentSession.expiresAt < new Date()) {
      console.error("❌ Assessment session expired");
      return NextResponse.json(
        { error: "Assessment session expired" },
        { status: 400 }
      );
    }

    const originalQuestions = assessmentSession.questions;
    console.log("✅ Retrieved original questions from session");

    // Calculate score
    let correct = 0;
    let totalQuestions = 0;

    if (type === "mcq" && Array.isArray(answers)) {
      totalQuestions = answers.length;
      
      // ✅ CRITICAL FIX: Validate answers against SERVER-SIDE questions
      answers.forEach((userAnswer, idx) => {
        if (idx >= originalQuestions.length) {
          console.warn(`⚠️ Extra answer at index ${idx}`);
          return;
        }

        const originalQuestion = originalQuestions[idx];
        const serverCorrectAnswer = originalQuestion.correctAnswer.trim();
        const userSubmittedAnswer = userAnswer.trim();

        const isCorrect = userSubmittedAnswer === serverCorrectAnswer;
        
        console.log(`Question ${idx + 1}: "${originalQuestion.question.substring(0, 50)}..."`);
        console.log(`  Expected: "${serverCorrectAnswer}"`);
        console.log(`  Got: "${userSubmittedAnswer}"`);
        console.log(`  Result: ${isCorrect ? "✅ Correct" : "❌ Wrong"}`);
        
        if (isCorrect) correct++;
      });
     } else if (type === "code") {
      try {
        const { validateCode } = await import("@/lib/codeExecutor");
        
        const userCode = answers[0];
        const testCases = assessmentSession.testCases || [];
        
        console.log(`\n🔬 Testing code against ${testCases.length} test cases...`);
        
        if (testCases.length === 0) {
          console.warn("⚠️ No test cases found");
          correct = 0;
          totalQuestions = 1;
        } else {
          const validationResult = await validateCode(userCode, testCases);
          correct = validationResult.passed;
          totalQuestions = validationResult.total;
          
          console.log(`\n✅ Code Validation Results:`);
          console.log(`   Passed: ${validationResult.passed}/${validationResult.total}`);
        }
      } catch (codeError) {
        console.error("❌ Code validation error:", codeError.message);
        correct = 0;
        totalQuestions = 1;
      }
    }else {
      return NextResponse.json(
        { error: "Invalid assessment type" },
        { status: 400 }
      );
    }

    let score = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    console.log(`Score: ${correct}/${totalQuestions} = ${score}%`);

    // Apply anti-cheat penalty
    let suspicious = false;
    if (antiCheat && (antiCheat.pasteCount > 2 || antiCheat.tabSwitches > 3)) {
      const originalScore = score;
      score = Math.round(score * 0.7); // 30% penalty
      suspicious = true;
      console.log(`Anti-cheat penalty applied: ${originalScore}% → ${score}%`);
    }

    // Determine level
    let level = "Beginner";
    if (score >= 86) level = "Expert";
    else if (score >= 66) level = "Advanced";
    else if (score >= 41) level = "Intermediate";

    const passed = score >= 40;
    console.log(`Level: ${level}, Passed: ${passed}`);

    // Create credential if passed
    let credential = null;
    if (passed && userId) {
      const credentialId = `CRED-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      credential = await Credential.create({
        userId,
        credentialId,
        skill,
        level,
        score,
        assessmentType: type,
        difficulty,
        status: "active",
        verifyUrl: `/credentials/verify/${credentialId}`,
      });

      console.log("✅ Credential created:", credentialId);

      // Update user
      const user = await User.findById(userId);
      if (user) {
        user.xp = (user.xp || 0) + (passed ? 100 : 50);
        user.credentials = user.credentials || [];
        user.credentials.push(credential._id);

        const skillExists = user.skills?.some((s) => s.name === skill);
        if (!skillExists) {
          user.skills = user.skills || [];
          user.skills.push({
            name: skill,
            proficiency: level,
            endorsements: 0,
          });
        }

        await user.save();
        console.log("✅ User updated with XP and credential");
      }
    }

    // Save assessment record
    if (userId) {
      try {
        await Assessment.create({
          userId,
          skill,
          difficulty,
          type,
          score,
          passed,
          timeSpent,
          antiCheatFlags: antiCheat?.flags || [],
        });
        console.log("✅ Assessment record saved");
      } catch (assessmentErr) {
        console.warn("⚠️ Failed to save assessment record:", assessmentErr.message);
      }
    }

    // Clean up session
    await AssessmentSession.findByIdAndDelete(sessionId);
    console.log("✅ Assessment session cleaned up");

    const responseData = {
      score,
      level,
      passed,
      message: passed
        ? `Congratulations! You passed with ${score}% score.`
        : `Score: ${score}%. You need 40% to pass. Try again!`,
      suspicious,
      credential: credential
        ? {
            id: credential.credentialId,
            skill: credential.skill,
            level: credential.level,
            score: credential.score,
          }
        : null,
    };

    console.log("✅ Sending response:", responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("❌ Assessment POST error:", error);
    return NextResponse.json(
      { error: "Failed to submit assessment: " + error.message },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Generate questions (CORRECTED)
// ============================================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const skill = searchParams.get("skill");
    const difficulty = searchParams.get("difficulty");
    const type = searchParams.get("type");

    console.log("Assessment GET:", { skill, difficulty, type });

    if (!skill || !difficulty || !type) {
      return NextResponse.json(
        { error: "skill, difficulty, and type are required" },
        { status: 400 }
      );
    }

    await connectDB();

    let questionData = null;

    if (type === "mcq") {
      // ✅ IMPROVED: Better prompt for quality questions
      const prompt = `Generate 5 high-quality multiple choice questions about ${skill} at ${difficulty} level.

IMPORTANT REQUIREMENTS:
- Each question should be specific and test real knowledge
- Options must be plausible but only ONE is correct
- Correct answer must be clearly distinguishable
- No generic or ambiguous questions

Return ONLY valid JSON (no markdown, no backticks, no explanation):
{
  "questions": [
    {
      "question": "Specific question about the topic?",
      "options": ["first option", "second option", "third option", "fourth option"],
      "correctAnswer": "exact option text from options array"
    }
  ]
}`;

      console.log("Calling Gemini for MCQ...");
      try {
        const result = await askGemini(prompt, true);

        // ✅ IMPROVED: Better validation of response
        if (result && result.questions && Array.isArray(result.questions) && result.questions.length > 0) {
          // Validate each question
          const validQuestions = result.questions.filter(q => {
            const hasQuestion = q.question && q.question.trim().length > 0;
            const hasOptions = Array.isArray(q.options) && q.options.length === 4;
            const hasCorrectAnswer = q.correctAnswer && q.correctAnswer.trim().length > 0;
            const correctAnswerInOptions = hasOptions && q.options.some(opt => opt === q.correctAnswer);
            
            if (!correctAnswerInOptions) {
              console.warn(`⚠️ Question skipped: correct answer not in options`);
              return false;
            }
            
            return hasQuestion && hasOptions && hasCorrectAnswer;
          });

          if (validQuestions.length >= 5) {
            questionData = { questions: validQuestions.slice(0, 5) };
            console.log("✅ Got", questionData.questions.length, "valid questions from Gemini");
          } else {
            throw new Error(`Only ${validQuestions.length} valid questions generated`);
          }
        } else {
          throw new Error("Invalid response format from Gemini");
        }
      } catch (geminiErr) {
        console.warn("⚠️ Gemini generation failed:", geminiErr.message);
        
        // ✅ IMPROVED: Better fallback questions with actual content
        questionData = {
          questions: generateFallbackMCQQuestions(skill, difficulty)
        };
        console.log("✅ Using fallback questions");
      }

      // ✅ NEW: Create assessment session and store questions SERVER-SIDE
      const sessionExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min expiry
      
      const assessmentSession = await AssessmentSession.create({
        skill,
        difficulty,
        type,
        questions: questionData.questions,
        expiresAt: sessionExpiresAt,
      });

      console.log("✅ Assessment session created:", assessmentSession._id);

      // ✅ CRITICAL: Send questions WITHOUT correctAnswer to frontend
      const questionsForFrontend = questionData.questions.map(q => ({
        question: q.question,
        options: q.options,
        // ❌ DO NOT INCLUDE: correctAnswer
      }));

      return NextResponse.json({
        questions: questionsForFrontend,
        sessionId: assessmentSession._id, // ✅ NEW: Session ID for server-side lookup
        type: "mcq",
        skill,
        difficulty,
      });

    } else if (type === "code") {
      // ✅ IMPROVED: Better code challenge generation
      const prompt = `Generate a ${difficulty} level coding challenge in ${skill}.

IMPORTANT REQUIREMENTS:
- Clear problem statement
- Specific input/output examples
- Clear constraints
- Reasonable difficulty for ${difficulty} level

Return ONLY valid JSON (no markdown, no backticks, no explanation):
{
  "challenge": {
    "title": "Descriptive challenge name",
    "description": "Detailed problem description",
    "examples": "Input/Output examples in format:\\nInput: ...\\nOutput: ...",
    "constraints": "List constraints and limitations"
  },
  "testCases": [
    {"input": "...", "expectedOutput": "..."},
    {"input": "...", "expectedOutput": "..."}
  ]
}`;

      console.log("Calling Gemini for code challenge...");
      try {
        const result = await askGemini(prompt, true);

        if (result && result.challenge && result.testCases && Array.isArray(result.testCases)) {
          console.log("✅ Got code challenge:", result.challenge.title);
          
          // ✅ NEW: Store challenge with test cases in session
          const sessionExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
          
          const assessmentSession = await AssessmentSession.create({
            skill,
            difficulty,
            type,
            challenge: result.challenge,
            testCases: result.testCases,
            expiresAt: sessionExpiresAt,
          });

          console.log("✅ Code challenge session created:", assessmentSession._id);

          return NextResponse.json({
            challenge: result.challenge,
            sessionId: assessmentSession._id, // ✅ NEW
            type: "code",
            skill,
            difficulty,
          });
        } else {
          throw new Error("Invalid response format");
        }
      } catch (geminiErr) {
        console.warn("⚠️ Gemini generation failed:", geminiErr.message);
        
        // ✅ IMPROVED: Better fallback challenge
        const fallbackChallenge = {
          title: `${skill} - ${difficulty} Challenge`,
          description: `Write a ${skill} program to solve a ${difficulty.toLowerCase()} level problem.`,
          examples: "Example:\nInput: sample input\nOutput: expected output",
          constraints: "Time Limit: 1 second\nMemory Limit: 256MB",
        };

        const sessionExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
        
        const assessmentSession = await AssessmentSession.create({
          skill,
          difficulty,
          type,
          challenge: fallbackChallenge,
          testCases: [],
          expiresAt: sessionExpiresAt,
        });

        return NextResponse.json({
          challenge: fallbackChallenge,
          sessionId: assessmentSession._id,
          type: "code",
          skill,
          difficulty,
        });
      }
    }

    return NextResponse.json(
      { error: "Invalid type: must be 'mcq' or 'code'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("❌ Assessment GET error:", error);
    return NextResponse.json(
      { error: "Failed to generate assessment: " + error.message },
      { status: 500 }
    );
  }
}

// ✅ NEW: Helper function for fallback MCQ questions
function generateFallbackMCQQuestions(skill, difficulty) {
  const questionTemplates = {
    JavaScript: {
      Beginner: [
        {
          question: "What is the purpose of the 'var' keyword in JavaScript?",
          options: [
            "To declare a variable",
            "To create a loop",
            "To define a function",
            "To import a module"
          ],
          correctAnswer: "To declare a variable"
        },
        {
          question: "Which method is used to add an element to the end of an array?",
          options: [
            "push()",
            "pop()",
            "shift()",
            "unshift()"
          ],
          correctAnswer: "push()"
        },
        {
          question: "What will 'typeof null' return in JavaScript?",
          options: [
            "null",
            "undefined",
            "object",
            "string"
          ],
          correctAnswer: "object"
        },
        {
          question: "Which of these is NOT a JavaScript data type?",
          options: [
            "String",
            "Number",
            "Boolean",
            "Character"
          ],
          correctAnswer: "Character"
        },
        {
          question: "What does 'const' keyword do?",
          options: [
            "Declares a mutable variable",
            "Declares an immutable variable",
            "Declares a function",
            "Declares a class"
          ],
          correctAnswer: "Declares an immutable variable"
        }
      ],
      Intermediate: [
        {
          question: "What is the difference between '==' and '===' in JavaScript?",
          options: [
            "'===' checks type equality as well",
            "'==' is faster",
            "No difference",
            "'==' checks type equality"
          ],
          correctAnswer: "'===' checks type equality as well"
        },
        {
          question: "How can you check if a value exists in an object?",
          options: [
            "using 'in' operator",
            "using 'has' method",
            "using 'contains' method",
            "using 'find' method"
          ],
          correctAnswer: "using 'in' operator"
        },
        {
          question: "What is closure in JavaScript?",
          options: [
            "A function that returns another function",
            "A function that has access to outer function's variables",
            "A loop termination",
            "An error handling mechanism"
          ],
          correctAnswer: "A function that has access to outer function's variables"
        },
        {
          question: "What is the purpose of 'this' keyword?",
          options: [
            "To refer to the current object",
            "To create a new variable",
            "To define a constant",
            "To import a module"
          ],
          correctAnswer: "To refer to the current object"
        },
        {
          question: "How do you handle asynchronous operations in JavaScript?",
          options: [
            "Using callbacks, promises, or async/await",
            "Using only loops",
            "Using if-else statements",
            "Using switch statements"
          ],
          correctAnswer: "Using callbacks, promises, or async/await"
        }
      ]
    },
    Python: {
      Beginner: [
        {
          question: "What is the correct syntax to create a function in Python?",
          options: [
            "def function_name():",
            "function function_name():",
            "define function_name():",
            "func function_name():"
          ],
          correctAnswer: "def function_name():"
        },
        {
          question: "Which data type is used to store multiple values in Python?",
          options: [
            "List",
            "String",
            "Integer",
            "Float"
          ],
          correctAnswer: "List"
        },
        {
          question: "What is the output of print(2 ** 3) in Python?",
          options: [
            "8",
            "6",
            "5",
            "9"
          ],
          correctAnswer: "8"
        },
        {
          question: "How do you create an empty list in Python?",
          options: [
            "[]",
            "{}",
            "()",
            "list()"
          ],
          correctAnswer: "[]"
        },
        {
          question: "Which keyword is used to create a class in Python?",
          options: [
            "class",
            "define",
            "object",
            "struct"
          ],
          correctAnswer: "class"
        }
      ]
    }
  };

  // Try to get skill-specific questions
  if (questionTemplates[skill] && questionTemplates[skill][difficulty]) {
    return questionTemplates[skill][difficulty];
  }

  // Generic fallback if skill not found
  return [
    {
      question: `What is ${skill}?`,
      options: [
        "A programming language",
        "A development framework",
        "A design pattern",
        "A testing tool"
      ],
      correctAnswer: "A programming language"
    },
    {
      question: `How do you get started with ${skill}?`,
      options: [
        "Install the necessary tools",
        "Read documentation",
        "Create a project",
        "All of the above"
      ],
      correctAnswer: "All of the above"
    },
    {
      question: `What is a key feature of ${skill}?`,
      options: [
        "Easy to learn",
        "Fast execution",
        "Large community",
        "All of the above"
      ],
      correctAnswer: "All of the above"
    },
    {
      question: `Where is ${skill} commonly used?`,
      options: [
        "Web development",
        "Mobile development",
        "Data science",
        "All of the above"
      ],
      correctAnswer: "All of the above"
    },
    {
      question: `Which of these is important when learning ${skill}?`,
      options: [
        "Understanding syntax",
        "Practicing coding",
        "Reading error messages",
        "All of the above"
      ],
      correctAnswer: "All of the above"
    }
  ];
}