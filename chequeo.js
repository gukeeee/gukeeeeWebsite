let USERS = [];

async function fetchUsers() {
    try {
        const response = await fetch("https://gist.githubusercontent.com/gukeeee/76c792fec2bb289e73fd05cc6a93159c/raw");
        const data = await response.json();
        USERS = data.USERS;
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

fetchUsers(); // Call the function


// Sheet URLs for different classes
const SHEET_URLS = {
    "Clase 6": 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDujY9EaaiPwPnZq8PcHrSKKxHUkmaVn3nJY9DASaI8MhCw2hjECM5kFmCZUyUnQ_sigJ6acOj-Hqi/pub?output=csv',
    "Clase 7": 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSETEUaN_bm0xn7JOBNI-pngCABGgeCo_8h2PFKUbP7sg7jNNU-mtKVEso5kA1EHFfVWM2rcVD1j8ZZ/pub?output=csv'
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
        showQuizContent(); // Show quiz content for logged in users
    } else {
        hideQuizContent(); // Hide quiz content for users who aren't logged in
        showLoginMessage(); // Show message prompting user to log in
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
    
    // Show quiz content
    showQuizContent();
    
    // Fetch questions for the selected class
    const selectedClass = document.getElementById('class-selector').value;
    fetchQuestions(selectedClass);
}

// Logout user
function logoutUser() {
    currentUser = null;
    isLoggedIn = false; // Set login status to false upon logout
    localStorage.removeItem('currentUser');
    
    // Update UI
    updateUIForLoggedOutUser();
    
    // Hide quiz content
    hideQuizContent();
    
    // Show login message
    showLoginMessage();
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    const signInBtn = document.getElementById('sign-in-btn');
    
    // Change sign in button to sign out
    signInBtn.textContent = 'Cerrar sesión';
    
    // Create an element for the display name if not exists
    if (!document.getElementById('user-name-display')) {
        const userNameDisplay = document.createElement('span');
        userNameDisplay.id = 'user-name-display';
        userNameDisplay.textContent = currentUser.displayName;
        
        // Insert before the sign in button in the nav-buttons div
        const navButtons = document.querySelector('.nav-buttons');
        navButtons.insertBefore(userNameDisplay, signInBtn);
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

// Hide quiz content
function hideQuizContent() {
    // Hide form and buttons
    document.getElementById('quiz-form').style.display = 'none';
    document.getElementById('check-button').style.display = 'none';
    document.getElementById('clear-button').style.display = 'none';
    document.getElementById('result').style.display = 'none';
}

// Show quiz content
function showQuizContent() {
    // Show form and buttons
    document.getElementById('quiz-form').style.display = 'block';
    document.getElementById('check-button').style.display = 'inline-block';
    document.getElementById('clear-button').style.display = 'inline-block';
    document.getElementById('result').style.display = 'block';
    
    // Remove login message if exists
    const loginMessage = document.getElementById('login-message');
    if (loginMessage) {
        loginMessage.remove();
    }
}

// Show login message
function showLoginMessage() {
    // Check if message already exists
    if (!document.getElementById('login-message')) {
        const container = document.querySelector('.container');
        const heading = container.querySelector('h1');
        
        const loginMessage = document.createElement('div');
        loginMessage.id = 'login-message';
        loginMessage.style.textAlign = 'center';
        loginMessage.style.margin = '30px 0';
        loginMessage.style.padding = '20px';
        loginMessage.style.borderRadius = '8px';
        loginMessage.style.backgroundColor = '#f8f9fa';
        loginMessage.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        
        loginMessage.innerHTML = `
            <h3 style="color: #007bff; margin-bottom: 15px;">Inicie sesión para acceder al chequeo de verbos</h3>
            <p style="font-size: 16px; margin-bottom: 20px;">Para ver y completar el chequeo de verbos, debe iniciar sesión con su cuenta.</p>
            <button id="login-prompt-btn" class="blue-button" style="margin: 0 auto; display: block;">Iniciar sesión</button>
        `;
        
        // Insert after the heading
        heading.parentNode.insertBefore(loginMessage, heading.nextSibling);
        
        // Add event listener for the login button
        document.getElementById('login-prompt-btn').addEventListener('click', showLoginForm);
    }
}

// Fetch questions from Google Sheets
async function fetchQuestions(className) {
    // Only fetch questions if user is logged in
    if (!isLoggedIn) return;
    
    try {
        const response = await fetch(SHEET_URLS[className]);
        const data = await response.text();
        
        // Split the CSV data into rows
        const rows = data.split("\n").map(row => {
            // Handle quoted fields correctly (CSV can have commas inside quotes)
            const processedRow = [];
            let inQuotes = false;
            let currentField = '';
            
            for (let i = 0; i < row.length; i++) {
                const char = row[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    processedRow.push(currentField.trim());
                    currentField = '';
                } else {
                    currentField += char;
                }
            }
            
            // Add the last field
            processedRow.push(currentField.trim());
            return processedRow;
        });
        
        // Reset global questions array
        questions = [];
        
        // Skip header rows (first 3 rows)
        for (let i = 3; i < rows.length; i++) {
            const row = rows[i];
            
            // Skip empty rows
            if (row.length < 3 || !row[1]) continue;
            
            const questionText = row[1];
            const answers = row.slice(2).filter(answer => answer !== "");
            
            if (questionText && answers.length > 0) {
                questions.push({ text: questionText, answers });
            }
        }
        
        // After parsing, load the questions into the UI
        loadQuestions(questions);
        
        // Clear previous results when switching classes
        document.getElementById('result').innerHTML = '';        
    } catch (error) {
        console.error("Error fetching questions:", error);
        // Provide user feedback
        const quizForm = document.getElementById('quiz-form');
        quizForm.innerHTML = '<p>Error cargando preguntas. Por favor intente de nuevo.</p>';
    }
}

// Load questions into the form
function loadQuestions(questions) {
    // Only load questions if user is logged in
    if (!isLoggedIn) return;
    
    const quizForm = document.getElementById('quiz-form');
    quizForm.innerHTML = '';
    questions.forEach((question, index) => {
        const parts = question.text.split('_');
        const questionHtml = parts.map((part, i) => {
            if (i > 0) {
                return `<input type="text" id="q${index + 1}_${i}" placeholder="Tu respuesta aquí">${part}`;
            }
            return part;
        }).join('');
        const questionElement = `
            <p id="question-${index + 1}">${index + 1}. ${questionHtml}</p>
            <div id="feedback-q${index + 1}" class="feedback"></div>
        `;
        quizForm.insertAdjacentHTML('beforeend', questionElement);
    });
}

// Check answers
function checkAnswers(questions) {
    // Only check answers if user is logged in
    if (!isLoggedIn) return;
    
    let score = 0;
    let total = 0;
    questions.forEach((question, index) => {
        const feedbackElement = document.getElementById(`feedback-q${index + 1}`);
        let feedbackHtml = `<strong>Q${index + 1}:</strong> `;
        question.answers.forEach((correctAnswer, i) => {
            const inputField = document.getElementById(`q${index + 1}_${i + 1}`);
            const userAnswer = inputField?.value.trim().toLowerCase();
            const possibleAnswers = correctAnswer.toLowerCase().split(' / ');
            if (!userAnswer) {
                feedbackHtml += `<span style="color: GoldenRod; font-weight: bold;">Sin respuesta, </span>`;
                inputField.classList.add('empty');
            } else if (possibleAnswers.includes(userAnswer)) {
                feedbackHtml += `<span style="color: green; font-weight: bold;">Correcto, </span>`;
                inputField.style.borderColor = 'green';
                score++;
                inputField.classList.remove('empty');
            } else {
                feedbackHtml += `<span style="color: red; font-weight: bold;">Incorrecto, </span>`;
                inputField.style.borderColor = 'red';
                inputField.classList.remove('empty');
            }
            total++;
        });
        feedbackElement.innerHTML = feedbackHtml.slice(0, -9) + '</span>';
    });
    document.getElementById('result').innerHTML = `<p><strong>Tu nota:</strong> ${score} / ${total} (${(score / total * 100).toFixed(2)}%)</p>`;
}

// Clear answers
function clearAnswers() {
    // Only clear answers if user is logged in
    if (!isLoggedIn) return;
    
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
    // Only reveal answers if user is logged in
    if (!isLoggedIn) return;
    
    questions.forEach((question, index) => {
        question.answers.forEach((correctAnswer, i) => {
            const inputField = document.getElementById(`q${index + 1}_${i + 1}`);
            if (inputField) {
                inputField.value = correctAnswer;
                inputField.style.borderColor = 'purple';
            }
        });
    });
}

// Hide answers (teacher mode)
function hideAnswers() {
    // Only hide answers if user is logged in
    if (!isLoggedIn) return;
    
    questions.forEach((question, index) => {
        question.answers.forEach((_, i) => {
            const inputField = document.getElementById(`q${index + 1}_${i + 1}`);
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
    
    // Set up event listeners
    document.getElementById('class-selector').addEventListener('change', function() {
        const selectedClass = this.value;
        localStorage.setItem('selectedClass', selectedClass);
        
        // Only fetch questions if user is logged in
        if (isLoggedIn) {
            fetchQuestions(selectedClass);
            document.getElementById('result').innerHTML = '';
        }
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
    
    // Only fetch questions if user is logged in
    if (isLoggedIn) {
        fetchQuestions(savedClass);
    }
};

// Show login form with animation
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
    
    // Trigger animation after a small delay (for DOM to update)
    setTimeout(() => {
        overlay.classList.add('visible');
    }, 10);
    
    // Add event listeners for login form buttons
    document.getElementById('login-btn').addEventListener('click', function() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const user = USERS.find(u => u.username === username && u.password === password);
        
        if (user) {
            loginUser(user);
            closeLoginForm(overlay);
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    });
    
    document.getElementById('cancel-btn').addEventListener('click', function() {
        closeLoginForm(overlay);
    });
    
    // Close form when clicking outside
    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            closeLoginForm(overlay);
        }
    });
}

// Close login form with animation
function closeLoginForm(overlay) {
    overlay.classList.add('closing');
    overlay.classList.remove('visible');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
        document.body.removeChild(overlay);
    }, 300); // Match this with CSS transition duration
}
