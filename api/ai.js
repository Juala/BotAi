// api/ai.js
export async function callAI(msg, conversationHistory = []) {
  // Pilih service
  const selectService = (msg) => {
    if (/gambar|image|photo/i.test(msg)) return "huggingface";
    else if (/buatkan kode|html|css|javascript|js|php|python/i.test(msg)) return "openai";
    else return "gemini";
  };

  const getRandomKey = (keysArray) => keysArray[Math.floor(Math.random() * keysArray.length)];

  const service = selectService(msg);

  // Ambil key dari environment variables (Netlify)
  const OPENAI_KEYS = JSON.parse(process.env.OPENAI_KEYS || '[""]');
  const HUGGINGFACE_KEYS = JSON.parse(process.env.HUGGINGFACE_KEYS || '[""]');
  const GEMINI_KEYS = JSON.parse(process.env.GEMINI_KEYS || '[""]');

  const keyMap = {
    openai: OPENAI_KEYS,
    huggingface: HUGGINGFACE_KEYS,
    gemini: GEMINI_KEYS
  };

  const key = getRandomKey(keyMap[service]);

  let reply = "";
  let isImage = false;

  try {
    if (service === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${key}` 
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: conversationHistory.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }))
        })
      });
      const data = await res.json();
      reply = data.choices?.[0]?.message?.content || "⚠️ Tidak ada respons";
    } 
    else if (service === "huggingface") {
      const model = /gambar|image|photo/i.test(msg) ? "CompVis/stable-diffusion-v1-4" : "gpt2";
      const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${key}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ inputs: msg })
      });
      const data = await res.json();
      if (data?.data?.[0]?.image || data?.generated_image) {
        reply = data.data[0].image || data.generated_image;
        isImage = true;
      } else reply = data.generated_text || "⚠️ Tidak ada respons";
    } 
    else if (service === "gemini") {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents:[{ parts:[{ text: msg }] }] })
      });
      const data = await res.json();
      reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Tidak ada respons";
    }
  } catch(err) {
    console.error(err);
    reply = "❌ Gagal menghubungi AI.";
  }

  return { reply, isImage };
}
