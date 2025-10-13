const API_KEY = "AIzaSyC310duBltZgbkMMfqRoAn6qVELo7x2slI";
let conversationHistory = [];

const textarea = document.getElementById("user-input");
textarea.addEventListener("input", () => {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
});

function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, "user");
  conversationHistory.push({ role: "user", text: message });
  input.value = "";
  input.style.height = "auto";

  showTypingIndicator();
  fetchResponse();
}

function addMessage(text, sender, isTyping = false) {
  const msg = document.createElement("div");
  msg.className = "message " + sender;
  if (isTyping) msg.classList.add("typing");

  const content = document.createElement("div");
  content.innerText = text;

  if (sender === "bot" && !isTyping) {
    content.classList.add("editable");
    content.onclick = () => makeEditable(content);
  }

  msg.appendChild(content);

  if (sender === "bot" && !isTyping) {
    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.innerText = "Copy";
    copyBtn.onclick = function () {
      navigator.clipboard.writeText(content.innerText).then(() => {
        copyBtn.innerText = "Disalin!";
        setTimeout(() => copyBtn.innerText = "Copy", 2000);
      });
    };
    msg.appendChild(copyBtn);
  }

  document.getElementById("chat-box").appendChild(msg);
  document.getElementById("chat-box").scrollTop = document.getElementById("chat-box").scrollHeight;
  return content;
}

function makeEditable(msgDiv) {
  msgDiv.contentEditable = true;
  msgDiv.focus();
  msgDiv.addEventListener("blur", () => {
    msgDiv.contentEditable = false;
    const idx = Array.from(document.querySelectorAll(".message.bot")).indexOf(msgDiv.parentElement);
    if(idx >= 0) conversationHistory[idx].text = msgDiv.innerText;
  });
}

function showTypingIndicator() {
  removeTypingIndicator();
  addMessage("🤖 Sedang mengetik...", "bot", true);
}

function removeTypingIndicator() {
  const existing = document.querySelector(".message.typing");
  if (existing) existing.remove();
}

function getAIMode() {
  return document.getElementById("mode-select").value;
}

// Speech recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'id-ID';
recognition.continuous = false;
recognition.interimResults = false;

function startRecognition() {
  recognition.start();
}

recognition.onresult = function(event) {
  const transcript = event.results[0][0].transcript;
  textarea.value = transcript;
  textarea.dispatchEvent(new Event("input"));
};

recognition.onerror = function(event) {
  console.error("Speech recognition error", event.error);
  alert("Gagal mengenali suara. Coba lagi.");
};

// Upload file & OCR
document.getElementById("upload-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if(!file) return;

  if(file.type.startsWith("image/")){
    const worker = Tesseract.createWorker();
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(file);
    addMessage(`Teks dari gambar:\n${text}`, "bot");
    await worker.terminate();
  } else {
    addMessage(`File ${file.name} berhasil diupload!`, "bot");
  }
});

// Export chat
function exportChat() {
  if (conversationHistory.length === 0) {
    alert("Belum ada percakapan untuk diekspor.");
    return;
  }

  const lines = conversationHistory.map(entry => {
    const sender = entry.role === "user" ? "🧑 Kamu" : "🤖 Roja AI";
    return `${sender}:\n${entry.text}\n`;
  });

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "riwayat-chat-roja-ai.txt";
  a.click();
  URL.revokeObjectURL(url);
}

// Fetch AI response (placeholder)
async function fetchResponse() {
  removeTypingIndicator();
  const mode = getAIMode();
  let reply = `(Mode: ${mode}) Ini jawaban simulasi AI berdasarkan konteks percakapan sebelumnya.`;
  conversationHistory.push({ role: "model", text: reply });
  typeReply(reply);
}

function typeReply(text) {
  const contentDiv = addMessage("", "bot");
  let i = 0;
  const typingSpeed = 20;

  function typeChar() {
    if (i < text.length) {
      contentDiv.innerText += text.charAt(i);
      i++;
      setTimeout(typeChar, typingSpeed);
    }
  }

  typeChar();
        }
  
