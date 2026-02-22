"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CodeChallenge() {
  const router = useRouter();
  
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800);
  const [skill, setSkill] = useState("JavaScript");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [sessionId, setSessionId] = useState(null);

  // ✅ FIX: Load from sessionStorage (not localStorage)
  useEffect(() => {
    console.log("Code challenge page loading...");
    const stored = sessionStorage.getItem("currentAssessment");
    console.log("Stored assessment:", stored);
    
    if (!stored) {
      setError("No assessment data found");
      setLoading(false);
      return;
    }

    try {
      const data = JSON.parse(stored);
      console.log("Parsed data:", data);
      
      if (!data.challenge) {
        setError("No challenge data found");
        setLoading(false);
        return;
      }

      setChallenge(data.challenge);
      setSkill(data.skill);
      setDifficulty(data.difficulty);
      setSessionId(data.sessionId); // ✅ NEW: Store sessionId
      setLoading(false);
    } catch (err) {
      console.error("Parse error:", err);
      setError("Failed to load challenge: " + err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, loading]);

  // ✅ FIX: Improved code submission with sessionId
  const handleSubmit = async () => {
    if (!code.trim()) {
      alert("Please write some code before submitting");
      return;
    }

    if (!sessionId) {
      alert("Error: Assessment session not found");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill,
          difficulty,
          type: "code",
          answers: [code],
          antiCheat: { pasteCount: 0, tabSwitches: 0, flags: [] },
          timeSpent: 1800 - timeLeft,
          sessionId,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert("Error: " + (result.error || "Submission failed"));
        setSubmitting(false);
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

      try {
        const jsonString = JSON.stringify(resultsToSave);
        console.log("✅ JSON stringified successfully");
        
        sessionStorage.setItem("assessmentResults", jsonString);
        console.log("✅ Saved to sessionStorage successfully");
        console.log("✅ Verification:", sessionStorage.getItem("assessmentResults"));
      } catch (storageError) {
        console.error("❌ Storage error:", storageError);
        alert("Error saving results: " + storageError.message);
        setSubmitting(false);
        return;
      }

      sessionStorage.removeItem("currentAssessment");

      setTimeout(() => {
        console.log("Navigating to results...");
        router.push(`/assessments/results/${skill}`);
      }, 500);
    } catch (err) {
      console.error("❌ Submit error:", err);
      alert("Error: " + err.message);
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex items-center justify-center p-6">
        <div className="bg-red-900 border border-red-600 rounded-xl p-8 max-w-md">
          <p className="text-red-200 text-center"><strong>Error</strong></p>
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

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex items-center justify-center p-6">
        <div className="bg-red-900 border border-red-600 rounded-xl p-8 max-w-md">
          <p className="text-red-200 text-center"><strong>No Challenge</strong></p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{challenge.title}</h1>
            <p className="text-gray-400">{skill} • {difficulty}</p>
          </div>
          <div className="text-right bg-gray-800 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-xs">Time Remaining</p>
            <p className="text-3xl font-bold text-white">{formatTime(timeLeft)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8">
            <h2 className="text-xl font-bold text-white mb-4">Problem</h2>
            <p className="text-gray-300 mb-6">{challenge.description}</p>
            
            <h3 className="text-lg font-bold text-white mb-2">Examples</h3>
            <pre className="bg-gray-800 p-4 rounded-lg text-gray-300 text-sm mb-6 overflow-auto max-h-40">
              {challenge.examples}
            </pre>

            <h3 className="text-lg font-bold text-white mb-2">Constraints</h3>
            <p className="text-gray-300">{challenge.constraints}</p>
          </div>

          <div className="flex flex-col">
            <label className="text-white font-bold mb-2">Your Solution</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl p-4 text-gray-100 font-mono text-sm resize-none"
              placeholder="Write your code here..."
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push("/assessments")}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !code.trim()}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition"
          >
            {submitting ? "Submitting..." : "Submit Solution"}
          </button>
        </div>
      </div>
    </div>
  );
}