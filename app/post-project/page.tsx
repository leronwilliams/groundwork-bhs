"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";

const islands = [
  "New Providence",
  "Abaco",
  "Exuma",
  "Eleuthera",
  "Andros",
  "Long Island",
  "Bimini",
  "Grand Bahama",
  "Other",
];

const projectTypes = [
  "New build",
  "Renovation",
  "Extension",
  "Repair",
  "Commercial",
  "Other",
];

const propertyTypes = ["Residential", "Commercial", "Multi-family", "Land only"];

const budgetRanges = [
  "Under $50k",
  "$50k–$100k",
  "$100k–$250k",
  "$250k–$500k",
  "$500k+",
  "Prefer not to say",
];

const timelines = [
  "ASAP",
  "Within 1 month",
  "1–3 months",
  "3–6 months",
  "Just exploring",
];

const contactMethods = ["WhatsApp", "Email", "Phone"];

export default function PostProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    projectType: "",
    island: "",
    area: "",
    propertyType: "",
    budgetRange: "",
    squareFootage: "",
    description: "",
    startTimeline: "",
    hasPermit: "",
    needFinancing: "",
    homeownerName: "",
    homeownerEmail: "",
    homeownerPhone: "",
    bestContactMethod: "WhatsApp",
    photos: [] as string[],
    consent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.projectType) newErrors.projectType = "Select a project type";
      if (!formData.island) newErrors.island = "Select an island";
      if (!formData.area.trim()) newErrors.area = "Enter the area or settlement";
      if (!formData.propertyType) newErrors.propertyType = "Select property type";
      if (!formData.budgetRange) newErrors.budgetRange = "Select a budget range";
    }

    if (currentStep === 2) {
      if (!formData.description.trim() || formData.description.length < 10)
        newErrors.description = "Description must be at least 10 characters";
      if (!formData.startTimeline) newErrors.startTimeline = "Select a timeline";
      if (!formData.hasPermit) newErrors.hasPermit = "Select permit status";
    }

    if (currentStep === 3) {
      if (!formData.homeownerName.trim()) newErrors.homeownerName = "Enter your name";
      if (!formData.homeownerEmail.trim())
        newErrors.homeownerEmail = "Enter your email";
      else if (!/\S+@\S+\.\S+/.test(formData.homeownerEmail))
        newErrors.homeownerEmail = "Enter a valid email";
      if (!formData.homeownerPhone.trim())
        newErrors.homeownerPhone = "Enter your phone number";
      if (!formData.consent) newErrors.consent = "You must agree to share your project details";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          squareFootage: formData.squareFootage
            ? parseInt(formData.squareFootage)
            : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep(4);
      } else {
        setErrors({ submit: data.error || "Failed to submit project" });
      }
    } catch (error) {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50 py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post Your Project</h1>
          <p className="mt-2 text-gray-600">
            Tell us about your project and get matched with verified contractors
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center flex-1">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step > i
                      ? "bg-green-600 text-white"
                      : step === i
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step > i ? <Check className="h-4 w-4" /> : i}
                </div>
                {i < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > i ? "bg-green-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Project Details</span>
            <span>Description</span>
            <span>Contact</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Project Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card space-y-6"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                Project Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Type *
                </label>
                <select
                  value={formData.projectType}
                  onChange={(e) => updateField("projectType", e.target.value)}
                  className={`select-field ${errors.projectType ? "ring-red-500" : ""}`}
                >
                  <option value="">Select project type</option>
                  {projectTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {errors.projectType && (
                  <p className="mt-1 text-sm text-red-600">{errors.projectType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Island *
                </label>
                <select
                  value={formData.island}
                  onChange={(e) => updateField("island", e.target.value)}
                  className={`select-field ${errors.island ? "ring-red-500" : ""}`}
                >
                  <option value="">Select island</option>
                  {islands.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
                {errors.island && (
                  <p className="mt-1 text-sm text-red-600">{errors.island}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area / Settlement *
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => updateField("area", e.target.value)}
                  placeholder="e.g., Paradise Island, George Town"
                  className={`input-field ${errors.area ? "ring-red-500" : ""}`}
                />
                {errors.area && (
                  <p className="mt-1 text-sm text-red-600">{errors.area}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type *
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => updateField("propertyType", e.target.value)}
                  className={`select-field ${errors.propertyType ? "ring-red-500" : ""}`}
                >
                  <option value="">Select property type</option>
                  {propertyTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {errors.propertyType && (
                  <p className="mt-1 text-sm text-red-600">{errors.propertyType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Budget *
                </label>
                <select
                  value={formData.budgetRange}
                  onChange={(e) => updateField("budgetRange", e.target.value)}
                  className={`select-field ${errors.budgetRange ? "ring-red-500" : ""}`}
                >
                  <option value="">Select budget range</option>
                  {budgetRanges.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {errors.budgetRange && (
                  <p className="mt-1 text-sm text-red-600">{errors.budgetRange}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Square Footage (approximate)
                </label>
                <input
                  type="number"
                  value={formData.squareFootage}
                  onChange={(e) => updateField("squareFootage", e.target.value)}
                  placeholder="e.g., 2000"
                  className="input-field"
                />
              </div>

              <div className="flex justify-end">
                <button onClick={handleNext} className="btn-primary">
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Description */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card space-y-6"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                Project Description
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tell us about your project *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={5}
                  placeholder="What needs doing? Timeline? Any special requirements?"
                  className={`input-field ${errors.description ? "ring-red-500" : ""}`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Timeline *
                </label>
                <select
                  value={formData.startTimeline}
                  onChange={(e) => updateField("startTimeline", e.target.value)}
                  className={`select-field ${errors.startTimeline ? "ring-red-500" : ""}`}
                >
                  <option value="">When do you want to start?</option>
                  {timelines.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {errors.startTimeline && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTimeline}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Do you have a building permit? *
                </label>
                <select
                  value={formData.hasPermit}
                  onChange={(e) => updateField("hasPermit", e.target.value)}
                  className={`select-field ${errors.hasPermit ? "ring-red-500" : ""}`}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Not sure">Not sure</option>
                  <option value="Need help with this">Need help with this</option>
                </select>
                {errors.hasPermit && (
                  <p className="mt-1 text-sm text-red-600">{errors.hasPermit}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Need financing?
                </label>
                <select
                  value={formData.needFinancing}
                  onChange={(e) => updateField("needFinancing", e.target.value)}
                  className="select-field"
                >
                  <option value="">Select (optional)</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Already secured">Already secured</option>
                </select>
              </div>

              <div className="flex justify-between">
                <button onClick={handleBack} className="btn-secondary">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </button>
                <button onClick={handleNext} className="btn-primary">
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Contact */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card space-y-6"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                Contact Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.homeownerName}
                  onChange={(e) => updateField("homeownerName", e.target.value)}
                  className={`input-field ${errors.homeownerName ? "ring-red-500" : ""}`}
                />
                {errors.homeownerName && (
                  <p className="mt-1 text-sm text-red-600">{errors.homeownerName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.homeownerEmail}
                  onChange={(e) => updateField("homeownerEmail", e.target.value)}
                  className={`input-field ${errors.homeownerEmail ? "ring-red-500" : ""}`}
                />
                {errors.homeownerEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.homeownerEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.homeownerPhone}
                  onChange={(e) => updateField("homeownerPhone", e.target.value)}
                  placeholder="WhatsApp preferred"
                  className={`input-field ${errors.homeownerPhone ? "ring-red-500" : ""}`}
                />
                {errors.homeownerPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.homeownerPhone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Best Contact Method *
                </label>
                <select
                  value={formData.bestContactMethod}
                  onChange={(e) => updateField("bestContactMethod", e.target.value)}
                  className="select-field"
                >
                  {contactMethods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consent"
                  checked={formData.consent}
                  onChange={(e) => updateField("consent", e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                />
                <label htmlFor="consent" className="text-sm text-gray-600">
                  I agree to share my project details with verified contractors on
                  the Groundwork BHS platform. *
                </label>
              </div>
              {errors.consent && (
                <p className="text-sm text-red-600">{errors.consent}</p>
              )}

              {errors.submit && (
                <p className="text-sm text-red-600">{errors.submit}</p>
              )}

              <div className="flex justify-between">
                <button onClick={handleBack} className="btn-secondary">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Post Project
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card text-center space-y-6"
            >
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Project Posted Successfully!
              </h2>
              <p className="text-gray-600">
                Verified contractors in your area will review your project within
                24 hours. You&apos;ll receive notifications when contractors express
                interest.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="btn-primary"
                >
                  View My Projects
                </button>
                <button
                  onClick={() => router.push("/contractors")}
                  className="btn-secondary"
                >
                  Browse Contractors
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
