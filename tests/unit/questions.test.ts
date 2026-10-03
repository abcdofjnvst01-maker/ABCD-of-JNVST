import { describe, it, expect } from "vitest";
import {
  questionSchema,
  passageSchema,
  bulkImportSchema,
} from "@/server/validation/question";

describe("Question Bank Validation Schemas", () => {
  it("validates a complete bilingual Mental Ability question", () => {
    const validMatQuestion = {
      section: "mental_ability",
      topic: "odd_man_out",
      matCategory: "odd_man_out",
      difficulty: "easy",
      isPyq: true,
      pyqYear: 2024,
      marks: 1.25,
      negativeMarks: 0.0,
      questionTextEn: "Find the odd figure among the four options.",
      questionTextHi: "चार विकल्पों में से भिन्न आकृति पहचानें।",
      questionImageUrl: "https://example.com/figures/q1.png",
      options: [
        { key: "A", text_en: "Triangle", text_hi: "त्रिभुज", image_url: null },
        { key: "B", text_en: "Square", text_hi: "वर्ग", image_url: null },
        { key: "C", text_en: "Pentagon", text_hi: "पंचभुज", image_url: null },
        { key: "D", text_en: "Hexagon", text_hi: "षट्भुज", image_url: null },
      ],
      correctOption: "D",
      explanationEn: "Hexagon has mismatched properties.",
      explanationHi: "षट्भुज अन्य से भिन्न है।",
      isActive: true,
    };

    const parsed = questionSchema.safeParse(validMatQuestion);
    expect(parsed.success).toBe(true);
  });

  it("fails if fewer than 4 options are provided", () => {
    const invalidQuestion = {
      section: "arithmetic",
      topic: "fractions",
      difficulty: "medium",
      options: [
        { key: "A", text_en: "1/2", text_hi: "1/2" },
        { key: "B", text_en: "3/4", text_hi: "3/4" },
      ],
      correctOption: "A",
    };

    const parsed = questionSchema.safeParse(invalidQuestion);
    expect(parsed.success).toBe(false);
  });

  it("validates bilingual reading comprehension passage", () => {
    const validPassage = {
      titleEn: "The Banyan Tree",
      titleHi: "बरगद का पेड़",
      contentEn: "The Banyan tree is one of the most magnificent trees in India.",
      contentHi: "बरगद का पेड़ भारत के सबसे भव्य पेड़ों में से एक है।",
      languageCode: "both",
    };

    const parsed = passageSchema.safeParse(validPassage);
    expect(parsed.success).toBe(true);
  });

  it("validates bulk import JSON payload", () => {
    const bulkPayload = {
      questions: [
        {
          section: "arithmetic",
          topic: "profit_and_loss",
          difficulty: "hard",
          is_pyq: true,
          pyq_year: 2023,
          question_text_en: "Cost price is ₹400, selling price is ₹500.",
          question_text_hi: "क्रय मूल्य ₹400, विक्रय मूल्य ₹500 है।",
          options: [
            { key: "A", text_en: "25%", text_hi: "25%" },
            { key: "B", text_en: "20%", text_hi: "20%" },
            { key: "C", text_en: "15%", text_hi: "15%" },
            { key: "D", text_en: "30%", text_hi: "30%" },
          ],
          correct_option: "A",
        },
      ],
    };

    const parsed = bulkImportSchema.safeParse(bulkPayload);
    expect(parsed.success).toBe(true);
  });
});
