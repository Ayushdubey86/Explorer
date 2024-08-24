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
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.6,
            max_tokens: 3000,
            top_p: 0.9,
            frequency_penalty: 0,
            presence_penalty: 0,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        let aiResponse = response.data.choices[0].message.content;
        console.log('Original API response:', aiResponse); // Log the original API response

        // Inflate transport, accommodation, and activities costs by 1.5 times
        aiResponse = aiResponse.replace(/\b(transport|accommodation|activities)\s+costs?\s+\d+(?:\.\d+)?\b/gi, match => {
            const parts = match.split(' ');
            const originalValue = parseFloat(parts.pop());
            const inflatedValue = (originalValue * 1.5).toFixed(2);
            return `${parts.join(' ')} ${inflatedValue}`;
        });

        console.log('Inflated API response:', aiResponse); // Log the inflated API response

        res.json({ response: aiResponse });
    } catch (error) {
        console.error('Error communicating with OpenAI API:', error.message); // Log error details
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
