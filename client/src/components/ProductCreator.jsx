"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

const CATEGORIES = [
  { value: "outerwear", label: "Outerwear", subcategories: ["sweaters", "jackets", "coats"] },
  { value: "tops", label: "Tops", subcategories: ["shirts", "blouses", "t-shirts"] },
  { value: "bottoms", label: "Bottoms", subcategories: ["pants", "jeans", "skirts"] },
  { value: "dresses", label: "Dresses", subcategories: ["casual", "formal", "maxi"] },
  { value: "activewear", label: "Activewear", subcategories: ["sports", "gym", "yoga"] },
];

const GENDERS = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "unisex", label: "Unisex" },
];

export default function ProductCreator() {
  const [step, setStep] = useState(1); // 1: Upload & Analyze, 2: Create Product
  const [formData, setFormData] = useState({
    image: null,
    imagePreview: null,
    price: "",
    category: "",
    subcategory: "",
    gender: "",
    isOnSale: false,
    isNew: false,
    description: "",
    tags: [],
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  // Analyze image with BLIP-2
  const analyzeImage = async () => {
    if (!formData.image) return;

    setIsAnalyzing(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append("file", formData.image);

      const response = await fetch("http://localhost:8000/analyze-image", {
        method: "POST",
        body: formDataObj,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.analysis) {
        setFormData((prev) => ({
          ...prev,
          description: data.analysis.description || "",
          tags: data.analysis.tags || [],
        }));
        setAnalysisComplete(true);
      } else {
        throw new Error("Analysis failed");
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      // Fallback values
      setFormData((prev) => ({
        ...prev,
        description: "Stylish clothing item perfect for your wardrobe.",
        tags: ["clothing", "fashion", "style"],
      }));
      setAnalysisComplete(true);
    }
    setIsAnalyzing(false);
  };

  // Create product
  const createProduct = async () => {
    setIsCreating(true);
    try {
      // Here you would send the product data to your backend

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      alert("Product created successfully!");

      // Reset form
      setFormData({
        image: null,
        imagePreview: null,
        price: "",
        category: "",
        subcategory: "",
        gender: "",
        isOnSale: false,
        isNew: false,
        description: "",
        tags: [],
      });
      setStep(1);
      setAnalysisComplete(false);
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Error creating product. Please try again.");
    }
    setIsCreating(false);
  };

  // Get subcategories for selected category
  const getSubcategories = () => {
    const category = CATEGORIES.find((cat) => cat.value === formData.category);
    return category ? category.subcategories : [];
  };

  if (step === 1) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Step 1: Upload & Analyze Product Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Image Preview */}
          {formData.imagePreview && (
            <div className="space-y-4">
              <img
                src={formData.imagePreview}
                alt="Product preview"
                className="w-full max-w-md mx-auto rounded-lg border"
              />

              {!analysisComplete && (
                <Button onClick={analyzeImage} disabled={isAnalyzing} className="w-full">
                  {isAnalyzing ? "Analyzing Image..." : "Analyze with AI"}
                </Button>
              )}
            </div>
          )}

          {/* Analysis Results */}
          {analysisComplete && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800">AI Analysis Complete!</h3>

              <div>
                <label className="block text-sm font-medium mb-1">Generated Description:</label>
                <p className="text-sm text-gray-700 bg-white p-2 rounded border">{formData.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Generated Tags:</label>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button onClick={() => setStep(2)} className="w-full">
                Continue to Product Details
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Step 2: Complete Product Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Preview */}
        {formData.imagePreview && (
          <img src={formData.imagePreview} alt="Product" className="w-32 h-32 object-cover rounded-lg border mx-auto" />
        )}

        {/* Price */}
        <div>
          <label className="block text-sm font-medium mb-2">Price ($)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
            placeholder="Enter price"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                category: e.target.value,
                subcategory: "", // Reset subcategory when category changes
              }))
            }
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select category</option>
            {CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory */}
        {formData.category && (
          <div>
            <label className="block text-sm font-medium mb-2">Subcategory</label>
            <select
              value={formData.subcategory}
              onChange={(e) => setFormData((prev) => ({ ...prev, subcategory: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select subcategory</option>
              {getSubcategories().map((subcategory) => (
                <option key={subcategory} value={subcategory}>
                  {subcategory.charAt(0).toUpperCase() + subcategory.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium mb-2">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select gender</option>
            {GENDERS.map((gender) => (
              <option key={gender.value} value={gender.value}>
                {gender.label}
              </option>
            ))}
          </select>
        </div>

        {/* Flags */}
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isOnSale}
              onChange={(e) => setFormData((prev) => ({ ...prev, isOnSale: e.target.checked }))}
            />
            <span className="text-sm">On Sale</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isNew}
              onChange={(e) => setFormData((prev) => ({ ...prev, isNew: e.target.checked }))}
            />
            <span className="text-sm">New Arrival</span>
          </label>
        </div>

        {/* AI Generated Description (Editable) */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Product description"
          />
        </div>

        {/* AI Generated Tags (Editable) */}
        <div>
          <label className="block text-sm font-medium mb-2">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => {
                  const newTags = [...formData.tags];
                  newTags.splice(index, 1);
                  setFormData((prev) => ({ ...prev, tags: newTags }));
                }}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
          <Input
            placeholder="Add a tag and press Enter"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                const value = e.target.value.trim();
                if (value && !formData.tags.includes(value)) {
                  setFormData((prev) => ({
                    ...prev,
                    tags: [...prev.tags, value],
                  }));
                  e.target.value = "";
                }
              }
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
            Back to Upload
          </Button>

          <Button
            onClick={createProduct}
            disabled={isCreating || !formData.price || !formData.category}
            className="flex-1"
          >
            {isCreating ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
