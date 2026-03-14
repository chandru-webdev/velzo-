const sidebar = document.getElementById("sidebar");
const openSidebar = document.getElementById("openSidebar");
const closeSidebar = document.getElementById("closeSidebar");

// sidebar
if (openSidebar && sidebar) {
    openSidebar.addEventListener("click", () => {
        sidebar.classList.add("active");
    });
}

if (closeSidebar && sidebar) {
    closeSidebar.addEventListener("click", () => {
        sidebar.classList.remove("active");
    });
}

// filter button
document.addEventListener('DOMContentLoaded', () => {
    const mobileBtn = document.getElementById('mobileFilterBtn');
    const overlay = document.getElementById('filterOverlay');
    const closeBtn = document.getElementById('closeFilter');

    // 1. Open Filter
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Stop scrolling background
        });
    }

    // 2. Close Filter
    const closeMenu = () => {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    // Close menu
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeMenu();
    });
});
// GLOBAL STATE 
let baseProducts = [];
let activeColor = "all";
let maxPriceThreshold = 5000; 
let minRatingThreshold = 0;

const WISHLIST_STORAGE_KEY = 'userWishlist';
const wishlistBadge = document.getElementById('wishlist-badge');

//INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById("productContainer");

    // 1. Detect which file to load from the HTML attribute
    const jsonFile = container ? container.getAttribute('data-source') : 'products.json';

    // 2. Initialize UI
    const currentWishlist = getWishlist();
    updateWishlistBadge(currentWishlist.length);
    setupPriceSlider();
    setupRatingFilters();
    setupColorRadios();

    // 3. Load the specific file for THIS page
    if (jsonFile) {
        loadProducts(jsonFile);
    }
});

//  1. FILTER VISIBILITY 
function setupFilterToggle() {
    const btn = document.getElementById('filterToggleBtn');
    const menu = document.getElementById('filterMenu');
    if (btn && menu) {
        btn.addEventListener('click', () => {
            menu.classList.toggle('filter-menu-show');
        });
    }
}

function setupPriceSlider() {
    const slider = document.getElementById('priceRange');
    const label = document.getElementById('maxPriceLabel');

    // Guard if slider or label not present on the page
    if (!slider || !label) return;

    slider.addEventListener('input', (e) => {
        maxPriceThreshold = parseInt(e.target.value);
        label.innerText = `Max: ₹${maxPriceThreshold}`;
        applyAllFilters();
    });
}
// 2. Rating Checkbox Logic 
function setupRatingFilters() {
    const ratingChecks = document.querySelectorAll('.rating-filter');
    if (!ratingChecks || ratingChecks.length === 0) return;

    ratingChecks.forEach(check => {
        check.addEventListener('change', () => {
            const selected = Array.from(ratingChecks)
                .filter(i => i.checked)
                .map(i => parseInt(i.value));

            minRatingThreshold = selected.length > 0 ? Math.min(...selected) : 0;
            applyAllFilters();
        });
    });
}
// 3. Color Radio Logic
function setupColorRadios() {
    const radios = document.querySelectorAll('input[name="color"]');
    if (!radios || radios.length === 0) return;

    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            activeColor = e.target.value;
            applyAllFilters();
        });
    });
}

// --- Updated Core Filtering Engine --- 
function applyAllFilters() {
    const filtered = baseProducts.filter(p => {
        // A. Color Matching
        const productColor = (p.color || "").toLowerCase();
        const targetColor = activeColor.toLowerCase();
        const colorMatch = (activeColor === "all" || productColor === targetColor);
        // B. Price Matching 
        const priceMatch = p.price <= maxPriceThreshold;
        // C. Rating Matching 
        const numericRating = parseFloat(p.rating) || 0;
        const ratingMatch = numericRating >= minRatingThreshold;

        return colorMatch && priceMatch && ratingMatch;
    });

    displayProducts(filtered);
}

// --- 5. DATA FETCHING ---
function loadProducts(file) {
    fetch(file)
        .then(res => res.json())
        .then(data => {
            baseProducts = data;
            searchList = data; 
            console.log("Loaded total products:", baseProducts.length);
            displayProducts(baseProducts); 
        })
        .catch(err => console.error("Load error:", err));
}

