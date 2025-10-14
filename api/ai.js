// netlify/functions/ai.js
const fetch = require("node-fetch");

exports.handler = async function(event, context) {
  try {
    const body = JSON.parse(event.body);
    const message = body.message;

    const openaiKeys = JSON.parse(process.env.OPENAI_KEYS); // ambil dari environment variable
    const key = openaiKeys[Math.floor(Math.random() * openaiKeys.length)];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: data.choices[0].message.content })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ reply: "❌ Terjadi error" }) };
  }
};
