require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.post('/openai', async (req, res) => {
    const prompt = req.body.prompt;

    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key is missing.' });
    }

    console.log('Received prompt:', prompt); // Log the received prompt

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('API response:', response.data); // Log the API response

        res.json({ response: response.data.choices[0].message.content });
    } catch (error) {
        console.error('Error communicating with OpenAI API:', error.message); // Log error details
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