// --- 6. WISHLIST HELPERS ---
function getWishlist() {
    const wishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return wishlist ? JSON.parse(wishlist) : [];
}

function updateWishlistBadge(count) {
    if (wishlistBadge) {
        wishlistBadge.textContent = count;
        wishlistBadge.style.display = count > 0 ? "block" : "none";
    }
}

function saveWishlist(wishlist) {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    updateWishlistBadge(wishlist.length);
}

function toggleWishlist(product) {
    let wishlist = getWishlist();
    const index = wishlist.findIndex(item => item.id === product.id);
    if (index === -1) {
        wishlist.push(product); // Add to wishlist
    } else {
        wishlist.splice(index, 1); // Remove from wishlist
    }
    saveWishlist(wishlist);
}

// --- 7. RENDER FUNCTION ---
function displayProducts(products) {
    const container = document.getElementById("productContainer");
    if (!container) return;
    container.innerHTML = "";
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div style="width:100%; text-align:center; padding: 50px;">
                <p class='no-products'>No products match your filters.</p>
            </div>`;
        return;
    }

    const currentWishlist = getWishlist();
    products.forEach(p => {
        const div = document.createElement("div");
        div.classList.add("pro");
        // Handle image key differences and missing values
        const imgUrl = p.image || p.imageMain || "img/default-product.jpg";
        const isLiked = currentWishlist.some(item => item.id === p.id);
        const discount = p.originalPrice > p.price
            ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
            : 0;
        div.innerHTML = `
            <img src="${imgUrl}" alt="${p.name}">
            <div class="des">
                <span class="brandname">${p.brand || "Brand"}</span>
                <h5 class="product-name">${p.name}</h5>
                <div class="star">${p.rating || ''}</div>
                <h4 class="price">
                    ₹${p.price} 
                    ${p.originalPrice > p.price ? `<del>₹${p.originalPrice}</del> <span class="discount" style="color:green; font-size: 12px; margin-left: 5px;">(${discount}% OFF)</span>` : ''}
                </h4>
            </div>
            <div class="product-actions">
                <button class="like-btn like" title="Add to Wishlist">
                    <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i> 
                </button>
                <a href="#" class="cart-btn" >
                </a>
            </div>
        `;
        // Action: Wishlist (Heart)
        div.querySelector('.like-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWishlist(p);
            const icon = e.currentTarget.querySelector('.fa-heart');
            icon.classList.toggle('fa-regular');
            icon.classList.toggle('fa-solid');
        });
        // Action: Cart
        div.querySelector('.cart-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const itemToAdd = {
                id: p.id,
                name: p.name,
                price: Number(p.price),
                originalPrice: Number(p.originalPrice || p.price),
                image: p.image || p.imageMain || "img/default.jpg",
                quantity: 1,
                size: "M"
            };

            let cart = JSON.parse(localStorage.getItem("cartItems")) || [];
            const idx = cart.findIndex(item => item.id === itemToAdd.id);

            if (idx === -1) {
                cart.push(itemToAdd);
            } else {
                cart[idx].quantity++;
            }

            localStorage.setItem("cartItems", JSON.stringify(cart));
            updateCartBadge();
            showToast(`${itemToAdd.name} added to bag ✓`);
        });
        // Action: Click Product to view details
        div.onclick = () => {
            localStorage.setItem("selectedProduct", JSON.stringify(p));
            window.location.href = "shop.html";
        };

        container.appendChild(div);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateWishlistBadge(getWishlist().length);
});

// --- SEARCH LOGIC ---
let searchList = [];

// Use an absolute path so fetch resolves correctly regardless of the current page path
fetch("/html/allproducts.json")
    .then(res => res.json())
    .then(data => {
        searchList = data;
    })
    .catch(err => console.error("Search list load error:", err));

const searchInput = document.getElementById("searchInput");
const resultsBox = document.getElementById("searchResults");

function redirectProduct(name) {
    const n = name.toLowerCase();
    // Simple redirection logic based on keywords
    if (n.includes("tshirt") || n.includes("t-shirt") || n.includes("shirt")) {
        window.location.href = "collection.html";
        return;
    }
    if (n.includes("pant") || n.includes("jean")) {
        window.location.href = "women.html";
        return;
    }
    if (n.includes("kids")) {
        window.location.href = "kids.html";
        return;
    }
    if (n.includes("girls") || n.includes("hoodie") || n.includes("shoe")) {
        window.location.href = "winterwear.html";
        return;
    }
    window.location.href = "collection.html";
}

// SEARCH INPUT HANDLER
if (searchInput && resultsBox) {
    searchInput.addEventListener("input", () => {
        const raw = searchInput.value || "";
        const keyword = raw.trim().toLowerCase();
        resultsBox.innerHTML = "";

        if (!keyword) {
            resultsBox.style.display = "none";
            return;
        }

        // Use includes() so substring matches work (not only startsWith)
        const matched = (searchList || []).filter(item =>
            item.name && item.name.toLowerCase().includes(keyword)
        );

        if (!matched || matched.length === 0) {
            resultsBox.style.display = "none";
            return;
        }

        matched.forEach(p => {
            const img = p.imageMain || p.image || "";

            const box = document.createElement("div");
            box.className = "search-item";

            box.innerHTML = `
                <img src="${img}">
                <span>${p.name}</span>
            `;

            box.onclick = () => {
                // Save the selected product so the product page can read it (same as product card click)
                try {
                    localStorage.setItem('selectedProduct', JSON.stringify(p));
                } catch (err) {
                    console.warn('Could not save selectedProduct to localStorage', err);
                }
                // Navigate to the product detail page
                window.location.href = 'shop.html';
            };

            resultsBox.appendChild(box);
        });

        resultsBox.style.display = "block";
    });
}
// CLOSE LIST
document.addEventListener("click", (e) => {
    if (!resultsBox.contains(e.target) && e.target !== searchInput) {
        resultsBox.style.display = "none";
    }
});


// login

let userPhone = '';
let userName = 'User'; // Default name, can be updated
let loginState = 'loggedOut';

// OTP Timer variables
let otpTimer;
let otpTimeRemaining = 30;

// Storage Keys
const USER_KEY = 'currentUser';
const OTP_TEMP_KEY = 'tempOtp'; //  generated OTP temporarily
const PHONE_TEMP_KEY = 'tempPhone'; // To store phone during OTP phase

//  RANDOM OTP GENERATION FUNCTION
function generateRandomOtp() {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return randomNum.toString();
}

// HTML String for the Profile/Login Component (No changes)
const PROFILE_PANEL_HTML = `
<div class="profile-panel" id="profilePanel">
    
    <div class="panel-content logged-out-view" id="loggedOutView">
        <div class="hello-section">
            Hello User
            <div class="subtitle">To access your account</div>
        </div>
        
        <form class="login-form" id="loginForm">
            <input type="tel" id="phoneInput" placeholder="Enter Phone Number" required maxlength="10">
            <button type="submit" class="cta-button">Log In</button>
        </form>
        
        <div class="separator"></div>
        <div class="menu-item disabled"><i class="fa-solid fa-bag-shopping"></i> My Orders</div>
        <div class="menu-item disabled"><i class="fa-solid fa-trash-can"></i> Delete Account</div>
    </div>

    <div class="panel-content otp-view hidden" id="otpView">
        <div class="hello-section">
            Verify OTP
            <div class="subtitle" id="otpSubtitle">Sent to +91 XXXX...</div>
        </div>
        <div id="otpMessage" class="otp-status-message success">
            </div>
        <form class="otp-form" id="otpForm">
            <div class="otp-inputs">
                <input type="text" maxlength="1" class="otpInput" inputmode="numeric" required>
                <input type="text" maxlength="1" class="otpInput" inputmode="numeric" required>
                <input type="text" maxlength="1" class="otpInput" inputmode="numeric" required>
                <input type="text" maxlength="1" class="otpInput" inputmode="numeric" required>
            </div>
            <button type="submit" class="cta-button">Verify 4-Digit OTP</button>
        </form>
        <div class="menu-item back-button" id="backButton"><i class="fa-solid fa-angle-left"></i> Go Back</div>
        <div class="menu-item resend-button disabled" id="resendButton">⚠️ Resend OTP</div>
        <div class="muted" id="otpTimer"></div>
    </div>
    
    <div class="panel-content logged-in-view hidden" id="loggedInView">
        <div class="hello-section user-details">
            <span class="user-avatar" id="userAvatar">U</span>
            <div>
                <div class="main-text" id="loggedInName">Hello User</div>
                <div class="subtitle" id="loggedInPhone">+91 XXXXXXXXXX</div>
            </div>
        </div>
        
        <div class="separator"></div>
        
       
        <div class="menu-item edit-profile-button" id="editButton">
            <i class="fa-solid fa-user-edit"></i> Edit Profile / Name
        </div>
        <div class="menu-item logout-button" id="logoutButton">
            <i class="fa-solid fa-right-from-bracket"></i> Logout
        </div>
        <div class="menu-item delete-account-button" id="deleteButton">
            <i class="fa-solid fa-trash-can"></i> Delete Account
        </div>
    </div>
</div>
`;


function initializeLoginLogic() {
    //  Element Selectors (Selecting elements inside the dynamically loaded HTML)
    const placeholder = document.getElementById('profileComponentPlaceholder');
    const profileIcon = document.getElementById('profileLinkPlaceholder');
    const profileIconInner = document.getElementById('profileIconStarter');

    if (!placeholder || !profileIcon || !profileIconInner) {
        console.error("Missing required placeholders for profile component.");
        return;
    }
    // Inject the HTML template
    placeholder.innerHTML = PROFILE_PANEL_HTML;

    const profileContainer = document.getElementById('profileComponentPlaceholder');
    const profilePanel = document.getElementById('profilePanel');
    const loggedOutView = document.getElementById('loggedOutView');
    const otpView = document.getElementById('otpView');
    const loggedInView = document.getElementById('loggedInView');

    const loginForm = document.getElementById('loginForm');
    const phoneInput = document.getElementById('phoneInput');

    const otpForm = document.getElementById('otpForm');
    const otpInputs = document.querySelectorAll('#otpView .otpInput');
    const otpSubtitle = document.getElementById('otpSubtitle');
    const otpMessage = document.getElementById('otpMessage');
    const backButton = document.getElementById('backButton');
    const resendButton = document.getElementById('resendButton');
    const otpTimerDisplay = document.getElementById('otpTimer');

    const logoutButton = document.getElementById('logoutButton');
    const deleteButton = document.getElementById('deleteButton');
    const editButton = document.getElementById('editButton');
    const loggedInNameDisplay = document.getElementById('loggedInName');
    const loggedInPhoneDisplay = document.getElementById('loggedInPhone');
    const userAvatarDisplay = document.getElementById('userAvatar');

    //  VIEW MANAGEMENT & LOCAL STORAGE CHECK  

    function hideAllViews() {
        loggedOutView.classList.add('hidden');
        otpView.classList.add('hidden');
        loggedInView.classList.add('hidden');
    }

    function showLoggedOutView() {
        hideAllViews();
        loggedOutView.classList.remove('hidden');
        loginState = 'loggedOut';
        profileIconInner.className = 'fa-solid fa-user';
        phoneInput.value = '';
        clearInterval(otpTimer);
        // Clear temp storage 
        localStorage.removeItem(OTP_TEMP_KEY);
        localStorage.removeItem(PHONE_TEMP_KEY);
    }
    // runs every time a page loads to check the session
    function checkInitialState() {
        const savedUser = localStorage.getItem(USER_KEY);
        if (savedUser) {
            const user = JSON.parse(savedUser);
            // Update global state
            userName = user.name;
            userPhone = user.phone;

            // Show the logged-in view 
            showLoggedInView(user.name, user.phone, false); // false to avoid closing panel right away
        } else {
            showLoggedOutView();
        }
    }
    //  OTP View Function 
    function showOtpView(phone) {
        hideAllViews();

        // 1. Update state and local storage for current attempt
        userPhone = phone;
        const generatedOtp = generateRandomOtp();
        localStorage.setItem(OTP_TEMP_KEY, generatedOtp);
        localStorage.setItem(PHONE_TEMP_KEY, phone);

        //  Update UI
        otpView.classList.remove('hidden');
        otpSubtitle.textContent = `Sent to +91 ${userPhone.slice(0, 4)}...${userPhone.slice(-3)}`;

        // OTP MESSAGE for testing
        otpMessage.innerHTML = `Enter the code **${generatedOtp}** to verify (Static Code).`;
        otpMessage.classList.remove('error');
        otpMessage.classList.add('success');

        //  Start flow
        otpInputs.forEach(input => input.value = '');
        otpInputs[0].focus();
        startOtpTimer(); // Timer-ai restart seiyum
        loginState = 'otp';
        console.log(`Static OTP sent to: +91${userPhone}. Expected Code: ${generatedOtp}`);
    }
    function showLoggedInView(name, phone, closePanel = true) {
        hideAllViews();
        // Update global state
        userName = name;
        userPhone = phone;
        // Update UI
        loggedInNameDisplay.textContent = `Hello ${name}`;
        loggedInPhoneDisplay.textContent = `+91 ${phone}`;
        userAvatarDisplay.textContent = name[0] || 'U'; // First letter of name
        loggedInView.classList.remove('hidden');
        profileIconInner.className = 'fa-solid fa-user-check';
        loginState = 'loggedIn';
        if (closePanel) {
            // Close the panel after successful login on the initial action
            profilePanel.classList.remove('visible');
        }
    }
    function startOtpTimer() {
        clearInterval(otpTimer);
        otpTimeRemaining = 30;
        resendButton.classList.add('disabled'); // Timer-odu, resend-a disabled seiyum
        otpTimerDisplay.textContent = `Resend in ${otpTimeRemaining}s`;

        otpTimer = setInterval(() => {
            otpTimeRemaining--;
            otpTimerDisplay.textContent = `Resend in ${otpTimeRemaining}s`;
            if (otpTimeRemaining <= 0) {
                clearInterval(otpTimer);
                otpTimerDisplay.textContent = '';
                resendButton.classList.remove('disabled'); // Timer mudindha udane enable seiyum
                otpMessage.innerHTML = 'Didn\'t receive the code? Click **Resend OTP**.'
            }
        }, 1000);
    }
    // 1. Handle Login Click (Goes to OTP View)
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const phone = phoneInput.value.trim();
        if (phone.length === 10) {
            showOtpView(phone);
        } else {
            alert('Please enter a valid 10-digit phone number.');
        }
    });
    // 2. Handle OTP Verification 
    otpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredOtp = Array.from(otpInputs).map(input => input.value).join('');
        const expectedOtp = localStorage.getItem(OTP_TEMP_KEY);
        const phoneInProcess = localStorage.getItem(PHONE_TEMP_KEY);
        if (enteredOtp.length === 4 && enteredOtp === expectedOtp) {
            // SUCCESS
            clearInterval(otpTimer);
            otpMessage.textContent = 'Verification Successful!';
            otpMessage.classList.remove('error');
            otpMessage.classList.add('success');

            //  CRITICAL: Set persistent login state across all pages
            const userData = { name: userName, phone: phoneInProcess };
            localStorage.setItem(USER_KEY, JSON.stringify(userData));

            setTimeout(() => {
                showLoggedInView(userName, phoneInProcess, true); // True to close panel
                // Clear temporary storage
                localStorage.removeItem(OTP_TEMP_KEY);
                localStorage.removeItem(PHONE_TEMP_KEY);
                console.log('Verification Successful. Logged In and Local Storage Updated.');
            }, 500);
        } else {
            // FAILURE
            otpMessage.innerHTML = `Invalid OTP or expired. Expected: **${expectedOtp}**.`;
            otpMessage.classList.add('error');
            otpMessage.classList.remove('success');
            otpInputs.forEach(input => input.value = '');
            otpInputs[0].focus();
            console.log(`Verification Failed. Entered: ${enteredOtp}, Expected: ${expectedOtp}`);
        }
    });
    // 3. Handle Logout (Clears Local Storage)
    logoutButton.addEventListener('click', () => {
        if (!confirm("Are you sure you want to log out?")) return;
        localStorage.removeItem(USER_KEY); // Remove persistent user data
        showLoggedOutView(); // Switch to logged out view and clear temp keys
        profilePanel.classList.remove('visible');
        console.log('User logged out. Local Storage cleared.');
    });
    // 4. Handle Delete Account (Clears Local Storage)
    deleteButton.addEventListener('click', () => {
        if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
        localStorage.removeItem(USER_KEY);
        showLoggedOutView();
        profilePanel.classList.remove('visible');
        alert('Account deletion simulated.');
        console.log('Account deleted. Local Storage cleared.');
    });

    // UX UTILITY AND EVENT LISTENERS
    // Toggle Profile Panel Visibility
    profileIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        profilePanel.classList.toggle('visible');
    });
    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (profilePanel.classList.contains('visible') && !profileContainer.contains(e.target) && !profileIcon.contains(e.target)) {
            profilePanel.classList.remove('visible');
        }
    });
    // Back Button 
    backButton.addEventListener('click', () => {
        showLoggedOutView();
    });
    // RESEND OTP BUTTON LOGIC
    resendButton.addEventListener('click', () => {
        if (!resendButton.classList.contains('disabled')) {
            const currentPhone = localStorage.getItem(PHONE_TEMP_KEY);
            if (currentPhone) {
                console.log("Resend requested. Generating new OTP...");
                showOtpView(currentPhone); // showOtpView handles new OTP and timer restart
            }
        }
    });
    // Handle OTP Input focus/move
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            if (input.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
            // Auto-verify if last digit is entered
            if (index === otpInputs.length - 1 && input.value.length === 1) {
                otpForm.dispatchEvent(new Event('submit')); // Trigger form submission
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });
    // Handle Name Edit (simulated)
    editButton.addEventListener('click', () => {
        const currentName = userName;
        const newName = prompt("Enter your new name:", currentName);
        if (newName && newName.trim() !== "" && newName.trim() !== currentName) {
            userName = newName.trim();
            const userData = { name: userName, phone: userPhone };
            localStorage.setItem(USER_KEY, JSON.stringify(userData));
            showLoggedInView(userName, userPhone, false); // Update view without closing panel
            alert(`Name successfully updated to ${userName}.`);
        } else if (newName !== null && newName.trim() !== "") {
            alert("Name is the same or empty. No change saved.");
        }
    });
    checkInitialState();
}
// --- Main Script Execution ---
document.addEventListener('DOMContentLoaded', initializeLoginLogic);
// Existing Hamburger Menu Logic 
document.addEventListener('DOMContentLoaded', () => {
    const bar = document.getElementById('bar');
    const nav = document.getElementById('navbar');
    const closeBtn = document.getElementById('close-btn');
    if (bar && nav) {
        bar.addEventListener('click', () => {
            nav.classList.add('active');
        });
    }
    if (closeBtn && nav) {
        closeBtn.addEventListener('click', () => {
            nav.classList.remove('active');
        });
    }
});
// CART DATA LOCAL STORAGE
let cart = JSON.parse(localStorage.getItem("cartItems")) || [];
document.querySelectorAll(".add-to-cart-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const product = {
            id: btn.getAttribute("data-id"),
            title: btn.getAttribute("data-title"),
            price: parseInt(btn.getAttribute("data-price")),
            img: btn.getAttribute("data-img"),
            qty: 1
        };
        cart.push(product);
        localStorage.setItem("cartItems", JSON.stringify(cart));
        showToast(`${product.title} added to bag ✓`);
    });
});
// Success Toast Message
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-msg";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2500);
}
// cart count
function updateCartBadge() {
    const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
    const badge = document.getElementById("cart-badge");
    const count = cartItems.length;
    if (!badge) return; // nothing to update on pages without a cart badge

    if (count > 0) {
        badge.style.display = "inline-block";
        badge.textContent = count;
    } else {
        badge.style.display = "none";
    }
}
// Run when page loads
updateCartBadge();
// Find the existing listener for the Checkout button:
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('checkout-btn')) {
        const currentCart = getCartItems();
        if (currentCart.length === 0) {
            alert('Your bag is empty. Please add items before checking out!');
            return;
        }
        // --- UPDATED ACTION HERE ---
        document.getElementById('address-modal-overlay').classList.add('visible');
        // --- END UPDATED ACTION ---
    }
});
// --- NEW: Modal Control and Form Submission Listener ---
const modalOverlay = document.getElementById('address-modal-overlay');
const closeAddressBtn = document.getElementById('close-address-modal');
const addressForm = document.getElementById('address-form');

if (modalOverlay && closeAddressBtn) {
    // Close modal when close button is clicked
    closeAddressBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('visible');
    });

    // Close modal when clicking outside
    modalOverlay.addEventListener('click', (e) => {
        if (e.target.id === 'address-modal-overlay') {
            modalOverlay.classList.remove('visible');
        }
    });
}

// Form Submission Handler (guarded)
if (addressForm) {
    addressForm.addEventListener('submit', (e) => {
        e.preventDefault();
        //  Get Address 
        const pincodeEl = document.getElementById('pincode');
        const addressData = {
            pincode: pincodeEl ? pincodeEl.value : ''
        };
        localStorage.setItem('deliveryAddress', JSON.stringify(addressData));
        // Hide Address Step and Show Payment Step
        const addrContainer = document.querySelector('.address-form-container');
        if (addrContainer) addrContainer.classList.add('hidden');
        const paymentStep = document.getElementById('payment-step');
        if (paymentStep) paymentStep.classList.add('active');
        // Update the Modal Header and Final Amount
        const modalHeaderH2 = document.querySelector('.modal-header h2');
        if (modalHeaderH2) modalHeaderH2.textContent = 'Finalize Payment';
        // Calculate and display the grand total here (re-using existing functions)
        let grandTotal = 0;
        // To get the actual grand total value from the summary box:
        const grandTotalElement = document.getElementById('grand-total-amount');
        if (grandTotalElement) {
            // Extract the number, removing '₹' and ','
            grandTotal = parseFloat(grandTotalElement.textContent.replace('₹', '').replace(/,/g, '')) || 0;
        }
        const finalAmountEl = document.getElementById('final-amount');
        if (finalAmountEl) finalAmountEl.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;
    });
}
// --- NEW: Add event listener for the final 'PLACE ORDER' button ---
const placeOrderBtn = document.getElementById('placeOrderBtn');
if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', () => {
        if (typeof window.handlePlaceOrder === 'function') {
            window.handlePlaceOrder();
        } else {
            console.error("handlePlaceOrder is not defined on window.");
        }
    });
}
window.selectedMethod = '';
let selectedMethod = ''; // Local reference for use within script.js if needed
// Update selectedMethod globally when it changes
function selectPayment(method) {
    // Check the radio button
    const methodRadio = document.getElementById(method);
    if (methodRadio) methodRadio.checked = true;
    selectedMethod = method;
    window.selectedMethod = method;

    // Manage the detail panels visibility
    const onlinePanel = document.getElementById('online-details');
    const codPanel = document.getElementById('cod-details');
    const placeOrderBtn = document.getElementById('placeOrderBtn');

    if (method === 'online') {
        if (onlinePanel) onlinePanel.classList.add('active');
        if (codPanel) codPanel.classList.remove('active');
    } else if (method === 'cod') {
        if (onlinePanel) onlinePanel.classList.remove('active');
        if (codPanel) codPanel.classList.add('active');
    }
    // Enable the Place Order button
    if (placeOrderBtn) placeOrderBtn.disabled = false;
    // Visually mark the selected payment-option-box
    try {
        const boxes = document.querySelectorAll('.payment-option-box');
        boxes.forEach(box => box.classList.remove('selected'));
        // Find the box that contains the radio with id === method
        const selectedBox = Array.from(boxes).find(b => b.querySelector(`#${method}`));
        if (selectedBox) selectedBox.classList.add('selected');
    } catch (err) {
        // no-op if DOM not present
    }
}
window.selectPayment = selectPayment;

