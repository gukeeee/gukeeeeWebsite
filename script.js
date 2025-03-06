// Google Sheets URL for users data (Make sure the sheet is published as CSV)
const USERS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1_zyDdNFB2K6xz4I4CdgOPhDChqy1drBrPJwA-9Hy7Ag/pub?output=csv';

// Global variable to store user data
let users = [];  // To store user data

let currentUser = null;  // Authentication state management
let isLoggedIn = false;  // Track if the user is logged in

// Google Sheets URLs for other data (questions, etc.)
const SHEET_URLS = {
    'Clase 6': 'https://example.com/questions_clase6.csv',  // Replace with actual URL for questions
    'Clase 7': 'https://example.com/questions_clase7.csv',  // Replace with actual URL for questions
    // Add more classes as needed
};

// Questions data
let questions = []; 

// Check if user is already logged in
function checkLoginStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isLoggedIn = true;
        updateUIForLoggedInUser();
    }
}

// Fetch user data from the published Google Sheets CSV
async function fetchUserData(sheetUrl) {
    try {
        const response = await fetch(sheetUrl);
        const data = await response.text();
        const rows = data.split("\n").map(row => row.split("\t"));  // Use tab as separator
        
        users = [];  // Reset the users array

        for (let i = 0; i < rows.length; i++) {  // Iterate through rows
            const row = rows[i].map(cell => cell.trim());
            if (row.length === 3) {  // Ensure the row has 3 columns
                const username = row[0];
                const password = row[1];
                const displayName = row[2];
                if (username && password && displayName) {
                    users.push({ username, password, displayName });
                }
            }
        }
        console.log('Users fetched:', users);  // Display fetched users
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

// Handle sign-in button click
function setupAuthUI() {
    const signInBtn = document.getElementById('sign-in-btn');
    
    signInBtn.addEventListener('click', function() {
        if (currentUser) {
            logoutUser();
        } else {
            showLoginForm();
        }
    });
}

// Show login form
function showLoginForm() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    // Create login form
    const loginForm = document.createElement('div');
    loginForm.className = 'login-form';
    
    loginForm.innerHTML = `
        <h2>Iniciar Sesión</h2>
        <div style="margin-bottom: 15px;">
            <label for="username">Usuario:</label>
            <input type="text" id="username">
        </div>
        <div style="margin-bottom: 20px;">
            <label for="password">Contraseña:</label>
            <input type="password" id="password">
        </div>
        <div style="display: flex; justify-content: space-between;">
            <button id="login-btn">Ingresar</button>
            <button id="cancel-btn">Cancelar</button>
        </div>
        <p id="login-error">Usuario o contraseña incorrectos</p>
    `;
    
    overlay.appendChild(loginForm);
    document.body.appendChild(overlay);
    
    // Add event listeners for login form buttons
    document.getElementById('login-btn').addEventListener('click', function() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            loginUser(user);
            document.body.removeChild(overlay);
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    });
    
    document.getElementById('cancel-btn').addEventListener('click', function() {
        document.body.removeChild(overlay);
    });
}

// Login user
function loginUser(user) {
    currentUser = {
        username: user.username,
        displayName: user.displayName
    };
    
    isLoggedIn = true;
    
    // Save to localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update UI
    updateUIForLoggedInUser();
}

// Logout user
function logoutUser() {
    currentUser = null;
    isLoggedIn = false;
    localStorage.removeItem('currentUser');
    
    // Update UI
    updateUIForLoggedOutUser();
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    const signInBtn = document.getElementById('sign-in-btn');
    
    // Change sign-in button to sign-out
    signInBtn.textContent = 'Cerrar sesión';
    
    // Create an element for the display name
    if (!document.getElementById('user-name-display')) {
        const userNameDisplay = document.createElement('span');
        userNameDisplay.id = 'user-name-display';
        userNameDisplay.textContent = currentUser.displayName;
        
        const userProfile = document.querySelector('.user-profile');
        userProfile.insertBefore(userNameDisplay, signInBtn);
    } else {
        document.getElementById('user-name-display').textContent = currentUser.displayName;
    }
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
    const signInBtn = document.getElementById('sign-in-btn');
    
    // Change sign-out button back to sign-in
    signInBtn.textContent = 'Iniciar sesión';
    
    // Remove the display name
    const userNameDisplay = document.getElementById('user-name-display');
    if (userNameDisplay) {
        userNameDisplay.remove();
    }
}

// Other existing functionalities for sheet data (not touched)

// Fetch questions from Google Sheets (Separate from user functionality)
async function fetchQuestions(className) {
    try {
        const response = await fetch(SHEET_URLS[className]);
        const data = await response.text();
        const rows = data.split("\n").map(row => row.split(","));
        questions = [];
        for (let i = 3; i < rows.length; i++) {
            const row = rows[i].map(cell => cell.trim());
            let questionText = row[1];
            let answers = row.slice(2).filter(answer => answer !== "");
            if (questionText && answers.length > 0) {
                questions.push({ text: questionText, answers });
            }
        }
        loadQuestions(questions);
    } catch (error) {
        console.error("Error fetching questions:", error);
    }
}

// Initialize the app
window.onload = function() {
    // Fetch user data from Google Sheets
    fetchUserData(USERS_SHEET_URL);

    // Initialize the authentication UI
    setupAuthUI();
    checkLoginStatus();

    // Other setup (e.g., class selector and questions fetch)
    const savedClass = localStorage.getItem('selectedClass') || "Clase 6";
    document.getElementById('class-selector').value = savedClass;
    fetchQuestions(savedClass);
    
    // Set up event listeners for class selector and question fetching
    document.getElementById('class-selector').addEventListener('change', function() {
        const selectedClass = this.value;
        localStorage.setItem('selectedClass', selectedClass);
        fetchQuestions(selectedClass);
        document.getElementById('result').innerHTML = '';
    });

    // Handle checking answers and clearing answers
    document.getElementById('check-button').addEventListener('click', function() {
        checkAnswers(questions);
    });
    document.getElementById('clear-button').addEventListener('click', clearAnswers);
};
