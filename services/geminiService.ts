import { GoogleGenAI } from "@google/genai";
import { Order, Product } from "../types";

// Always initialize GoogleGenAI with the apiKey property using process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDailyInsight = async (orders: Order[], revenue: number): Promise<string> => {
  if (!navigator.onLine) return "التحليل الذكي غير متاح (وضع عدم الاتصال)";
  /* Assume process.env.API_KEY is pre-configured and valid */

  try {
    const orderSummary = orders.map(o => ({
      time: o.createdAt.toLocaleTimeString(),
      total: o.total,
      items: o.items.map(i => i.name).join(", ")
    }));

    const prompt = `
      بصفتك مدير مطعم خبير، قم بتحليل بيانات اليوم التالية باللغة العربية:
      - إجمالي الإيرادات: ${revenue}
      - عدد الطلبات: ${orders.length}
      - تفاصيل الطلبات: ${JSON.stringify(orderSummary.slice(0, 10))}... (عينة)

      أعطني ملخصاً قصيراً (لا يتجاوز 3 جمل) حول الأداء واقتراحاً واحداً للتحسين غداً.
    `;

    /* Updated model to 'gemini-3-flash-preview' for text analysis tasks */
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    /* Directly access the .text property on the GenerateContentResponse object */
    return response.text || "لم يتم إنشاء تحليل.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";
  }
};

export const suggestMenuDescription = async (itemName: string, category: string): Promise<string> => {
  if (!navigator.onLine) return "";

  try {
    const prompt = `اكتب وصفاً جذاباً وقصيراً (جملة واحدة) لقائمة الطعام لهذا الصنف: "${itemName}" في قسم "${category}". اجعله يبدو لذيذاً جداً باللغة العربية.`;
    
    /* Updated model to 'gemini-3-flash-preview' for menu content generation */
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    /* Directly access the .text property and trim the result */
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "";
  }
};

export const suggestSmartUpsell = async (currentCartItems: Product[]): Promise<string> => {
    if (!navigator.onLine) return "";
    if (currentCartItems.length === 0) return "";
  
    try {
      const itemNames = currentCartItems.map(i => i.name).join(", ");
      const prompt = `الزبون طلب: ${itemNames}. اقترح صنفاً واحداً فقط لإضافته للطلب لزيادة المبيعات (Upsell) يكون متناسقاً مع الطلب. رد باسم الصنف فقط.`;
  
      /* Updated model to 'gemini-3-flash-preview' for smart product recommendations */
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
  
      /* Access the string output directly using response.text */
      return response.text?.trim() || "";
    } catch (error) {
        return "";
    }
  };