const products = [];/*json data*/

// Select DOM elements
const priceInput = document.getElementById('priceRange');
const maxPriceLabel = document.getElementById('maxPriceLabel');
const ratingChecks = document.querySelectorAll('.rating-check');
// product grid container: try legacy id 'product-container' then 'product-grid'
let container = document.getElementById('product-container');
if (!container) container = document.getElementById('product-grid');

// Function to render products
function renderProducts(filteredList) {
    if (!container) return; // Guard: nothing to render on pages without product container
    container.innerHTML = filteredList.map(item => `
        <div class="product-card">
            <img src="${item.image}" alt="${item.name}">
            <h4>${item.name}</h4>
            <p>₹${item.price} | ${item.rating}</p>
        </div>
    `).join('');
}

// Main Filter Function
function applyFilters() {
    const maxPrice = parseInt(priceInput.value);
    maxPriceLabel.innerText = `Max: ₹${maxPrice}`;
    // Find the highest selected rating 
    const selectedRatings = Array.from(ratingChecks)
        .filter(i => i.checked)
        .map(i => parseInt(i.value));
    const minRating = selectedRatings.length > 0 ? Math.min(...selectedRatings) : 0;
    const filtered = products.filter(product => {
        const numericRating = parseFloat(product.rating);   // Convert "4.4" string to float 4.4
        const matchesPrice = product.price <= maxPrice;
        const matchesRating = numericRating >= minRating;
        return matchesPrice && matchesRating;
    });
    renderProducts(filtered);
}
// Event Listeners (guarded)
if (priceInput) priceInput.addEventListener('input', applyFilters);
if (ratingChecks && ratingChecks.length > 0) ratingChecks.forEach(check => check.addEventListener('change', applyFilters));
// Initial render if the container exists
if (container) renderProducts(products);

