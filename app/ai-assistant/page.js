"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AIAssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [careerPlan, setCareerPlan] = useState(null);
  const [showCareerAnalysis, setShowCareerAnalysis] = useState(false);
  const [targetRole, setTargetRole] = useState("");
  const [analyzingCareer, setAnalyzingCareer] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) return;
      const data = await res.json();
      setProfile(data);

      // Add initial greeting
      const greeting = `👋 Hi ${data.name}! I'm your AI Career Coach.

Based on your profile:
📚 Education: ${data.education?.length || 0}
💼 Experience: ${data.experience?.length || 0}
🎯 Skills: ${data.skills?.length || 0}
📊 Assessments: ${data.totalAssessmentsTaken || 0}

I can help you with:
✨ Career path analysis
📈 Skill gap identification  
🎓 Personalized learning plans
💡 Technical questions & guidance
🚀 Interview preparation

What would you like to explore?`;

      setMessages([{ role: "ai", content: greeting }]);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleCareerAnalysis = async () => {
    if (!targetRole.trim()) {
      alert("Please enter a target role");
      return;
    }

    setAnalyzingCareer(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: `Analyze my fit for: ${targetRole}` },
    ]);

    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: "Error analyzing career: " + data.error },
        ]);
        return;
      }

      setCareerPlan(data.plan);

      const analysisMessage = `📊 **Career Analysis for ${targetRole}**

**Overall Assessment:**
${data.plan.overallMessage}

**Your Strengths:**
${data.plan.strengths.map((s) => `✅ ${s}`).join("\n")}

**Areas to Improve:**
${data.plan.weaknesses.map((w) => `⚠️ ${w}`).join("\n")}

**Skills Analysis:**
${data.plan.skillsGap
  .filter((s) => s.status === "missing")
  .slice(0, 3)
  .map((s) => `🎯 Learn ${s.skill} (Priority ${s.priority})`)
  .join("\n")}

**Career Match Scores:**
${data.plan.careerMatch
  .map((c) => `${c.role}: ${c.matchPercent}%`)
  .join("\n")}

I've created a personalized weekly learning plan for you! Click "View Learning Plan" to see the details.`;

      setMessages((prev) => [...prev, { role: "ai", content: analysisMessage }]);
      setShowCareerAnalysis(false);
      setTargetRole("");
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Error: " + err.message },
      ]);
    } finally {
      setAnalyzingCareer(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          profile: profile,
          careerPlan: careerPlan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: "Sorry, I had an error. Please try again." },
        ]);
        return;
      }

      setMessages((prev) => [...prev, { role: "ai", content: data.response }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Error: " + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-700 p-6">
          <h1 className="text-3xl font-bold text-white mb-2">🤖 AI Career Coach</h1>
          <p className="text-gray-400">Your personalized guide to career growth</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-2xl rounded-xl p-4 ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-br-none"
                    : "bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Career Analysis Modal */}
        {showCareerAnalysis && (
          <div className="bg-gray-900 border-t border-gray-700 p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">What role are you targeting?</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCareerAnalysis()}
                placeholder="e.g., Senior Frontend Developer, Full Stack Engineer..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
              <button
                onClick={handleCareerAnalysis}
                disabled={analyzingCareer || !targetRole.trim()}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                Analyze
              </button>
              <button
                onClick={() => setShowCareerAnalysis(false)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-gray-900 border-t border-gray-700 p-6">
          <div className="space-y-3 mb-4">
            {!showCareerAnalysis && (
              <button
                onClick={() => setShowCareerAnalysis(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition"
              >
                📊 Analyze My Career Path
              </button>
            )}
            {careerPlan && (
              <button
                onClick={() => router.push("/learning-plan")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
              >
                📚 View My Learning Plan
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask me anything about your career or skills..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 transition"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-gray-900 border-l border-gray-700 p-6 overflow-y-auto hidden lg:block">
        <h2 className="text-xl font-bold text-white mb-4">📈 Quick Actions</h2>

        <div className="space-y-3">
          <button
            onClick={() => router.push("/profile")}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition text-left px-4"
          >
            👤 Update Profile
          </button>

          <button
            onClick={() => router.push("/assessments")}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition text-left px-4"
          >
            📝 Take Assessment
          </button>

          <button
            onClick={() => setShowCareerAnalysis(true)}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-semibold transition text-left px-4"
          >
            📊 Analyze Career
          </button>
        </div>

        {careerPlan && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase">Your Plan</h3>
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <p className="text-sm text-gray-300 mb-2">Target Role:</p>
              <p className="text-white font-bold">{careerPlan.targetRole}</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Skills to Learn:</p>
              <div className="space-y-1">
                {careerPlan.skillsGap
                  .filter((s) => s.status === "missing")
                  .slice(0, 3)
                  .map((skill, idx) => (
                    <div key={idx} className="text-xs text-gray-300">
                      • {skill.skill}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}