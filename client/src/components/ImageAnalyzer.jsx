"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function ImageAnalyzer() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setAnalysis(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const analyzeImage = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/analyze-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.analysis) {
        setAnalysis(result.analysis);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setError(err.message);
      console.error("Analysis error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
    setPreview(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">🤖 AI Image Analyzer (BLIP-2)</CardTitle>
          <p className="text-center text-gray-600">
            Upload an image to generate captions, tags, and descriptions automatically
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="space-y-2">
                <div className="text-4xl">📸</div>
                <div className="text-lg font-medium">Choose an image</div>
                <div className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</div>
              </div>
            </label>
          </div>

          {/* Preview */}
          {preview && (
            <div className="text-center">
              <img src={preview} alt="Preview" className="max-w-md max-h-64 mx-auto rounded-lg shadow-md" />
            </div>
          )}

          {/* Action Buttons */}
          {file && (
            <div className="flex gap-4 justify-center">
              <Button onClick={analyzeImage} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  "🔍 Analyze Image"
                )}
              </Button>
              <Button onClick={clearAll} variant="outline">
                🗑️ Clear
              </Button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-800 font-medium">Error</div>
              <div className="text-red-600">{error}</div>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-green-800 font-medium mb-2">✅ Analysis Complete</div>

                {/* Caption */}
                {analysis.caption && (
                  <div className="mb-4">
                    <h3 className="font-bold text-lg mb-2">📝 Caption</h3>
                    <p className="bg-white p-3 rounded border italic">"{analysis.caption}"</p>
                  </div>
                )}

                {/* Tags */}
                {analysis.tags && analysis.tags.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-bold text-lg mb-2">🏷️ Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.tags.map((tag, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {analysis.description && (
                  <div>
                    <h3 className="font-bold text-lg mb-2">📖 Description</h3>
                    <p className="bg-white p-3 rounded border">{analysis.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
