import { z } from "zod";

export const optionKeySchema = z.enum(["A", "B", "C", "D"]);

export const questionOptionSchema = z.object({
  key: optionKeySchema,
  text_en: z.string().optional().default(""),
  text_hi: z.string().optional().default(""),
  image_url: z.string().nullable().optional().default(null),
});

export const examSectionSchema = z.enum(["mental_ability", "arithmetic", "language"]);

export const matCategorySchema = z
  .enum([
    "odd_man_out",
    "figure_matching",
    "pattern_completion",
    "figure_series_completion",
    "analogy",
    "geometrical_figure_completion",
    "mirror_imaging",
    "punched_hole_pattern",
    "space_visualization",
    "embedded_figure",
  ])
  .nullable()
  .optional();

export const difficultySchema = z.enum(["easy", "medium", "hard"]);

export const questionSchema = z.object({
  passageId: z.string().uuid().nullable().optional(),
  section: examSectionSchema,
  topic: z.string().min(2, "Topic is required."),
  matCategory: matCategorySchema,
  difficulty: difficultySchema.default("medium"),
  isPyq: z.boolean().default(false),
  pyqYear: z.coerce.number().min(2000).max(2035).nullable().optional(),
  marks: z.coerce.number().min(0.25).max(10).default(1.25),
  negativeMarks: z.coerce.number().min(0).max(5).default(0.0),
  questionTextEn: z.string().optional().nullable(),
  questionTextHi: z.string().optional().nullable(),
  questionImageUrl: z.string().optional().nullable(),
  options: z
    .array(questionOptionSchema)
    .length(4, "Exactly 4 options (A, B, C, D) are required."),
  correctOption: optionKeySchema,
  explanationEn: z.string().optional().nullable(),
  explanationHi: z.string().optional().nullable(),
  explanationImageUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const passageSchema = z.object({
  titleEn: z.string().optional().nullable(),
  titleHi: z.string().optional().nullable(),
  contentEn: z
    .string()
    .min(10, "English passage content must be at least 10 characters.")
    .optional()
    .nullable(),
  contentHi: z
    .string()
    .min(10, "Hindi passage content must be at least 10 characters.")
    .optional()
    .nullable(),
  languageCode: z.enum(["en", "hi", "both"]).default("both"),
});

export const bulkImportQuestionItemSchema = z.object({
  section: examSectionSchema,
  topic: z.string().min(1, "Topic required"),
  mat_category: z.string().nullable().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  is_pyq: z.boolean().default(false),
  pyq_year: z.number().nullable().optional(),
  question_text_en: z.string().nullable().optional(),
  question_text_hi: z.string().nullable().optional(),
  question_image_url: z.string().nullable().optional(),
  options: z.array(questionOptionSchema).min(2),
  correct_option: optionKeySchema,
  explanation_en: z.string().nullable().optional(),
  explanation_hi: z.string().nullable().optional(),
  explanation_image_url: z.string().nullable().optional(),
});

export const bulkImportSchema = z.object({
  questions: z
    .array(bulkImportQuestionItemSchema)
    .min(1, "At least one question is required for import."),
});

export type QuestionInput = z.infer<typeof questionSchema>;
export type PassageInput = z.infer<typeof passageSchema>;
export type BulkImportInput = z.infer<typeof bulkImportSchema>;
export type BulkImportQuestionItem = z.infer<typeof bulkImportQuestionItemSchema>;
