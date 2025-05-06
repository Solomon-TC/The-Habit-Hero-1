"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { useRouter } from "next/navigation";
import { toast } from "./ui/use-toast";

interface FeedbackFormProps {
  onSuccess?: () => void;
}

export function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    feedback_type: "feature",
    content: "",
    contactConsent: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      feedback_type: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      contactConsent: e.target.checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          feedback_type: formData.feedback_type,
          content: formData.content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      // Reset form
      setFormData({
        title: "",
        feedback_type: "feature",
        content: "",
        contactConsent: false,
      });

      toast({
        title: "Success!",
        description: "Your feedback has been submitted. Thank you!",
      });

      // Refresh the page data
      router.refresh();

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="feedback-type">Feedback Type</Label>
        <Select
          value={formData.feedback_type}
          onValueChange={handleSelectChange}
        >
          <SelectTrigger id="feedback-type">
            <SelectValue placeholder="Select feedback type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="feature">Feature Request</SelectItem>
            <SelectItem value="bug">Bug Report</SelectItem>
            <SelectItem value="improvement">Improvement Suggestion</SelectItem>
            <SelectItem value="general">General Feedback</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-title">Title</Label>
        <input
          id="feedback-title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Brief summary of your feedback"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-details">Details</Label>
        <Textarea
          id="feedback-details"
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Please provide as much detail as possible"
          rows={5}
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="contactConsent"
            checked={formData.contactConsent}
            onChange={handleCheckboxChange}
            className="rounded text-purple-600 focus:ring-purple-500"
          />
          <span>I'm willing to be contacted about this feedback</span>
        </Label>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Submitting...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
              Submit Feedback
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
