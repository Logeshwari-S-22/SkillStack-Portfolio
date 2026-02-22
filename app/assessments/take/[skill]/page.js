"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

export default function TakeAssessment() {
  const router = useRouter();
  const params = useParams();
  const skill = params.skill;

  const [assessment, setAssessment] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [antiCheat, setAntiCheat] = useState({ pasteCount: 0, tabSwitches: 0, flags: [] });
  const [isVisible, setIsVisible] = useState(true);

  // ✅ FIX: Load from sessionStorage (not localStorage)
  useEffect(() => {
    const stored = sessionStorage.getItem("currentAssessment");
    
    if (!stored) {
      setError("No assessment data found.");
      setLoading(false);
      setTimeout(() => router.push("/assessments"), 2000);
      return;
    }

    try {
      const assessmentData = JSON.parse(stored);
      
      // Redirect code challenges to dedicated page
      if (assessmentData.type === "code") {
        router.push(
          `/assessments/take/code?skill=${assessmentData.skill}&difficulty=${assessmentData.difficulty}`
        );
        return;
      }
      
      // Load MCQ assessment
      setAssessment(assessmentData);
      const initialAnswers = {};
      assessmentData.questions.forEach((_, idx) => {
        initialAnswers[idx] = "";
      });
      setAnswers(initialAnswers);
      setLoading(false);
    } catch (err) {
      console.error("Parse error:", err);
      setError("Failed to load assessment: " + err.message);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!loading && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (timeLeft === 0 && !loading && assessment) {
      handleSubmit();
    }
  }, [timeLeft, loading, assessment]);

  useEffect(() => {
    const handlePaste = (e) => {
      e.preventDefault();
      setAntiCheat((prev) => ({
        ...prev,
        pasteCount: prev.pasteCount + 1,
        flags: [...prev.flags, "paste-detected"],
      }));
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsVisible(false);
        setAntiCheat((prev) => ({
          ...prev,
          tabSwitches: prev.tabSwitches + 1,
          flags: [...prev.flags, "tab-switch-detected"],
        }));
      } else {
        setIsVisible(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleAnswerChange = (questionIdx, answer) => {
    setAnswers({ ...answers, [questionIdx]: answer });
  };

  // ✅ FIX: Only send user's answers (not correctAnswer), include sessionId
  const handleSubmit = useCallback(async () => {
    if (!assessment) {
      setError("Assessment data missing");
      return;
    }

    setLoading(true);

    try {
      const userAnswersArray = assessment.questions.map((_, idx) => answers[idx] || "");
      const timeSpent = 1800 - timeLeft;

      const res = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: assessment.skill,
          difficulty: assessment.difficulty,
          type: assessment.type,
          answers: userAnswersArray,
          antiCheat,
          timeSpent,
          sessionId: assessment.sessionId,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert("Error: " + (result.error || "Submission failed"));
        setLoading(false);
        return;
      }

      // ✅ IMPROVED: Add error handling and wait longer
      const resultsToSave = {
        score: result.score,
        level: result.level,
        passed: result.passed,
        message: result.message,
        credential: result.credential || null,
        suspicious: result.suspicious || false,
      };

      console.log("✅ About to save:", resultsToSave);

      // ✅ Try to save with error handling
      try {
        const jsonString = JSON.stringify(resultsToSave);
        console.log("✅ JSON stringified successfully");
        
        sessionStorage.setItem("assessmentResults", jsonString);
        console.log("✅ Saved to sessionStorage successfully");
        console.log("✅ Verification:", sessionStorage.getItem("assessmentResults"));
      } catch (storageError) {
        console.error("❌ Storage error:", storageError);
        alert("Error saving results: " + storageError.message);
        setLoading(false);
        return;
      }

      sessionStorage.removeItem("currentAssessment");

      // ✅ Wait 500ms instead of 100ms
      setTimeout(() => {
        console.log("Navigating to results...");
        router.push(`/assessments/results/${skill}`);
      }, 500);
    } catch (err) {
      console.error("❌ Submit error:", err);
      alert("Error: " + err.message);
      setLoading(false);
    }
  }, [assessment, answers, antiCheat, timeLeft, router, skill]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex items-center justify-center p-6">
        <div className="bg-red-900 border border-red-600 rounded-xl p-8 max-w-md">
          <p className="text-red-200 text-center"><strong>❌ Error</strong></p>
          <p className="text-red-300 text-center mt-4">{error}</p>
          <button
            onClick={() => router.push("/assessments")}
            className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  if (!assessment || !assessment.questions || assessment.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex items-center justify-center p-6">
        <div className="bg-red-900 border border-red-600 rounded-xl p-8 max-w-md">
          <p className="text-red-200 text-center"><strong>No Questions Loaded</strong></p>
          <button
            onClick={() => router.push("/assessments")}
            className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  const question = assessment.questions[currentQuestion];
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  const isTimeWarning = timeLeft < 300;
  const allAnswered = Object.values(answers).every((a) => a !== "");

  return (
    <div className={`min-h-screen ${!isVisible ? "opacity-50" : ""}`}>
      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          {antiCheat.tabSwitches > 0 && (
            <div className="bg-yellow-900 border border-yellow-600 text-yellow-200 p-4 rounded-lg mb-6 text-sm">
              ⚠️ Tab switching detected ({antiCheat.tabSwitches}). This may affect your score.
            </div>
          )}

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">{assessment.skill}</h1>
              <p className="text-gray-400 text-sm">{assessment.type === "mcq" ? "Multiple Choice" : "Code Challenge"} • {assessment.difficulty}</p>
            </div>
            <div className={`text-center p-4 rounded-lg ${isTimeWarning ? "bg-red-900 border border-red-600" : "bg-gray-800 border border-gray-700"}`}>
              <p className="text-gray-400 text-xs">Time Remaining</p>
              <p className={`text-3xl font-bold ${isTimeWarning ? "text-red-400" : "text-white"}`}>{formatTime(timeLeft)}</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <p className="text-gray-400 text-sm">Question {currentQuestion + 1} of {assessment.questions.length}</p>
              <p className="text-gray-400 text-sm">{Object.values(answers).filter((a) => a !== "").length} answered</p>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div className="bg-violet-600 h-2 rounded-full transition-all" style={{ width: `${((currentQuestion + 1) / assessment.questions.length) * 100}%` }} />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">{question.question}</h2>
            <div className="space-y-3">
              {question.options && question.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerChange(currentQuestion, option)}
                  className={`w-full p-4 rounded-lg text-left border-2 transition ${answers[currentQuestion] === option ? "border-violet-600 bg-violet-600 bg-opacity-10 text-white" : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"}`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${answers[currentQuestion] === option ? "border-violet-600 bg-violet-600" : "border-gray-600"}`}>
                      {answers[currentQuestion] === option && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    {option}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition"
            >
              ← Previous
            </button>
            {currentQuestion === assessment.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition"
              >
                Submit Assessment ✓
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-semibold transition"
              >
                Next →
              </button>
            )}
          </div>

          <div className="mt-8">
            <p className="text-gray-400 text-sm mb-3">Jump to question:</p>
            <div className="grid grid-cols-10 gap-2">
              {assessment.questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`aspect-square rounded-lg font-semibold transition ${currentQuestion === idx ? "bg-violet-600 text-white" : answers[idx] !== "" ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}