"use client";

import { useState } from "react";
import { bulkImportQuestionsAction } from "@/features/questions/actions";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Upload, Download, FileText, CheckCircle2, X } from "lucide-react";

interface BulkImportModalProps {
  onClose: () => void;
}

const SAMPLE_JSON_TEMPLATE = [
  {
    section: "mental_ability",
    topic: "odd_man_out",
    mat_category: "odd_man_out",
    difficulty: "easy",
    is_pyq: true,
    pyq_year: 2024,
    question_text_en: "Find the figure which differs from the other three figures.",
    question_text_hi: "चार आकृतियों में से भिन्न आकृति पहचानें।",
    question_image_url: null,
    options: [
      {
        key: "A",
        text_en: "Triangle with 3 dots",
        text_hi: "3 बिंदु वाला त्रिभुज",
        image_url: null,
      },
      {
        key: "B",
        text_en: "Square with 4 dots",
        text_hi: "4 बिंदु वाला वर्ग",
        image_url: null,
      },
      {
        key: "C",
        text_en: "Pentagon with 5 dots",
        text_hi: "5 बिंदु वाला पंचभुज",
        image_url: null,
      },
      {
        key: "D",
        text_en: "Hexagon with 4 dots",
        text_hi: "4 बिंदु वाला षट्भुज",
        image_url: null,
      },
    ],
    correct_option: "D",
    explanation_en: "Polygon sides match internal dots except in Option D.",
    explanation_hi: "विकल्प D को छोड़कर सभी में बिंदु भुजाओं के बराबर हैं।",
  },
  {
    section: "arithmetic",
    topic: "profit_and_loss",
    mat_category: null,
    difficulty: "medium",
    is_pyq: true,
    pyq_year: 2023,
    question_text_en:
      "Cost price is ₹400 and transportation is ₹50. Selling price is ₹540. Find profit %.",
    question_text_hi:
      "क्रय मूल्य ₹400 और ढुलाई ₹50 है। विक्रय मूल्य ₹540 है। लाभ % ज्ञात कीजिए।",
    question_image_url: null,
    options: [
      { key: "A", text_en: "20%", text_hi: "20%", image_url: null },
      { key: "B", text_en: "25%", text_hi: "25%", image_url: null },
      { key: "C", text_en: "18%", text_hi: "18%", image_url: null },
      { key: "D", text_en: "30%", text_hi: "30%", image_url: null },
    ],
    correct_option: "A",
    explanation_en:
      "Total CP = ₹450, SP = ₹540. Profit = ₹90. Profit % = (90/450)*100 = 20%.",
    explanation_hi: "कुल CP = ₹450, SP = ₹540. लाभ = ₹90. लाभ % = (90/450)*100 = 20%।",
  },
];

export function BulkImportModal({ onClose }: BulkImportModalProps) {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleDownloadTemplate = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(SAMPLE_JSON_TEMPLATE, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "jnvst_questions_template.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessCount(null);

    let parsedQuestions: any[];
    try {
      parsedQuestions = JSON.parse(jsonText);
      if (!Array.isArray(parsedQuestions)) {
        throw new Error("Input must be a JSON array of question objects.");
      }
    } catch (err: any) {
      setError(`Invalid JSON: ${err?.message || "Check JSON formatting syntax."}`);
      return;
    }

    setIsPending(true);
    const res = await bulkImportQuestionsAction({ questions: parsedQuestions });
    setIsPending(false);

    if (!res.success) {
      setError(res.error || "Bulk import failed. Please verify question schemas.");
    } else {
      setSuccessCount(res.data?.count || parsedQuestions.length);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-teal-800" />
            <h3 className="font-bold text-slate-900">Bulk Question Bank Importer</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleImport} className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900">
                Need the standard schema format?
              </span>
              <p className="text-[11px] text-slate-500">
                Download sample JSON template covering MAT and Arithmetic with options and
                bilingual keys.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="gap-1.5 text-xs text-teal-800"
            >
              <Download className="h-3.5 w-3.5" /> Download JSON Template
            </Button>
          </div>

          {error && <Alert variant="error">{error}</Alert>}
          {successCount !== null && (
            <Alert variant="success" title="Import Completed">
              Successfully imported {successCount} questions into the question bank!
              Reloading...
            </Alert>
          )}

          <div className="space-y-1.5">
            <label htmlFor="jsonPayload" className="text-xs font-semibold text-slate-700">
              Paste Questions JSON Array:
            </label>
            <textarea
              id="jsonPayload"
              rows={12}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={`[\n  {\n    "section": "mental_ability",\n    "topic": "odd_man_out",\n    "options": [...]\n  }\n]`}
              className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setJsonText(JSON.stringify(SAMPLE_JSON_TEMPLATE, null, 2))}
              className="text-xs"
            >
              <FileText className="mr-1 h-3.5 w-3.5 text-slate-500" /> Load Sample Data
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isPending}
                disabled={!jsonText.trim()}
              >
                Validate & Import Questions
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