// --- Thumbnail gallery: clicking a small image replaces the main model image ---
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.small-image-container').forEach(container => {
        const thumbs = Array.from(container.querySelectorAll('img'));
        if (!thumbs || thumbs.length === 0) return;

        // Find the nearest slide and attempt to locate a main image inside it.
        const slide = container.closest('.carousel-slide');
        const mainImg = slide ? slide.querySelector('.main-model-image') : null;
        const mediaHalf = slide ? slide.querySelector('.media-half') : null;

        // If neither a real <img> nor a media container exists, skip this set
        if (!mainImg && !mediaHalf) return;

        // Set first thumbnail active by default (optional)
        thumbs.forEach((t, i) => {
            t.classList.remove('active-thumb');
            if (i === 0) t.classList.add('active-thumb');
            // Click handler
            t.addEventListener('click', (e) => {
                e.preventDefault();
                const src = t.getAttribute('data-src') || t.src || t.getAttribute('src');
                if (!src) return;

                // If a real <img> exists in the slide, swap its src; otherwise update the media-half background.
                if (mainImg) {
                    mainImg.src = src;
                } else if (mediaHalf) {
                    // Use inline style so CSS background-image rules (like .img2/.img4) are overridden per-slide
                    mediaHalf.style.backgroundImage = `url('${src}')`;
                }

                thumbs.forEach(x => x.classList.remove('active-thumb'));
                t.classList.add('active-thumb');
            });
            // Allow keyboard activation
            t.setAttribute('tabindex', '0');
            t.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    t.click();
                }
            });
        });
    });
});

function selectPayment(method) {
    // Remove selected class from all
    document.querySelectorAll('.payment-option-box').forEach(box => {
        box.classList.remove('selected');
    });
    
    // Add selected class to the clicked one
    event.currentTarget.classList.add('selected');
    
    // Enable button
    const btn = document.getElementById('placeOrderBtn');
    btn.disabled = false;
    btn.innerText = method === 'cod' ? 'Confirm Order' : 'Pay Now';
}