document.getElementById('submit-button').addEventListener('click', async function () {
    // Open the new window immediately
    const newWindow = window.open('/itinerary.html', '_blank');

    if (!newWindow) {
        console.error("Failed to open new window. It may have been blocked by a popup blocker.");
        return; // Exit if the window failed to open
    }

    // Retrieve the input values
    const residentvar = document.getElementById('resident').value || 'anywhere in world';
    const expenseCap = parseFloat(document.getElementById('expense-cap').value) || 10000;
    const currency = document.getElementById('currency').value || 'USD';
    const duration = document.getElementById('duration').value || 'not specified';
    const companion = document.getElementById('companion').value || 'Alone';
    const accommodation = document.getElementById('accommodation').value || 'not specified';
    const style = document.getElementById('style').value || 'not specified';
    const interest = document.getElementById('interest').value || 'not specified';
    const transport = document.getElementById('transport').value || 'not specified';

    // Function to check if the budget is great
    function hasGreatBudget(expenseCap, currency) {
        // Define what constitutes a great budget in USD as an example
        const budgetInUSD = (currency === 'USD') ? expenseCap : convertCurrencyToUSD(expenseCap, currency);
        return budgetInUSD > 10000;
    }

    // Dummy function to convert other currencies to USD
    function convertCurrencyToUSD(amount, currency) {
        // Conversion rates can be adjusted as needed
        const conversionRates = {
            'EUR': 1.1, 
            'INR': 0.012 ,
            'GBP': 1.322,
            'JPY': 0.069
        };
        return amount * (conversionRates[currency] || 1);
    }

    // Function to create the base prompt
    function createBasePrompt() {
        return `
            I am a resident of ${residentvar},
            I have ${expenseCap} ${currency} to spend and ${duration} days for a trip. 
            I prefer to travel with ${companion}, stay in ${accommodation}, 
            and enjoy ${style} travel style. I'm interested in ${interest}, 
            and I prefer ${transport} for transportation.
            Can you suggest an itinerary with multiple places I can explore based on these preferences, anywhere in the world? 
        `;
    }



    // Function to adjust the prompt based on budget
    function adjustPromptForBudget(prompt) {
        if (!hasGreatBudget(expenseCap, currency)) {
            return prompt + ' Please include only hidden gems, avoiding famous places.';
        }
        return prompt + ' Include famous places as well as hidden gems in the itinerary.';
    }

    // Function to include transportation costs in the budget
    function includeTransportCosts(prompt) {
        return prompt + ' Ensure that transportation costs are included in the budget.';
    }

    // Construct the final prompt
    let prompt = createBasePrompt();
    prompt = adjustPromptForBudget(prompt);
    prompt = includeTransportCosts(prompt);

    try {
        // Fetch response from OpenAI API
        const response = await fetch('http://localhost:3001/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: prompt })
        });

        const data = await response.json();
        loader.style.display = 'none';

        // Send the response to the new window
        if (newWindow) {
            newWindow.postMessage(data.response, '*');
        }
    } catch (error) {
        console.error('Error fetching the itinerary:', error);
        if (newWindow) {
            newWindow.close(); // Close the window if there was an error
        }
    }

    // Log the values to the console
    console.log({ expenseCap, currency, duration, companion, accommodation, style, interest, transport });
});

const slides = document.querySelectorAll('.slide');
let currentSlide = 0;
let videosLoaded = 0;
const totalVideos = slides.length;

const videoSources = [
    'images/lofoten cliff.mp4',
    'images/maderia sea.mp4',
    'images/mountain biking.mp4',
    'images/alps speed.mp4',
    'images/drone river.mp4',
    'images/shark swimy.mp4',  
    'images/japan house.mp4'
];

// Preload all videos
function preloadVideos() {
    slides.forEach((slide, index) => {
        const video = document.createElement('video');
        video.src = videoSources[index];
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.className = 'video-slide';
        video.preload = 'auto'; // Preload the video
        video.addEventListener('loadeddata', () => {
            videosLoaded++;
            if (videosLoaded === totalVideos) {
                // Start showing slides after all videos are loaded
                setTimeout(() => {
                    showSlide(currentSlide);
                    setInterval(nextSlide, 20000); // Match the animation duration
                }, 3000); // Delay for 3 seconds before showing slides
            }
        });
        slide.appendChild(video);
    });
}

// Show the current slide
function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.style.zIndex = i === index ? '1' : '0'; // Ensure the current slide is on top
        slide.style.opacity = i === index ? '1' : '0'; // Only show the current slide
    });
}

// Move to the next slide
function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
}

// Start preloading videos
preloadVideos();
