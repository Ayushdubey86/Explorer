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

// const crypto = require('crypto'); // Make sure to import crypto


const app = express();
const PORT = 3001;
const CryptoJS = require('crypto-js');
const encryptionKey = process.env.CRYPTOloc;
const otps = {};
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
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

// app.use(express.static('images'));


app.get('/refresh', (req, res) => {
    // You can generate the key here or fetch it securely from a database or environment variable
    // You can make this dynamic or more secure
         
    res.json({ key: encryptionKey });
});

app.get('/trip',(req,res)=>{
   
    res.json({ key:encrypTrip });
})



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

// const crypto = require('crypto'); // Make sure to import crypto
// const axios = require('axios'); // Make sure axios is imported

app.post('/openai', async (req, res) => {
    const { prompt, iv } = req.body;

    console.log('Request received'); // Log when the request is received
    console.log('Prompt (encrypted):', prompt);
    console.log('IV (encrypted):', iv);

    const secretKey = 'fcvatgf76wyge8rwefhrgfveivsw8e97w@$?.=1-043248029834279562945.,/skxcknlcwoehnafc'; 
    
    // Function to decrypt the encrypted prompt
    function decryptPrompt(encryptedPrompt, iv, secretKey) {
        console.log('Decrypting prompt...');
        
        const encryptedData = Buffer.from(encryptedPrompt, 'base64');
        const ivBuffer = Buffer.from(iv, 'base64');
        const keyBuffer = crypto.createHash('sha256').update(secretKey).digest();
    
        console.log('Key Buffer:', keyBuffer);
        console.log('IV Buffer:', ivBuffer);
    
        // Separate the encrypted data and the authentication tag (last 16 bytes for AES-GCM)
        const authTagLength = 16;
        const authTag = encryptedData.slice(encryptedData.length - authTagLength); // Get the last 16 bytes as the auth tag
        const ciphertext = encryptedData.slice(0, encryptedData.length - authTagLength); // Get the rest as ciphertext
    
        const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, ivBuffer);
        decipher.setAuthTag(authTag); // Set the auth tag for AES-GCM mode
    
        let decrypted;
        try {
            decrypted = decipher.update(ciphertext, null, 'utf8');
            decrypted += decipher.final('utf8');
        } catch (error) {
            console.error('Error during decryption:', error.message);
            throw error;
        }
    
        console.log('Decrypted Prompt:', decrypted);
        return decrypted;
    }

    // Decrypt the prompt
    let decryptedPrompt;
    try {
        decryptedPrompt = decryptPrompt(prompt, iv, secretKey); // Use secretKey instead of secKey
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

    // const secver = 'fcvatgf76wyge8rwefhrgfveivsw8e97w@$?.woehnafc';

    // const emailDec = CryptoJS.AES.decrypt(email, secver);
    // const decryptedEmail = JSON.parse(emailDec.toString(CryptoJS.enc.Utf8));

    // const emailPass = CryptoJS.AES.decrypt(password, secver);
    // const emailPassw = JSON.parse(emailPass.toString(CryptoJS.enc.Utf8));

    // const decOtp = CryptoJS.AES.decrypt(otp, secver);
    // const decOtpFin = JSON.parse(decOtp.toString(CryptoJS.enc.Utf8));


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
            service: 'smtp.outlook.com',//process.env.DUMMY_GEN, // Or your email service provider
            port: 587,
         //   secure: true,
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

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // const secKey = 'fcvatgf76wyge8rwefhrgfveivsw8e97w@$?.woehnafc';
    
    // // Decrypt the email and password
    // const decryptedEmailBytes = CryptoJS.AES.decrypt(email, secKey);
    // const decryptedEmail = decryptedEmailBytes.toString(CryptoJS.enc.Utf8);

    // const decryptedPasswordBytes = CryptoJS.AES.decrypt(password, secKey);
    // const decryptedPassword = decryptedPasswordBytes.toString(CryptoJS.enc.Utf8);
    
    
    try {

        // const decryptedEmailBytes = CryptoJS.AES.decrypt(email, secKey);
        // const decryptedEmail = decryptedEmailBytes.toString(CryptoJS.enc.Utf8);
    
        // const decryptedPasswordBytes = CryptoJS.AES.decrypt(password, secKey);
        // const decryptedPassword = decryptedPasswordBytes.toString(CryptoJS.enc.Utf8);
        
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
    // else {
    //     res.status(404).json({ message: 'No userTripId found in session' });
    // }
});

app.post('/storeItineraryData', async (req, res) => {
    const { userTripId, itineraryData,email } = req.body;  // Now expecting userTripId instead of email

    // if (!userTripId) {
    //     return res.status(400).send({ message: 'userTripId is required to store itinerary data.' });
    // }

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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
