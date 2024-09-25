require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const { log } = require('console');
const maxmind = require('maxmind');
const session = require('express-session');

const app = express();
const PORT = 3001;
const CryptoJS = require('crypto-js');

const otps = {};
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const secretKey = 'fcvatgf76wyge8rwefhrgfveivsw8e97w@$?.woehnafc'; //to be more encrypted
// Create a new pool instance with your PostgreSQL configuration
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

app.use(session({
    secret: process.env.SESSION_SECRET, //env variable
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,  // Set to true for HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Function to decrypt the payload
function decryptPayload(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
}

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

app.use(express.static('images'));

// Define routes
app.get('/itinerary', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','itinerary', 'new.html'));
});

app.get('/histprompt', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','histprompt', 'hist.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname,'about', 'about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname,'contact', 'contact.html'));
});

app.post('/openai', async (req, res) => {
    //const prompt = req.body.prompt;

    // const bytes = CryptoJS.AES.decrypt(prompt, secretKey);
    // const decryptedPrompt = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    // console.log('Decrypted Prompt:', decryptedPrompt);


    // if (!process.env.OPENAI_API_KEY) {
    //     return res.status(500).json({ error: 'OpenAI API key is missing.' });
    // }

    // console.log('Received prompt:', prompt);

    // try {
    //     const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    //         model: "gpt-3.5-turbo",
    //         messages: [{ role: "user", content: decryptedPrompt }],
    //         temperature: 0.6,
    //         max_tokens: 3001,
    //         top_p: 0.9,
    //         frequency_penalty: 0,
    //         presence_penalty: 0,
    //     }, {
    //         headers: {
    //             'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    //             'Content-Type': 'application/json'
    //         }
    //     });

    //     let aiResponse = response.data.choices[0].message.content;
    //     console.log('Original API response:', aiResponse);

    //     res.json({ response: aiResponse });
    // } catch (error) {
    //     console.error('Error communicating with OpenAI API:', error.message);
    //     res.status(500).json({ error: 'An error occurred while processing your request.' });
    // }

    let aiResponse='chk';
    res.json({ response: aiResponse });
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
        service: process.env.DUMMY_GEN , // Or your email service provider
        auth: {
            user: process.env.DUMMY_EMAIL, // Replace with your email
            pass: process.env.DUMMY_PASSWORD, // Replace with your email password
        },
    });

    const mailOptions = {
        from: process.env.DUMMY_EMAIL,
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
                req.session.email = email; 
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
    
    const {  email, currency, expenseCap, residentvar, duration, companion, accommodation, style, interest, transport,travelto } = req.body;

    console.log('check2');
    

    const query = `
        INSERT INTO user_trip_details (email, currency, expense_cap, resident_var, duration, companion, accommodation, style, interest, transport,travelto)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11)
        RETURNING id;
    `;

    try {
        const result =  await pool.query(query, [email, currency, expenseCap, residentvar, duration, companion, accommodation, style, interest, transport,travelto]);
     
        const userTripId = result.rows[0].id; 

        req.session.userTripId = userTripId;
        res.status(200).send({ message: 'Trip data stored successfully!', userTripId });

    } catch (error) {
        console.error('Error storing trip data:', error);
        res.status(500).send({ message: 'Error storing trip data' });
    }
});

app.get('/getUserTripId', (req, res) => {
    if (req.session.userTripId) {
        res.status(200).json({ userTripId: req.session.userTripId });
    } else {
        res.status(404).json({ message: 'No userTripId found in session' });
    }
});

app.post('/storeItineraryData', async (req, res) => {
    const { userTripId, itineraryData,email } = req.body;  // Now expecting userTripId instead of email

    if (!userTripId) {
        return res.status(400).send({ message: 'userTripId is required to store itinerary data.' });
    }

    const query = `
        INSERT INTO trip_itinerary (user_trip_id, email,itinerary_data)
        VALUES ($1, $2, $3)
    `;

    try {
        await pool.query(query, [userTripId, email,itineraryData]);
        res.status(200).send({ message: 'Itinerary data stored successfully!' });
    } catch (error) {
        console.error('Error storing itinerary data:', error);
        res.status(500).send({ message: 'Error storing itinerary data' });
    }
});

// Refactored checkItinerary route using async/await
app.post('/checkItinerary', async (req, res) => {
    const { email } = req.body;  // Expecting userTripId instead of email

    if (!email) {
        return res.status(400).send({ message: 'email is required to check itinerary data.' });
    }

    const query = 'SELECT * FROM trip_itinerary WHERE email = $1';

    try {
        const result = await pool.query(query, [email]);

        if (result.rows.length > 0) {
            res.send({ hasItinerary: true });
        } else {
            res.send({ hasItinerary: false });
        }
    } catch (error) {
        console.error('Error checking itinerary data:', error);
        res.status(500).send({ message: 'Error checking itinerary data' });
    }
});

app.get('/getUserEmail', (req, res) => {
    if (req.session.email) {
        res.status(200).json({ email: req.session.email });
    } else {
        res.status(404).json({ message: 'No email found in session' });
    }
});

app.post('/getItineraries', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).send({ message: 'Email is required to fetch itineraries.' });
    }

    const query = 'SELECT itinerary_data FROM trip_itinerary WHERE email = $1';  // Assuming PostgreSQL-style parameterized queries

    try {
        const result = await pool.query(query, [email]);  // Use appropriate DB connection and query

        if (result.rows.length > 0) {
            res.status(200).json({ itineraries: result.rows });
        } else {
            res.status(404).json({ message: 'No itineraries found for this email.' });
        }
    } catch (error) {
        console.error('Error fetching itineraries:', error);
        res.status(500).json({ message: 'Error fetching itineraries' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
