"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AssessmentsPage() {
  const router = useRouter();
  const [selectedSkill, setSelectedSkill] = useState("JavaScript");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Beginner");
  const [selectedType, setSelectedType] = useState("mcq");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const skills = ["JavaScript", "Python", "React", "TypeScript", "Node.js", "Java", "C++", "Go", "SQL", "CSS"];
  const difficulties = ["Beginner", "Intermediate", "Advanced", "Expert"];

  const handleStartAssessment = async () => {
  if (!selectedSkill) {
    setError("Please select a skill");
    return;
  }

  setLoading(true);
  setError("");

  try {
    const url = `/api/assessment?skill=${encodeURIComponent(selectedSkill)}&difficulty=${encodeURIComponent(selectedDifficulty)}&type=${selectedType}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to load assessment");
      setLoading(false);
      return;
    }

    // For CODE challenges
    if (selectedType === "code") {
      if (!data.challenge || !data.sessionId) {
        setError("Failed to load code challenge");
        setLoading(false);
        return;
      }

      // ✅ FIX: Use sessionStorage instead of localStorage
      sessionStorage.setItem(
        "currentAssessment",
        JSON.stringify({
          skill: selectedSkill,
          difficulty: selectedDifficulty,
          type: selectedType,
          challenge: data.challenge,
          sessionId: data.sessionId, // ✅ NEW: Store sessionId
          startTime: Date.now(),
        })
      );

      router.push(`/assessments/take/code?skill=${selectedSkill}&difficulty=${selectedDifficulty}`);
      return;
    }

    // For MCQ questions
    if (!data.questions || data.questions.length === 0 || !data.sessionId) {
      setError("No questions generated");
      setLoading(false);
      return;
    }

    // ✅ FIX: Use sessionStorage instead of localStorage
    sessionStorage.setItem(
      "currentAssessment",
      JSON.stringify({
        skill: selectedSkill,
        difficulty: selectedDifficulty,
        type: selectedType,
        questions: data.questions,
        sessionId: data.sessionId, // ✅ NEW: Store sessionId
        startTime: Date.now(),
      })
    );

    router.push(`/assessments/take/${selectedSkill}`);
  } catch (err) {
    setError("Error: " + err.message);
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">📝 Skill Assessments</h1>
          <p className="text-gray-400">Test your knowledge and earn verified credentials</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { num: "1", title: "Select Skill", desc: "Choose what to test" },
              { num: "2", title: "Take Test", desc: "MCQ or Code Challenge" },
              { num: "3", title: "Get Scored", desc: "Instant feedback" },
              { num: "4", title: "Earn Credential", desc: "Score ≥40 = Certificate" },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="bg-violet-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold mx-auto mb-2">{step.num}</div>
                <p className="font-semibold text-white mb-1">{step.title}</p>
                <p className="text-sm text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-8">Configure Your Assessment</h2>

          {error && <div className="bg-red-900 border border-red-600 text-red-200 p-4 rounded-lg mb-6">❌ {error}</div>}

          <div className="mb-8">
            <label className="block text-white font-semibold mb-4">1. Select Skill</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {skills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => setSelectedSkill(skill)}
                  className={`py-3 px-4 rounded-lg font-medium transition ${selectedSkill === skill ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-white font-semibold mb-4">2. Select Difficulty</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className={`py-3 px-4 rounded-lg font-medium transition ${selectedDifficulty === difficulty ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-white font-semibold mb-4">3. Select Assessment Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedType("mcq")}
                className={`p-6 rounded-lg border-2 transition ${selectedType === "mcq" ? "border-violet-600 bg-violet-600 bg-opacity-10" : "border-gray-700 bg-gray-800 hover:border-gray-600"}`}
              >
                <p className="text-2xl mb-2">📋</p>
                <p className="font-semibold text-white mb-2">Multiple Choice</p>
                <p className="text-sm text-gray-400">5 questions • 20 points each</p>
              </button>
              <button
                onClick={() => setSelectedType("code")}
                className={`p-6 rounded-lg border-2 transition ${selectedType === "code" ? "border-violet-600 bg-violet-600 bg-opacity-10" : "border-gray-700 bg-gray-800 hover:border-gray-600"}`}
              >
                <p className="text-2xl mb-2">💻</p>
                <p className="font-semibold text-white mb-2">Code Challenge</p>
                <p className="text-sm text-gray-400">1 problem • 100 points</p>
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <p className="text-gray-400 text-sm mb-2">You are about to take:</p>
            <p className="text-xl font-bold text-white">{selectedSkill} • {selectedDifficulty} {selectedType === "mcq" ? "MCQ Assessment" : "Code Challenge"}</p>
          </div>

          <button
            onClick={handleStartAssessment}
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-4 rounded-lg transition disabled:opacity-50 text-lg"
          >
            {loading ? "Preparing Assessment..." : "Start Assessment"}
          </button>
        </div>

        <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-xl p-6">
          <p className="text-blue-200">💡 <strong>Tips:</strong> Have 20-30 minutes available. Keep focus. Avoid tab switching (it affects your score). Good luck!</p>
        </div>
      </div>
    </div>
  );
}