import { GoogleGenAI } from "@google/genai";
import { Order, Product, Customer } from "../types";

// Safety check for API key
const apiKey = process.env.API_KEY || '';

export const geminiService = {
  analyzeBusiness: async (orders: Order[], products: Product[], customers: Customer[]) => {
    if (!apiKey) {
      return "API Key is missing. Please ensure the API_KEY environment variable is set to use AI features.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Prepare a summary of data to send to Gemini (avoiding sending too much raw data)
    const salesSummary = orders.map(o => ({
      date: o.date.split('T')[0],
      total: o.totalAmount,
      paid: o.paidAmount,
      items: o.items.map(i => i.productName).join(', ')
    })).slice(0, 50); // Limit to last 50 orders for context window

    const stockSummary = products.filter(p => p.stock < 5).map(p => ({
      name: p.name,
      stock: p.stock
    }));

    const prompt = `
      You are an expert business consultant for "Elegance Boutique", a high-end fashion retailer in Malawi.
      Analyze the following business data and provide 3 key insights and 1 actionable recommendation in a professional, encouraging tone.
      
      Context:
      - Currency: Malawi Kwacha (MK)
      - Recent Orders (Sample): ${JSON.stringify(salesSummary)}
      - Low Stock Items: ${JSON.stringify(stockSummary)}
      - Total Debt Outstanding: ${customers.reduce((acc, c) => acc + c.currentDebt, 0)}
      
      Format the output as HTML (using <b> for bold, <br> for breaks, <ul><li> for lists) but do not wrap it in markdown code blocks. Keep it concise.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Unable to generate insights at the moment. Please try again later.";
    }
  },

  generateProductDescription: async (productName: string, category: string) => {
    if (!apiKey) return "Premium fashion item suitable for any occasion.";

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Write a short, luxurious, and catchy product description (max 2 sentences) for a fashion item named "${productName}" in the category "${category}".`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
        return "Premium fashion item suitable for any occasion.";
    }
  }
};