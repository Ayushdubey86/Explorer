require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const { log } = require('console');

const app = express();
const PORT = 3001;

const otps = {};

// Create a new pool instance with your PostgreSQL configuration
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

// Test the PostgreSQL connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to PostgreSQL', err.stack);
    } else {
        console.log('Connected to PostgreSQL');
    }
    release();
});

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.get('/itinerary', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'itinerary', 'itinerary.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about', 'about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact', 'contact.html'));
});

app.post('/openai', async (req, res) => {
    const prompt = req.body.prompt;

    if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key is missing.' });
    }

    console.log('Received prompt:', prompt);

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.6,
            max_tokens: 3001,
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
        console.log('Original API response:', aiResponse);

        // Inflate transport, accommodation, and activities costs by 1.5 times
        // aiResponse = aiResponse.replace(/\b(transport|accommodation|activities)\s+costs?\s+\d+(?:\.\d+)?\b/gi, match => {
        //     const parts = match.split(' ');
        //     const originalValue = parseFloat(parts.pop());
        //     const inflatedValue = (originalValue * 1.5).toFixed(2);
        //     return `${parts.join(' ')} ${inflatedValue}`;
        // });

        // console.log('Inflated API response:', aiResponse);

        res.json({ response: aiResponse });
    } catch (error) {
        console.error('Error communicating with OpenAI API:', error.message);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});


// Example route to fetch data from PostgreSQL
app.get('/data', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users'); // Replace with your query
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching data from PostgreSQL', error.stack);
        res.status(500).json({ error: 'An error occurred while fetching data.' });
    }
});

app.post('/verify-otp', async (req, res) => {
    const { email, otp, password } = req.body;

    // Debugging logs
    console.log('Email:', email);
    console.log('PASSWORD:', password); // This should output the password
    console.log('Entered OTP:', otp);
    console.log('Stored OTP:', otps[email]?.otp);
    console.log('OTP Expiry Time:', otps[email]?.expiresAt);
    console.log('Current Time:', Date.now());

       // Check if password is missing
       if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }

    // // Check if OTP exists for the email and matches the entered OTP
    // if (!otps[email] || otps[email].otp !== otp) {
    //     return res.status(400).json({ message: 'Invalid or expired OTP' });
    // }

    // // Check if the OTP has expired
    // if (Date.now() > otps[email].expiresAt) {
    //     // If expired, remove the OTP and return an error
    //     delete otps[email];
    //     return res.status(400).json({ message: 'Invalid or expired OTP time' });
    // }

    // // OTP is valid and not expired
    // delete otps[email]; // Optionally delete OTP after successful verification
    // return res.status(200).json({ message: 'OTP verified successfully' });

    try {
        // Insert email and plain password into the database
        console.log('inside try');
        
        const insertQuery = 'INSERT INTO users (email, password) VALUES ($1, $2)';
        console.log('after insert query', insertQuery);
        
        await pool.query(insertQuery, [email, password]);

        // Clean up the stored OTP for this email
        delete otps[email];

        // Send a success response
        return res.status(200).json({ message: 'OTP verified and user registered successfully' });
    } catch (error) {
        console.error('Error saving user:', error.stack);
        return res.status(500).json({ message: 'An error occurred while saving the user' });
    }



});

app.post('/register', (req, res) => {
    const { email, password } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry time (5 minutes)
    otps[email] = { otp, expiresAt: Date.now() + 300000 };

    // Send OTP via email
    const transporter = nodemailer.createTransport({
        service: 'outlook', // Or your email service provider
        auth: {
            user: 'sam38sam@outlook.in', // Replace with your email
            pass: 'Anisha01', // Replace with your email password
        },
    });

    const mailOptions = {
        from: 'sam38sam@outlook.in',
        to: email,
        subject: 'Your OTP for Registration',
        text: `Your OTP is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ message: 'Failed to send OTP', error });
        }
        res.status(200).json({ message: 'OTP sent to email' });
    });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    
    try {
        // Query the user by email from the database
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length > 0) {
            const user = result.rows[0];

            // Compare the provided password with the password stored in the database (plain text)
            if (password === user.password) {
                // Password matches
                return res.status(200).json({ message: 'Login successful' });
            } else {
                // Password does not match
                return res.status(401).json({ message: 'Wrong email or password' });
            }
        } else {
            // User not found
            return res.status(404).json({ message: 'Wrong email or password' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/storeTripData', async (req, res) => {

    console.log('check');
    
    const { email, currency, expenseCap, residentvar, duration, companion, accommodation, style, interest, transport } = req.body;

    console.log('check2');
    

    const query = `
        INSERT INTO user_trip_details (email, currency, expense_cap, resident_var, duration, companion, accommodation, style, interest, transport)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    try {
        await pool.query(query, [email, currency, expenseCap, residentvar, duration, companion, accommodation, style, interest, transport]);
        res.status(200).send({ message: 'Trip data stored successfully!' });
    } catch (error) {
        console.error('Error storing trip data:', error);
        res.status(500).send({ message: 'Error storing trip data' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
