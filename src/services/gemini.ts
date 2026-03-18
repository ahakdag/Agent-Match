import { GoogleGenAI } from "@google/genai";

// Helper to get environment variables safely in both browser and server
const getEnv = (key: string): string => {
  // Static replacements for Vite's define
  if (key === 'GEMINI_API_KEY') return process.env.GEMINI_API_KEY || '';

  // Fallback for other keys or server-side dynamic access
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  
  // Check import.meta.env (Vite client-side)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return (import.meta.env[`VITE_${key}`] as string) || (import.meta.env[key] as string) || '';
  }
  return '';
};

const apiKey = getEnv('GEMINI_API_KEY');
const genAI = new GoogleGenAI({ apiKey });

export async function getEmbedding(text: string): Promise<number[]> {
  const model = "gemini-embedding-2-preview";
  const result = await genAI.models.embedContent({
    model,
    contents: [text],
  });
  
  return result.embeddings[0].values;
}
