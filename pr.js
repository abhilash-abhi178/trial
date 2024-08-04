let request;

/**
 * Initializes the payment request object.
 * @return {PaymentRequest} The payment request object.
 */
function buildPaymentRequest() {
    if (!window.PaymentRequest) {
        return null;
    }

    const supportedInstruments = [{
        supportedMethods: "https://mercury-t2.phonepe.com/transact/pay", // For Production
        data: {
            url: "upi://pay?pa=MERCHANT@ybl&pn=merchant&am=1.00&mam=1.00&tr=7ad44192-69f3-4e38-bebe-8c4944c5bbc6&tn=Payment+for+7ad44192-69f3-4e38-bebe-8c4944c5bbc6&mc=5311&mode=04&purpose=00&utm_campaign=DEBIT&utm_medium=MERCHANTUAT&utm_source=7ad44192-69f3-4e38-bebe-8c4944c5bbc6"
        }
    }];

    const details = {
        id: "1111-71ca4e9f-748c-4de7-af7b-a84f3da75b4e-temp",
        total: {
            label: 'Total',
            amount: {
                currency: 'INR',
                value: '100',
            }
        }
    };

    try {
        request = new PaymentRequest(supportedInstruments, details);
        if (typeof request.hasEnrolledInstrument === 'function') {
            request.hasEnrolledInstrument().then(result => {
                if (result) {
                    // Show “pay by PhonePe” button in payment options
                }
            }).catch(handleError);
        } else {
            request.canMakePayment().then(result => {
                if (result) {
                    // Show “pay by PhonePe” button in payment options
                }
            }).catch(handleError);
        }
    } catch (e) {
        handleError(e);
    }
}

/**
 * Create payment request object for PhonePe payment.
 */
function onCheckoutClick() {
    buildPaymentRequest();
}

/**
 * Handles the response from PaymentRequest.show().
 */
function handlePaymentResponse(response) {
    const payloadForFetch = {}; // Define payload based on your needs

    const fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadForFetch)
    };
    const serverPaymentRequest = new Request('secure/payment/endpoint');

    fetch(serverPaymentRequest, fetchOptions).then(fetchResponse => {
        if (fetchResponse.status < 400) {
            response.complete("success");
        } else {
            response.complete("fail");
        }
    }).catch(() => {
        response.complete("fail");
    });
}

/**
 * Click event listener for “pay by PhonePe” button.
 * Launch payment request for PhonePe payment.
 */
function onPayByPhonePeClick() {
    if (!window.PaymentRequest || !request) {
        return;
    }

    const paymentTimeout = window.setTimeout(() => {
        window.clearTimeout(paymentTimeout);
        request.abort().then(() => {
            console.log('Payment timed out');
        }).catch(() => {
            console.log('Unable to abort the transaction');
        });
    }, 10 * 60 * 1000); // 10 minutes

    try {
        request.show().then(response => {
            window.clearTimeout(paymentTimeout);
            handlePaymentResponse(response);
        }).catch(handleError);
    } catch (e) {
        handleError(e);
    }
}

/**
 * Handles errors in the payment process.
 * @param {Error} error The error object.
 */
function handleError(error) {
    console.error('Payment error:', error);
}

/**
 * Fetch payment details based on the provided transaction ID.
 * @param {string} transactionId The transaction ID to look up.
 */
function fetchPaymentDetails(transactionId) {
    const fetchOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    const endpoint = `secure/payment/details/${transactionId}`; // Update with your actual endpoint

    fetch(endpoint, fetchOptions).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to fetch payment details');
        }
    }).then(data => {
        displayPaymentDetails(data);
    }).catch(error => {
        document.getElementById('details-output').textContent = 'Error: ' + error.message;
    });
}

/**
 * Displays payment details on the page.
 * @param {Object} data The payment details data.
 */
function displayPaymentDetails(data) {
    const output = document.getElementById('details-output');
    if (data.success) {
        output.textContent = JSON.stringify(data, null, 2);
    } else {
        output.textContent = 'Error: ' + data.message;
    }
}

// Handle form submission to fetch payment details
document.getElementById('transaction-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const transactionId = document.getElementById('transactionId').value.trim();
    if (transactionId) {
        fetchPaymentDetails(transactionId);
    }
});
