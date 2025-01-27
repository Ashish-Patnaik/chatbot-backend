// index.js (Backend)
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 10000;  // Changed to match Render's port

// Add this line for Node.js fetch support
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.use(cors({
    origin: '*',  // Be more specific in production
    methods: ['POST', 'GET'],
    credentials: true
}));
app.use(bodyParser.json());

app.post("/api/chat", async (req, res) => {
    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("API key is missing");
            return res.status(500).json({ error: "API key configuration error" });
        }

        const userMessage = req.body.message;
        if (!userMessage) {
            return res.status(400).json({ error: "Message is required" });
        }

        console.log("Attempting API call with message:", userMessage);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: userMessage,
                        }],
                    }],
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API error:", errorText);
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Received API response:", data);

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error("Invalid API response format");
        }

        res.json({ response: data.candidates[0].content.parts[0].text });

    } catch (error) {
        console.error("Detailed error:", error);
        res.status(500).json({ 
            error: "Server Error", 
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Add a test endpoint
app.get("/api/test", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log("API Key present:", !!process.env.API_KEY);
    console.log("API Key length:", process.env.API_KEY ? process.env.API_KEY.length : 0);
});

// script.js (Frontend)
async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const chatbox = document.getElementById('chatbox');
    const message = userInput.value.trim();

    if (!message) return;

    // Add user message to chat
    appendMessage('User', message);
    userInput.value = '';

    try {
        const response = await fetch('YOUR_RENDER_BACKEND_URL/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Error details:', errorData);
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        appendMessage('AI', data.response);

    } catch (error) {
        console.error('Error fetching response from backend:', error);
        appendMessage('System', 'Sorry, there was an error processing your request. Please try again.');
    }
}

function appendMessage(sender, message) {
    const chatbox = document.getElementById('chatbox');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender.toLowerCase()}-message`;
    messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatbox.appendChild(messageDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
}
