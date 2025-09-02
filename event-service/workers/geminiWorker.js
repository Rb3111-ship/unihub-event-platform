require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

console.log(" Starting Gemini Description gen ")
const apiKey = process.env.GEMINI_API_KEY;
console.log("apiKey", apiKey);
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set in environment variables.');
  throw new Error("GEMINI_API_KEY environment variable is missing or incorrect.");
}


const ai = new GoogleGenAI({ apiKey });
async function generateGeminiResponse(userPrompt) {
  try {

    const response = await ai.models.generateContent({
      model:"gemini-2.0-flash" ,
      //,
      //"gemini-1.5-flash-8b"
      contents: userPrompt,
    });

    const text = response.text;
    // console.log(text);
    return text;
  }
  catch (err) {
    console.error("Failed to initialize Gemini model:", err);
  }
}

module.exports = {
  generateGeminiResponse,
};

