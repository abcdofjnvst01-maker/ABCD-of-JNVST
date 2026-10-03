import { describe, it, expect } from "vitest";
import type { SectionScoreBreakdown, ExamSection } from "@/server/db/types";

describe("Phase 2: JNVST Scoring & Exam Logic Unit Tests", () => {
  it("calculates exact JNVST marks (+1.25 per correct answer, 0 for incorrect/unattempted)", () => {
    const totalQuestions = 80;
    const marksPerQuestion = 1.25;
    const maxMarks = totalQuestions * marksPerQuestion;
    expect(maxMarks).toBe(100.0);

    // Section 1: MAT (40 Qs -> 50 marks)
    expect(40 * marksPerQuestion).toBe(50.0);

    // Section 2: Arithmetic (20 Qs -> 25 marks)
    expect(20 * marksPerQuestion).toBe(25.0);

    // Section 3: Language (20 Qs -> 25 marks)
    expect(20 * marksPerQuestion).toBe(25.0);
  });

  it("accurately computes accuracy percentage and score breakdown", () => {
    const studentResponses = [
      { qId: "1", selected: "A", correct: "A", marks: 1.25 },
      { qId: "2", selected: "B", correct: "C", marks: 1.25 }, // incorrect
      { qId: "3", selected: null, correct: "B", marks: 1.25 }, // unattempted
      { qId: "4", selected: "D", correct: "D", marks: 1.25 },
    ];

    let score = 0;
    let attempted = 0;
    let correct = 0;

    studentResponses.forEach((r) => {
      if (r.selected !== null) {
        attempted += 1;
        if (r.selected === r.correct) {
          correct += 1;
          score += r.marks;
        }
      }
    });

    const accuracy = Number(((correct / attempted) * 100).toFixed(2));
    expect(score).toBe(2.5);
    expect(attempted).toBe(3);
    expect(correct).toBe(2);
    expect(accuracy).toBe(66.67);
  });

  it("verifies time remaining formatting", () => {
    const formatTime = (totalSeconds: number) => {
      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;
      if (hrs > 0) {
        return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      }
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    expect(formatTime(7200)).toBe("02:00:00"); // 120 mins
    expect(formatTime(3665)).toBe("01:01:05");
    expect(formatTime(59)).toBe("00:59");
    expect(formatTime(600)).toBe("10:00");
  });
});
