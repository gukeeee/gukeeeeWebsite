// User database - hardcoded users
let USERS = [];

// Sheet URLs for different classes
const SHEET_URLS = {
    "Clase 6": 'https://docs.google.com/spreadsheets/d/1_zyDdNFB2K6xz4I4CdgOPhDChqy1drBrPJwA-9Hy7Ag/pub?output=csv',
    "Clase 7": 'https://docs.google.com/spreadsheets/d/17OGUPM0djxN6LweVHa2CWHgf31GYherET482JmBLJxk/pub?output=csv'
    "Users": 'https://docs.google.com/spreadsheets/d/1ECsxtrSV6e8zbFJY12pNporsPJbPwB5fW9H4c3Hmybo/pub?output=csv'
};

let questions = []; // Global variable to store questions
let currentUser = null; // Authentication state management
let isLoggedIn = false; // Track if the user is logged in

// Check if user is already logged in
function checkLoginStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isLoggedIn = true; // Set login status to true if user is found
        updateUIForLoggedInUser();
    }
}

// Handle sign in button click
function setupAuthUI() {
    const signInBtn = document.getElementById('sign-in-btn');
    
    signInBtn.addEventListener('click', function() {
        if (currentUser) {
            // If user is logged in, log them out
            logoutUser();
        } else {
            // If user is not logged in, show login form
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
    
    loginForm.innerHTML = 
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
    ;
    
    overlay.appendChild(loginForm);
    document.body.appendChild(overlay);
    
    // Add event listeners for login form buttons
    document.getElementById('login-btn').addEventListener('click', function() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const user = USERS.find(u => u.username === username && u.password === password);
        
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
    
    isLoggedIn = true; // Set login status to true upon successful login
    
    // Save to localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update UI
    updateUIForLoggedInUser();
}

// Logout user
function logoutUser() {
    currentUser = null;
    isLoggedIn = false; // Set login status to false upon logout
    localStorage.removeItem('currentUser');
    
    // Update UI
    updateUIForLoggedOutUser();
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    const signInBtn = document.getElementById('sign-in-btn');
    
    // Change sign in button to sign out
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
    
    // Change sign out button back to sign in
    signInBtn.textContent = 'Iniciar sesión';
    
    // Remove the display name
    const userNameDisplay = document.getElementById('user-name-display');
    if (userNameDisplay) {
        userNameDisplay.remove();
    }
}

// Fetch questions from Google Sheets
async function fetchQuestions(className) {
    try {
        const response = await fetch(SHEET_URLS[className]);
        const data = await response.text();
        const rows = data.split("\n").map(row => row.split(","));
        questions = []; // Reset global questions array
        for (let i = 3; i < rows.length; i++) { // Start from index 2 (B3)
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

// Fetch user data from the published Google Sheets CSV
async function fetchUserData(sheetUrl) {
    try {
        const response = await fetch(SHEET_URLS[sheetUrl]);
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

// Load questions into the form
function loadQuestions(questions) {
    const quizForm = document.getElementById('quiz-form');
    quizForm.innerHTML = '';
    questions.forEach((question, index) => {
        const parts = question.text.split('_');
        const questionHtml = parts.map((part, i) => {
            if (i > 0) {
                return <input type="text" id="q${index + 1}_${i}" placeholder="Tu respuesta aquí">${part};
            }
            return part;
        }).join('');
        const questionElement = 
            <p id="question-${index + 1}">${index + 1}. ${questionHtml}</p>
            <div id="feedback-q${index + 1}" class="feedback"></div>
        ;
        quizForm.insertAdjacentHTML('beforeend', questionElement);
    });
}

// Check answers
function checkAnswers(questions) {
    let score = 0;
    let total = 0;
    questions.forEach((question, index) => {
        const feedbackElement = document.getElementById(feedback-q${index + 1});
        let feedbackHtml = <strong>Q${index + 1}:</strong> ;
        question.answers.forEach((correctAnswer, i) => {
            const inputField = document.getElementById(q${index + 1}_${i + 1});
            const userAnswer = inputField?.value.trim().toLowerCase();
            const possibleAnswers = correctAnswer.toLowerCase().split(' / ');
            if (!userAnswer) {
                feedbackHtml += <span style="color: GoldenRod; font-weight: bold;">Sin respuesta, </span>;
                inputField.classList.add('empty');
            } else if (possibleAnswers.includes(userAnswer)) {
                feedbackHtml += <span style="color: green; font-weight: bold;">Correcto, </span>;
                inputField.style.borderColor = 'green';
                score++;
                inputField.classList.remove('empty');
            } else {
                feedbackHtml += <span style="color: red; font-weight: bold;">Incorrecto, </span>;
                inputField.style.borderColor = 'red';
                inputField.classList.remove('empty');
            }
            total++;
        });
        feedbackElement.innerHTML = feedbackHtml.slice(0, -9) + '</span>';
    });
    document.getElementById('result').innerHTML = <p><strong>Tu nota:</strong> ${score} / ${total} (${(score / total * 100).toFixed(2)}%)</p>;
}

// Clear answers
function clearAnswers() {
    document.querySelectorAll('#quiz-form input').forEach(input => {
        input.value = '';
        input.style.borderColor = '';
        input.classList.remove('empty');
    });
    document.querySelectorAll('.feedback').forEach(feedback => {
        feedback.innerHTML = '';
    });
    document.getElementById('result').innerHTML = '';
}

// Reveal answers (teacher mode)
function revealAnswers() {
    questions.forEach((question, index) => {
        question.answers.forEach((correctAnswer, i) => {
            const inputField = document.getElementById(q${index + 1}_${i + 1});
            if (inputField) {
                inputField.value = correctAnswer;
                inputField.style.borderColor = 'purple';
            }
        });
    });
}

// Hide answers (teacher mode)
function hideAnswers() {
    questions.forEach((question, index) => {
        question.answers.forEach((_, i) => {
            const inputField = document.getElementById(q${index + 1}_${i + 1});
            if (inputField) {
                inputField.value = '';
                inputField.style.borderColor = '';
            }
        });
    });
}

// Initialize the app
window.onload = function() {
    // Set up class selector
    const savedClass = localStorage.getItem('selectedClass') || "Clase 6";
    document.getElementById('class-selector').value = savedClass;
    fetchQuestions(savedClass);
    fetchUserData("Users");
    // Set up event listeners
    document.getElementById('class-selector').addEventListener('change', function() {
        const selectedClass = this.value;
        localStorage.setItem('selectedClass', selectedClass);
        fetchQuestions(selectedClass);
        document.getElementById('result').innerHTML = '';
    });
    
    document.getElementById('check-button').addEventListener('click', function() {
        checkAnswers(questions);
    });
    
    document.getElementById('clear-button').addEventListener('click', clearAnswers);
    
    // Set up keyboard shortcuts for teachers only if logged in
    document.addEventListener("keydown", function (event) {
        if (isLoggedIn && (event.ctrlKey || event.metaKey) && event.shiftKey) {
            event.preventDefault();
            if (event.code === "KeyS") {
                revealAnswers();
            } else if (event.code === "KeyH") {
                hideAnswers();
            }
        }
    });
    
    // Initialize authentication
    setupAuthUI();
    checkLoginStatus();
};
