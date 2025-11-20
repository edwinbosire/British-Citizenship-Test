import { GoogleGenAI, Type } from "@google/genai";
import { Question, FlashCard } from "../types";
import { TOTAL_QUESTIONS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuizQuestions = async (count: number = TOTAL_QUESTIONS): Promise<Question[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate ${count} multiple-choice questions for the "Life in the UK Test". 
      The questions must cover the official handbook sections: The Values and Principles of the UK, A Long and Illustrious History, A Modern, Thriving Society, and The UK Government, the Law and Your Role.
      Ensure the difficulty matches the real exam.
      The "correctIndex" must be 0, 1, 2, or 3.
      Provide a "chapterReference" suggesting which part of the handbook to read for this topic.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "The question text" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "An array of 4 possible answers"
              },
              correctIndex: { type: Type.INTEGER, description: "The index (0-3) of the correct answer" },
              explanation: { type: Type.STRING, description: "A brief explanation of why the answer is correct" },
              chapterReference: { type: Type.STRING, description: "The relevant chapter or section title from the handbook" }
            },
            required: ["text", "options", "correctIndex", "explanation", "chapterReference"]
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("No response text from Gemini");
    }

    const rawData = JSON.parse(response.text);
    
    // Add IDs to the questions
    const questions: Question[] = rawData.map((q: any, index: number) => ({
      ...q,
      id: index + 1
    }));

    return questions;

  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

export const generateFlashCards = async (topic: string, count: number = 5): Promise<Omit<FlashCard, 'id' | 'box' | 'nextReview' | 'createdAt'>[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate ${count} flashcards for the "Life in the UK Test" focused on the topic: "${topic}".
      The front should be a specific question or term.
      The back should be the answer or definition.
      Keep them concise and factual.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING, description: "Question or term on the front of the card" },
              back: { type: Type.STRING, description: "Answer or definition on the back of the card" },
              topic: { type: Type.STRING, description: "The specific sub-topic" }
            },
            required: ["front", "back", "topic"]
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("No response text from Gemini");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw error;
  }
};