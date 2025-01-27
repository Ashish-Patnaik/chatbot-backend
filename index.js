require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 10000;

// Add this line for Node.js fetch support
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.use(cors());
app.use(bodyParser.json());

// Add a test route for the root URL
app.get("/", (req, res) => {
    res.json({ message: "Server is running!" });
});

// Add a test route for checking API key
app.get("/test", (req, res) => {
    res.json({ 
        message: "Test endpoint working",
        apiKeyPresent: !!process.env.API_KEY,
        apiKeyLength: process.env.API_KEY ? process.env.API_KEY.length : 0
    });
});

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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log("API Key present:", !!process.env.API_KEY);
    console.log("API Key length:", process.env.API_KEY ? process.env.API_KEY.length : 0);
});