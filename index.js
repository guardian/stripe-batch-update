require('dotenv').load();
const fetch = require('node-fetch');
const url = 'https://api.stripe.com/v1/customers';
const Authorization = `Bearer ${process.env.STRIPE_KEY}`; //Set this value in .env file in the same directory as this file
let iterations = 0;
let numOfCustomers = 0;
let delay = 0; //Used to stagger requests

function cleanAll(previousId) {
    return cleanPage(previousId)
        .then(result => {
            if (result == undefined) {
                return undefined;
            } else {
                cleanAll(result);
            }
        })
}

function cleanPage(previousId) {
    iterations++;
    console.log(`Fetching page ${iterations}`)
    const fetchUrl = `${url}?limit=100` + (previousId == undefined ? '' : `&starting_after=${previousId}`);
    return fetchCustomers(fetchUrl)
        .then(response => response.json())
        .then(json => {
            json.data
                .filter(c => c.description != null && c.description != 'null')
                .forEach(c => setTimeout(() => cleanCustomer(c.id), delay++ * 1000));
            if (json.has_more == true) {
                return json.data[json.data.length - 1].id;
            } else {
                console.log(`Cleaned ${numOfCustomers} customers`)
                return undefined;
            }
        });
}

function fetchCustomers(url) {
    return fetch(url, {
        headers: {
            Authorization
        },
    });
}

function cleanCustomer(customerId) {
    numOfCustomers++;
    console.log(`Cleaning ${customerId}`);
    const updateUrl = `${url}/${customerId}`;
    updateCustomer(updateUrl)
        .then(response => {
            if (response.status != 200)
                logError(response);
            return response.json();
        })
        .then(json => {
            if (json != undefined) {
                console.log(`Successfully cleaned ${customerId}, new description is ${json.description}`);
            } else {
                console.error(`Failed to clean ${customerId}`);
            }
        });
}

function updateCustomer(url) {
    return fetch(url, {
        method: 'POST',
        headers: {
            Authorization,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: "description=null",
    })
}

function logError(response) {
    response.body.on('data', (chunk) => {
        console.log(`Received response ${response.status}\n${chunk}`);
    });
}

cleanAll();




