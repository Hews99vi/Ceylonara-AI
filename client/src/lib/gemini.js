import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
      
const safetySetting = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
];
      
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_PUBLIC_KEY);
      
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  safetySetting,
  systemInstruction: "You are Ceylonara, a specialized AI assistant focused exclusively on tea-related topics. You only respond to questions about tea, tea culture, tea preparation, tea history, tea varieties, or anything directly related to tea. For any questions not related to tea, politely explain that you can only provide information about tea-related topics and suggest they ask something about tea instead. Your expertise is specifically about Ceylon tea and other tea varieties from around the world.",
});
      
export default model;