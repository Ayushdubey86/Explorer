document.getElementById('submit-button').addEventListener('click', async function () {
    const residentvar = document.getElementById('resident').value || 'anywhere in world';
    const expenseCap = document.getElementById('expense-cap').value || '10000';
    const currency = document.getElementById('currency').value || 'USD';
    const duration = document.getElementById('duration').value || 'not specified';
    const companion = document.getElementById('companion').value || 'Alone';
    const accommodation = document.getElementById('accommodation').value || 'not specified';
    const style = document.getElementById('style').value || 'not specified';
    const interest = document.getElementById('interest').value || 'not specified';
    const transport = document.getElementById('transport').value || 'not specified';

    // Create a dynamic prompt based on user inputs
    const prompt = `
        I am a resident of  ${residentvar},
        I have ${expenseCap} ${currency} to spend and ${duration} days for a trip. 
        I prefer to travel with ${companion}, stay in ${accommodation}, 
        and enjoy ${style} travel style. I'm interested in ${interest}, 
        and I prefer ${transport} for transportation. 
        Can you suggest an itinerary with multiple places I can explore based on these preferences,anywhere in world?
    `;

    

    const response = await fetch('http://localhost:3000/openai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: prompt })
    });

    const data = await response.json();
    console.log(data);

    // Log the values to the console
    console.log({ expenseCap, currency, duration, companion, accommodation, style, interest, transport });
});
