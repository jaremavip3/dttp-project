"use client";

import { useState, useEffect } from "react";
import { AI_MODELS, ClipService } from "@/services/clipService";

export default function ModelSelector({ selectedModel, onModelChange, className = "" }) {
  const [modelHealth, setModelHealth] = useState({});
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkModelHealth();
  }, []);

  const checkModelHealth = async () => {
    setIsChecking(true);
    try {
      const health = await ClipService.checkAllModels();
      setModelHealth(health);
    } catch (error) {
      console.error("Error checking model health:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (model) => {
    const health = modelHealth[model];
    if (!health) return "⏳";
    return health.status === "healthy" ? "✅" : "❌";
  };

  const getStatusColor = (model) => {
    const health = modelHealth[model];
    if (!health) return "text-gray-500";
    return health.status === "healthy" ? "text-green-600" : "text-red-600";
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">AI Search Model</label>
        <button
          onClick={checkModelHealth}
          disabled={isChecking}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        >
          {isChecking ? "Checking..." : "Refresh Status"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.entries(AI_MODELS).map(([key, model]) => {
          const isSelected = selectedModel === key;
          const health = modelHealth[key];
          const isHealthy = health?.status === "healthy";

          return (
            <button
              key={key}
              onClick={() => onModelChange(key)}
              disabled={!isHealthy}
              className={`
                p-3 rounded-lg border text-left transition-all duration-200
                ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }
                ${!isHealthy ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{model.name}</span>
                <span className="text-lg">{getStatusIcon(key)}</span>
              </div>

              <p className="text-xs text-gray-600 mb-2">{model.description}</p>

              <div className="flex items-center justify-between text-xs">
                <span className={getStatusColor(key)}>
                  {health?.status === "healthy"
                    ? `${health.embeddings_count || 0} images indexed`
                    : health?.error || "Checking..."}
                </span>
                {isSelected && <span className="text-blue-600 font-medium">Active</span>}
              </div>
            </button>
          );
        })}
      </div>

      {Object.values(modelHealth).every((h) => h?.status !== "healthy") && !isChecking && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            ⚠️ No AI models are currently available. Make sure the servers are running:
          </p>
          <ul className="text-xs text-red-700 mt-1 ml-4">
            <li>
              • CLIP: <code>python fastapi_clip_server.py</code>
            </li>
            <li>
              • EVA02: <code>python eva02_fastapi_server.py</code>
            </li>
            <li>
              • DFN5B: <code>python dfn5b_fastapi_server.py</code>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
