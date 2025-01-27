require("dotenv").config(); // Import dotenv to handle environment variables
const express = require("express"); // Import Express to create the server
const bodyParser = require("body-parser"); // Import Body Parser to handle JSON
const cors = require("cors"); // Import CORS to allow requests from the frontend

const app = express(); // Create an Express app
const PORT = process.env.PORT || 3000; // Set the port for the server

// Middleware: Allow CORS, parse JSON bodies
app.use(cors());
app.use(bodyParser.json());

// API endpoint for handling chatbot requests
app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.API_KEY; // Get API key from environment variables
  const userMessage = req.body.message; // Get the user's message from the request body

  try {
    // Call the Gemini API with the user's message
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: userMessage,
                },
              ],
            },
          ],
        }),
      }
    );

    // If the Gemini API response is not successful, throw an error
    if (!response.ok) {
      throw new Error("Failed to fetch response from Gemini API.");
    }

    // Parse the response from the Gemini API
    const data = await response.json();
    const botResponse = data.candidates[0].content.parts[0].text;

    // Send the chatbot's response back to the frontend
    res.json({ response: botResponse });
  } catch (error) {
    // If there's an error, log it and return an error message
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
