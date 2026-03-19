"use client";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { generatePDF, clearError } from "@/app/store/pdf-slice/pdf-slice";

const EXAMPLES = [
  "Business plan for a coffee shop startup",
  "Report on artificial intelligence trends 2025",
  "Marketing strategy for a mobile app",
  "Climate change impact analysis",
  "Project proposal for a healthcare platform",
];

export default function PDFPage() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: any) => state.pdf);
  const [topic, setTopic] = useState("");
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim() || loading) return;
    setSuccess(false);
    dispatch(clearError());

    const result = await dispatch(generatePDF(topic.trim()) as any);
    if (result.meta.requestStatus === "fulfilled") {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">📄</span>
            <h1 className="text-3xl font-semibold">PDF Generator</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Describe what you want and AI will write and generate a professional
            PDF document instantly.
          </p>
        </div>

        {/* Generator Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            What should the document be about?
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. A business plan for an AI startup with market analysis..."
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:border-purple-500 transition mb-4"
          />

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm mb-4">
              ✅ PDF downloaded successfully!
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating PDF... (this may take 15–20s)
              </>
            ) : (
              "📄 Generate & Download PDF"
            )}
          </button>
        </div>

        {/* Examples */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-medium text-gray-400 mb-3">
            Try an example
          </h2>
          <div className="flex flex-col gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setTopic(ex)}
                className="text-left text-sm px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-300 transition"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
