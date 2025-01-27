require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

// Add this line to import node-fetch if you're using Node.js < 18
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.use(cors());
app.use(bodyParser.json());

// Helper function to validate API key
function validateApiKey(apiKey) {
    if (!apiKey) {
        throw new Error("API key is missing. Please check your environment variables.");
    }
    return apiKey;
}

app.post("/api/chat", async (req, res) => {
    try {
        const apiKey = validateApiKey(process.env.API_KEY);
        const userMessage = req.body.message;

        if (!userMessage) {
            return res.status(400).json({ error: "Message is required" });
        }

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
            const errorData = await response.text();
            console.error("API Error Response:", errorData);
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error("Unexpected API response format");
        }

        const botResponse = data.candidates[0].content.parts[0].text;
        res.json({ response: botResponse });

    } catch (error) {
        console.error("Detailed error:", error);
        res.status(500).json({ 
            error: "Internal Server Error", 
            message: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log("API Key present:", !!process.env.API_KEY);
});
