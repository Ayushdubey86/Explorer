require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const { log } = require('console');
const maxmind = require('maxmind');
const session = require('express-session');
const crypto = require('crypto');  // Node.js built-in module
const jwt = require('jsonwebtoken');
const { console } = require('inspector');

//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// const crypto = require('crypto'); // Make sure to import crypto


const app = express();
const PORT = 3002;
const encryptionKey = process.env.CRYPTOloc;
const otps = {};
const secretKey = process.env.CRYPTOJSP; //to be more encrypted
const encrypTrip = process.env.CRYPTOloc;
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

// app.use(express.static('images'));




// Define routes
app.get('/itinerary', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','itinerary', 'new.html'));
});

app.get('/histprompt', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','histprompt', 'hist.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname,'public', 'about','about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname,'public','contact', 'contact.html'));
});

app.get('/visa', (req, res) => {
    res.sendFile(path.join(__dirname,'visa', 'visa.html'));
});


app.post('/openai', async (req, res) => {
    const encryptedPrompt = req.body.prompt;
    let decryptedPrompt;
    try {
        decryptedPrompt = customDecrypt(encryptedPrompt);
        console.log("Decrypted prompt:", decryptedPrompt);

    } catch (error) {
        console.error('Decryption failed:', error.message);
        return res.status(500).json({ error: 'Decryption failed.' });
    }

    if (!process.env.OPENAI_API_KEY) {
        console.error('OpenAI API key is missing.'); // Log if API key is missing
        return res.status(500).json({ error: 'OpenAI API key is missing.' });
    }

    console.log('Received prompt after decryption:', decryptedPrompt); // Log the decrypted prompt after decryption

    try {
        console.log('Sending request to OpenAI API...'); // Log when making the API request
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: decryptedPrompt }],
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

        console.log('Response from OpenAI API:', response.data); // Log the raw response from OpenAI API

        let aiResponse = response.data.choices[0].message.content;

        console.log('AI Response:', aiResponse); // Log the AI's actual response content

        res.json({ response: aiResponse });
    } catch (error) {
        console.error('Error communicating with OpenAI API:', error.message); // Log any errors during the API call
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

app.post('/verify-otp', async (req, res) => {
    const { email, otp, password } = req.body;

    try {


        // Debugging logs
        console.log('Email:', email);
        console.log('Password:', password); 
        console.log('OTP:', otp); 
        console.log('Current Time:', Date.now());

        // Check if the password is missing
        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        // OTP verification logic can go here (check stored OTP against decryptedOtp)

        // Insert decrypted email and password into the database
        const insertQuery = 'INSERT INTO users (email, password) VALUES ($1, $2)';
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
    try {
        // Log incoming request body
        console.log('Received request:', req.body);

        const { email, password } = req.body;

        // Ensure both email and password are present
        if (!email || !password) {
            console.error('Missing email or password');
            return res.status(400).json({ message: 'Email and password are required' });
        }

        console.log('Email:', email);
        console.log('Password:', password); // Be careful logging passwords in production!

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Log OTP generation
        console.log('Generated OTP:', otp);

        // Store OTP with expiry time (5 minutes)
        otps[email] = { otp, expiresAt: Date.now() + 300000 };
        console.log('OTP stored for email:', email);

        // Log transporter setup
        console.log('Setting up email transporter...');
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.DUMMY_EMAIL,
                pass: process.env.DUMMY_PASSWORD,
            },
            connectionTimeout: 10000, // 10 seconds
        });

        const mailOptions = {
            from: process.env.DUMMY_EMAIL,
            to: email,
            subject: 'Your OTP for Registration',
            text: `Your OTP is: ${otp}`,
        };

        // Log mail options before sending
        console.log('Mail options:', mailOptions);

        // Send email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error.message);
                if (error.code === 'ETIMEDOUT') {
                    // Retry logic here
                    console.log('Retrying to send email...');
                    // You can reattempt the sendMail or use an exponential backoff strategy
                }
                return res.status(500).json({ message: 'Failed to send OTP', error });
            }

            // Log success response from nodemailer
            console.log('Email sent successfully:', info.response);
            res.status(200).json({ message: 'OTP sent to email' });
        });
    } catch (error) {
        // Log any unexpected errors
        console.error('Unexpected error occurred:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
});


