
import { GoogleGenAI, Type } from "@google/genai";

export async function getPersonalizedAnalysis(userData: any) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Basado en los datos de la usuaria:
    - Peso: ${userData[9]}kg
    - Estatura: ${userData[10]}cm
    - Tiempo disponible: ${userData[11]}
    - Objetivo: ${userData[4]}
    
    Genera un párrafo motivador que DEBE OBLIGATORIAMENTE comenzar con: "¡Gracias por esperar, ahora vamos a traerte el RESULTADO REAL!" 
    
    Luego, explica que el sistema analizó cada respuesta para garantizar que el programa tiene sentido para ella. Valida que merece este autocuidado y que 21 días serán el punto de giro entrenando en casa. 
    
    Mantén un tono de autoridad mezclado con una empatía profunda. Usa español de América Latina.`;

  const fallbackText = `¡Gracias por esperar, ahora vamos a traerte el RESULTADO REAL! 

Nuestro sistema analiza CADA RESPUESTA tuya para entender si, DE HECHO, nuestro programa tiene sentido para ti. Estamos analizando CADA DETALLE para garantizar que eres la persona correcta para formar parte de nuestro equipo. ¡Mereces este autocuidado! Con enfoque y solo algunos minutos en casa, estos 21 días serán el punto de giro para conquistar el cuerpo que deseas. ¡Tu fuerza es inspiradora y eres plenamente capaz de transformar tu rutina en resultados reales!`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || fallbackText;
  } catch (error) {
    console.error("Gemini Error:", error);
    return fallbackText;
  }
}
