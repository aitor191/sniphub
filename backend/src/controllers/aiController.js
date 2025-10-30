const axios = require('axios');

/**
 * Llama a Hugging Face para generar o explicar código mediante un modelo instruccional.
 * @param {string} prompt - Mensaje a enviar al modelo.
 */
async function callHuggingFaceApi(prompt) {
  const HF_TOKEN = process.env.HUGGING_FACE_API_KEY;
  const MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';
  const API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;

  // Configura cabeceras seguras (token de API gratuita de Hugging Face)
  const headers = {
    Authorization: `Bearer ${HF_TOKEN}`,
    'Content-Type': 'application/json'
  };

  const data = { inputs: prompt, options: { wait_for_model: true } };

  // Llama a la API de Hugging Face
  const res = await axios.post(API_URL, data, { headers, timeout: 60_000 });
  // Hugging Face responde con [{ generated_text: ... }]
  if (Array.isArray(res.data) && res.data[0]?.generated_text)
    return res.data[0].generated_text.trim();

  // Algunos modelos devuelven en "generated_text" suelto
  if (typeof res.data?.generated_text === 'string')
    return res.data.generated_text.trim();

  // Otros devuelven solo string (fallback)
  if (typeof res.data === 'string')
    return res.data.trim();

  throw new Error('Respuesta inesperada de Hugging Face');
}

/**
 * Ruta: POST /api/ai/generate - Genera código o texto usando IA.
 * Ejemplo de prompt: "Genera un snippet en Python que lea un archivo CSV"
 */
async function generateCode(req, res) {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string')
    return res.status(400).json({ error: "Debes enviar un prompt de tipo texto." });

  try {
    const output = await callHuggingFaceApi(prompt);
    return res.json({ result: output });
  } catch (err) {
    console.error('Error Hugging Face:', err.message);
    return res.status(502).json({ error: "La IA no está disponible. Inténtalo más tarde." });
  }
}

/**
 * Ruta: POST /api/ai/explain - Explica un fragmento de código pasado en el body.
 * Ejemplo de uso: { "code": "for i in range(10): print(i)" }
 */
async function explainCode(req, res) {
  const { code } = req.body;
  if (!code || typeof code !== 'string')
    return res.status(400).json({ error: "Debes enviar el código a explicar." });

  // Prompt específico para explicación
  const prompt = `Explica brevemente el siguiente código en español:\n---\n${code}\n---`;

  try {
    const output = await callHuggingFaceApi(prompt);
    return res.json({ explanation: output });
  } catch (err) {
    console.error('Error Hugging Face:', err.message);
    return res.status(502).json({ error: "La IA no está disponible. Inténtalo más tarde." });
  }
}

module.exports = { generateCode, explainCode };