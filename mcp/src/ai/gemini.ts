import { GoogleGenAI } from '@google/genai';
import { supabase } from '../database/supabase.js';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ''
});

export async function analyzeIncident(incidentDetails: string): Promise<any> {
  const prompt = `
  You are the AI of A.E.G.I.S., the AI Powered Emergency Guardian Intelligence System.
  Analyze the following incident report and determine the required hero capabilities:
  
  Incident Details: ${incidentDetails}
  
  Return a JSON object with:
  1. threatLevel (low, medium, high, critical)
  2. requiredPowers (array of strings)
  3. recommendedHeroProfile (description of the ideal hero for this mission)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error('No response from Gemini API');
  } catch (error) {
    console.error('Error analyzing incident with Gemini:', error);
    throw error;
  }
}
