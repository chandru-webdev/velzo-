import { db } from './firebaseConfig.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function handlePlaceOrder() {
    console.log("handlePlaceOrder triggered");
    const method = window.selectedMethod || '';

    // --- 1. VALIDATION ---
    if (method === 'online') {
        const cardNumber = document.getElementById('cardNumber').value;
        const upiId = document.getElementById('upiId').value;
        if ((cardNumber.length > 0 && cardNumber.length < 16) || (cardNumber.length === 0 && upiId.length === 0)) {
            alert('⚠️ Please enter valid Card details or a UPI ID.');
            return;
        }
    } else if (method === '') {
        alert('⚠️ Please select a payment method.');
        return;
    }

    // --- 2. PREPARE DATA ---
    const cart = JSON.parse(localStorage.getItem("cartItems")) || [];
    const address = JSON.parse(localStorage.getItem('deliveryAddress')) || {};
    const totalText = document.getElementById('final-amount').textContent;
    const grandTotal = parseFloat(totalText.replace(/[₹,]/g, '')) || 0;

    const orderPayload = {
        items: cart,
        shippingAddress: address,
        paymentMethod: method === 'online' ? 'Online' : 'Cash on Delivery',
        amount: grandTotal,
        status: "Placed",
        createdAt: serverTimestamp()
    };

    console.log("Preparing to send payload:", orderPayload);

    // --- 3. SEND TO FIREBASE FIRESTORE ---
    try {
        console.log("Connecting to Cloud Firestore...");

        const docRef = await addDoc(collection(db, "Orders"), orderPayload);

        console.log("Order saved! ID:", docRef.id);

        localStorage.removeItem("cartItems");

        const modal = document.getElementById('address-modal-overlay');
        if (modal) modal.classList.remove('visible');

        alert('✅ Order Placed Successfully!');

        window.location.href = 'collection.html?id=' + docRef.id;

    } catch (error) {
        console.error("Firebase Error:", error);
        alert("❌ Failed to place order. Error: " + error.message);
    }
}

// Expose to window for the event listener in script.js
window.handlePlaceOrder = handlePlaceOrder;