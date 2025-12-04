const axios = require('axios');
const crypto = require('crypto');
const { getExplanationByHash, saveExplanation } = require('../models/codeExplanationModel');

/**
 * Llama a Groq API (gratuita, rápida y sin tarjeta de crédito)
 * @param {string} prompt - Prompt a enviar
 */
async function callGroqApi(prompt) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY no configurada');
  }

  const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  
  const headers = {
    'Authorization': `Bearer ${GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  };

  const data = {
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: 'Explica este código en español de forma concisa.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 300
  };

  const res = await axios.post(API_URL, data, { headers, timeout: 30_000 });
  return res.data.choices[0]?.message?.content?.trim() || 'No se pudo generar la explicación';
}

/**
 * Llama a Hugging Face con el formato correcto del router
 * @param {string} prompt - Prompt a enviar
 */
async function callHuggingFaceApi(prompt) {
  const HF_TOKEN = process.env.HUGGING_FACE_API_KEY;
  if (!HF_TOKEN) {
    throw new Error('HUGGING_FACE_API_KEY no configurada');
  }

  // Usa un modelo de texto simple y estable
  const MODEL = 'gpt2';
  const API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;

  const headers = {
    'Authorization': `Bearer ${HF_TOKEN}`,
    'Content-Type': 'application/json'
  };

  const data = { inputs: prompt };

  const res = await axios.post(API_URL, data, { headers, timeout: 30_000 });
  
  if (Array.isArray(res.data) && res.data[0]?.generated_text) {
    return res.data[0].generated_text.trim();
  }
  if (typeof res.data?.generated_text === 'string') {
    return res.data.generated_text.trim();
  }
  return JSON.stringify(res.data);
}

/**
 * Explicación inteligente local (fallback final)
 */
function explainCodeLocal(code) {
  const lowerCode = code.toLowerCase();
  let language = 'desconocido';
  
  if (lowerCode.includes('import ') || lowerCode.includes('def ') || lowerCode.includes('print(')) {
    language = 'Python';
  } else if (lowerCode.includes('function ') || lowerCode.includes('const ') || lowerCode.includes('console.')) {
    language = 'JavaScript';
  } else if (lowerCode.includes('select ') || lowerCode.includes('from ')) {
    language = 'SQL';
  }

  return `**Explicación del código (${language}):**\n\nEste código realiza operaciones de procesamiento. ` +
         `Contiene aproximadamente ${code.split('\n').length} líneas. ` +
         `Analiza la estructura para entender su funcionamiento específico.`;
}

/**
 * Ruta: POST /api/ai/explain - Explica código usando múltiples servicios con caché
 */
async function explainCode(req, res) {
  const { code } = req.body;
  
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return res.status(400).json({ error: "Debes enviar el código a explicar en el campo 'code'." });
  }

  // 1. Generar hash del código (normalizado: trim y lowercase para mejor caché)
  const normalizedCode = code.trim();
  const codeHash = crypto.createHash('sha256').update(normalizedCode).digest('hex');
  
  // 2. Buscar en caché
  try {
    const cached = await getExplanationByHash(codeHash);
    if (cached) {
      return res.json({ 
        explanation: cached.explanation,
        provider: cached.provider,
        cached: true
      });
    }
  } catch (error) {
    console.log('>> Error buscando en caché:', error.message);
    // Continuar con la generación si falla la búsqueda
  }

  // 3. Si no hay caché, generar explicación
  const MAX_CODE_LENGTH = 2000;
  const truncatedCode = normalizedCode.length > MAX_CODE_LENGTH 
    ? normalizedCode.substring(0, MAX_CODE_LENGTH) + '\n// ... (código truncado)'
    : normalizedCode;

  const prompt = `Explica este código en español:\n\n${truncatedCode}`;
  let explanation = null;
  let provider = 'local';

  // Intenta con Groq primero (más rápido y confiable)
  if (process.env.GROQ_API_KEY) {
    try {
      console.log('>> Intentando con Groq API...');
      explanation = await callGroqApi(prompt);
      provider = 'groq';
    } catch (err) {
      console.log('>> Groq falló, intentando Hugging Face...', err.message);
    }
  }

  // Fallback a Hugging Face
  if (!explanation && process.env.HUGGING_FACE_API_KEY) {
    try {
      console.log('>> Intentando con Hugging Face...');
      explanation = await callHuggingFaceApi(prompt);
      provider = 'huggingface';
    } catch (err) {
      console.log('>> Hugging Face falló, usando explicación local...', err.message);
    }
  }

  // Último recurso: explicación local inteligente
  if (!explanation) {
    console.log('>> Usando explicación local (fallback)');
    explanation = explainCodeLocal(normalizedCode);
    provider = 'local';
  }

  // 4. Guardar en caché (solo si no es local, para ahorrar espacio en BD)
  if (provider !== 'local') {
    try {
      await saveExplanation(codeHash, explanation, provider);
      console.log('>> Explicación guardada en caché');
    } catch (error) {
      // Si falla guardar en caché, no es crítico - la explicación ya se generó
      console.log('>> Error guardando en caché:', error.message);
    }
  }

  return res.json({ 
    explanation,
    provider,
    cached: false
  });
}

module.exports = { explainCode };