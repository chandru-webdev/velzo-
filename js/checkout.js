// 1. Make sure to import the database instance and Firebase tools at the top of your file
import { db } from './firebaseConfig.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function handlePlaceOrder() {
    // --- 1. VALIDATION ---
    if (selectedMethod === 'online') {
        const cardNumber = document.getElementById('cardNumber').value;
        const upiId = document.getElementById('upiId').value;
        if ((cardNumber.length > 0 && cardNumber.length < 16) || (cardNumber.length === 0 && upiId.length === 0)) {
            alert('⚠️ Please enter valid Card details or a UPI ID.');
            return;
        }
    } else if (selectedMethod === '') {
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
        paymentMethod: selectedMethod === 'online' ? 'Online' : 'Cash on Delivery',
        amount: grandTotal,
        status: "Placed",
        createdAt: serverTimestamp() 
    };

    // --- 3. SEND TO FIREBASE ---
    try {
        console.log("Connecting to Firebase...");

        const docRef = await addDoc(collection(db, "Orders"), orderPayload);

        console.log("Order saved! ID:", docRef.id);

        localStorage.removeItem("cartItems");

        const modal = document.getElementById('address-modal-overlay');
        if (modal) modal.classList.remove('visible');

        alert('✅ Order Placed Successfully!');

        window.location.href = 'collection.html?id=' + docRef.id;

    } catch (error) {
        console.error("Firebase Error:", error);
        alert("❌ Failed to place order. Please check your internet or Firebase permissions.");
    }
}