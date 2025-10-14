// api/ai.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  // Pilih service berdasarkan isi pesan
  let service = "openai"; // default
  if (/gambar|image|photo/i.test(message)) service = "huggingface";
  else if (/buatkan kode|html|css|javascript|js|php|python/i.test(message)) service = "openai";
  else service = "gemini";

  try {
    let reply = "";
    let isImage = false;

    if (service === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: history.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }))
        })
      });
      const data = await response.json();
      reply = data.choices?.[0]?.message?.content || "⚠️ Tidak ada respons";

    } else if (service === "huggingface") {
      // default model text2image
      const model = /gambar|image|photo/i.test(message) ? "CompVis/stable-diffusion-v1-4" : "gpt2";
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: message })
      });
      const data = await response.json();
      if (data?.data?.[0]?.image || data?.generated_image) {
        reply = data.data[0].image || data.generated_image;
        isImage = true;
      } else reply = data.generated_text || "⚠️ Tidak ada respons";

    } else if (service === "gemini") {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: message }] }] })
      });
      const data = await response.json();
      reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Tidak ada respons";
    }

    return res.status(200).json({ reply, isImage });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ reply: "❌ Gagal memproses pesan", isImage: false });
  }
                                }
