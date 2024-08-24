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
            'EUR': 1.1, // Example rate
            'INR': 0.012 // Example rate
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
        const response = await fetch('http://localhost:3000/openai', {
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
