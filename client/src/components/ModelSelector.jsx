"use client";

import { useState, useEffect } from "react";
import { AI_MODELS } from "@/services/clipService";
import ClipService from "@/services/clipService";

export default function ModelSelector({ selectedModel, onModelChange, className = "" }) {
  const [modelHealth, setModelHealth] = useState({});
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkModelHealth();
  }, []);

  const checkModelHealth = async () => {
    setIsChecking(true);
    try {
      const health = await ClipService.getAllHealthStatuses();
      setModelHealth(health);
    } catch (error) {
      console.error("Error checking model health:", error);
      // Set a fallback state when server is not available
      setModelHealth({
        CLIP: { status: "error", error: "Server not available", name: "CLIP" },
        EVA02: { status: "error", error: "Server not available", name: "EVA02" },
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (model) => {
    const health = modelHealth[model];
    if (!health) return "";
    return health.status === "healthy" ? "●" : "○";
  };

  const getStatusColor = (model) => {
    const health = modelHealth[model];
    if (!health) return "text-gray-400";
    return health.status === "healthy" ? "text-green-500" : "text-red-400";
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">AI Model</label>
        <button
          onClick={checkModelHealth}
          disabled={isChecking}
          className="text-xs text-gray-500 hover:text-gray-700 disabled:text-gray-400 transition-colors p-1 touch-manipulation"
        >
          {isChecking ? "..." : "↻"}
        </button>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-sm">
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
                  w-full
                  relative p-3 sm:p-3 rounded-lg text-left transition-all duration-200
                  backdrop-blur-sm border touch-manipulation
                  ${
                    isSelected
                      ? "bg-blue-50/80 border-blue-200/60 shadow-sm"
                      : "bg-white/60 border-gray-200/40 hover:bg-gray-50/80 hover:border-gray-300/60"
                  }
                  ${!isHealthy ? "opacity-40 cursor-not-allowed hover:bg-white/60" : "cursor-pointer"}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-gray-800">{model.name}</span>
                  <span className="text-sm">{getStatusIcon(key)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className={`${getStatusColor(key)} font-medium`}>
                    {health?.status === "healthy" ? "Ready" : health?.error ? "Offline" : "Loading"}
                  </span>
                  {isSelected && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {Object.values(modelHealth).every((h) => h?.status !== "healthy") && !isChecking && (
        <div className="relative p-2.5 rounded-lg backdrop-blur-sm bg-red-50/60 border border-red-200/40">
          <p className="text-xs text-red-700 font-medium">Server unavailable</p>
          <p className="text-xs text-red-600 mt-0.5">Check port 8000</p>
        </div>
      )}
    </div>
  );
}