// Route to handle form submission
app.post('/send-email', async (req, res) => {
    const { email, name, phone, query } = req.body;

  

    // Insert data into database
    try {
        const insertQuery = `
            INSERT INTO inquiries (email, name, phone, query)
            VALUES ($1, $2, $3, $4) RETURNING id
        `;
        const values = [email, name, phone, query];
        const result = await pool.query(insertQuery, values);
        const insertedId = result.rows[0].id;

        console.log('Inserted inquiry ID:', insertedId);

        // // Configure the email transporter
        // const transporter = nodemailer.createTransport({
        //     service: 'smtp.outlook.com',
        //     port: 587,
        //     auth: {
        //         user: process.env.EMAIL_USER,
        //         pass: process.env.EMAIL_PASS
        //     }
        // });

        // const mailOptions = {
        //     from: process.env.EMAIL_USER,
        //     to: process.env.EMAIL_USER, // Send to yourself
        //     subject: 'New Inquiry Received',
        //     text: `You have received a new inquiry:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nQuery: ${query}`
        // };

        // // Send email
        // transporter.sendMail(mailOptions, (error, info) => {
        //     if (error) {
        //         console.error('Error sending email:', error.message);
        //         return res.status(500).json({ message: 'Failed to send email', error });
        //     }
        //     console.log('Email sent successfully:', info.response);
        //     res.status(200).json({ message: 'Email sent successfully' });
        // });
    } catch (error) {
        console.error('Database or email error:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
});



function customDecrypt(data) {
    let shifted = '';
    for (let i = 0; i < data.length; i++) {
        shifted += String.fromCharCode(data.charCodeAt(i) - 5); // Shift characters back by 5
    }
    let decrypted = Buffer.from(shifted, 'base64').toString('utf-8'); // Base64 decoding
    return decrypted;
}

function customDecryptPrompt(data) {
    let unshifted = '';
    // Shift characters back by 5
    for (let i = 0; i < data.length; i++) {
        unshifted += String.fromCharCode(data.charCodeAt(i) - 5);
    }
    // Base64 decode
    let decrypted = atob(unshifted);
    return decrypted;
}


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {

        const decryptedEmail = customDecrypt(email);
        const decryptedPassword = customDecrypt(password);

        
        // Query the user by email from the database
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [decryptedEmail]);

        if (result.rows.length > 0) {
            const user = result.rows[0];

            // Compare the provided password with the password stored in the database (plain text)
            if (decryptedPassword  === user.password) {
                // Password matches
                req.session.email = decryptedEmail; 
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
        INSERT INTO user_trip_details (email, currency, expense_cap, resident_var, duration, companion, accommodation, style, interest, transport,travel_to)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11)
        RETURNING id;
    `;

    try {
        const result =  await pool.query(query, [email, currency, expenseCap, residentvar, duration, companion, accommodation, style, interest, transport,travelto]);
     
        const userTripId = result.rows[0].id; 
        console.log('usertrip',userTripId);
        

        req.session.userTripId = userTripId;
        res.status(200).send({ message: 'Trip data stored successfully!', userTripId });

    } catch (error) {
        console.error('Error storing trip data:', error);
        res.status(500).send({ message: 'Error storing trip data' });
    }
});

app.get('/getUserTripId', (req, res) => {
   // console.log(req.session);
   console.log('check session');
   
    
    console.log('req.session', req.session);
    
    if (req.session.userTripId) {
        res.status(200).json({ userTripId: req.session.userTripId });
    } 
  
});

app.post('/storeItineraryData', async (req, res) => {
    const { itineraryData, email } = req.body;  // Now expecting userTripId instead of email

    // Logging the incoming request data
    console.log("Request body:", req.body);

    const query = `
        INSERT INTO trip_itinerary (email, itinerary_data)
        VALUES ($1, $2)
    `;

    try {
        // Checking values before inserting
        console.log("Email:", email);
        console.log("Itinerary Data:", itineraryData);

        await pool.query(query, [email, itineraryData]);

        console.log("Data inserted successfully");
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

// GET /getUserEmail - Check if email is stored in the session and return it
app.get('/getUserEmail', (req, res) => {
    const email = req.session.email; // Get the email from the session

    if (email) {
        res.status(200).json({ email });
    } else {
        res.status(404).json({ message: 'No email found in session' });
    }
});


app.post('/passOn', (req, res) => {
    const { email } = req.body;

    if (email) {
        // Store email in the session
        req.session.email = email;
        console.log('Email stored in session:', email);
        return res.status(200).json({ message: 'Email stored successfully' });
    } else {
        return res.status(400).json({ message: 'Email not provided' });
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

app.post('/visaHelp', async (req,res)=>{
    const prompt = req.body.prompt;
    // if (!process.env.OPENAI_API_KEY) {
    //         return res.status(500).json({ error: 'OpenAI API key is missing.' });
    //     }

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

        res.json({ response: aiResponse });
    } catch (error) {
        console.error('Error communicating with OpenAI API:', error.message);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
})

app.post('/auth-google', async (req, res) => {
    const { email, name } = req.body;

    try {
        // Step 1: Query the user by email from the database
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length > 0) {
            // Step 2: If user is found, check if the provided name matches the password field
            const user = result.rows[0];

            if (name === user.password) {  // Name is being checked against the password field
                // Name matches, login successful
                req.session.email = email;  // Save email in session
                return res.status(200).json({ message: 'Login successful' });
            } else {
                // Name does not match
                return res.status(401).json({ message: 'Wrong email or password' });
            }
        } else {
            // Step 3: If no user is found, create a new user
            console.log('No user found. Registering new user.');

            const insertQuery = 'INSERT INTO users (email, password) VALUES ($1, $2)';
            await pool.query(insertQuery, [email, name]);  // Insert email and name (as password)

            // After successful registration, log the user in
            req.session.email = email;  // Save email in session
            return res.status(201).json({ message: 'User registered and login successful' });
        }
    } catch (error) {
        console.error('Error during authentication:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


//Start the server

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
