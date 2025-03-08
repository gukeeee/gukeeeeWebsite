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
    "Clase 6": 'https://docs.google.com/spreadsheets/d/1_zyDdNFB2K6xz4I4CdgOPhDChqy1drBrPJwA-9Hy7Ag/pub?output=csv',
    "Clase 7": 'https://docs.google.com/spreadsheets/d/17OGUPM0djxN6LweVHa2CWHgf31GYherET482JmBLJxk/pub?output=csv'
};

// Authentication system with signup and profile management

// Firebase configuration (you'll need to create a Firebase project)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Current user state
let currentUser = null;
let isLoggedIn = false;

let questions = []; // Global variable to store questions
let currentUser = null; // Authentication state management
let isLoggedIn = false; // Track if the user is logged in

// Check if user is already logged in
function checkLoginStatus() {
    auth.onAuthStateChanged(user => {
        if (user) {
            // Get user profile from Firestore
            db.collection('users').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        currentUser = {
                            uid: user.uid,
                            email: user.email,
                            username: doc.data().username,
                            displayName: doc.data().displayName
                        };
                        isLoggedIn = true;
                        updateUIForLoggedInUser();
                    }
                })
                .catch(error => {
                    console.error("Error fetching user data:", error);
                });
        } else {
            updateUIForLoggedOutUser();
        }
    });
}

// Setup authentication UI elements
function setupAuthUI() {
    const authBtn = document.getElementById('auth-btn');
    const signupBtn = document.getElementById('signup-btn');
    
    authBtn.addEventListener('click', function() {
        if (isLoggedIn) {
            showProfileModal();
        } else {
            showLoginForm();
        }
    });
    
    signupBtn.addEventListener('click', function() {
        showSignupForm();
    });
}

// Show login form modal
function showLoginForm() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    // Create login form
    const loginForm = document.createElement('div');
    loginForm.className = 'auth-form';
    
    loginForm.innerHTML = `
        <h2>Iniciar Sesión</h2>
        <div class="form-group">
            <label for="login-email">Correo electrónico:</label>
            <input type="email" id="login-email" required>
        </div>
        <div class="form-group">
            <label for="login-password">Contraseña:</label>
            <input type="password" id="login-password" required>
        </div>
        <div class="form-actions">
            <button id="login-btn" class="primary-btn">Ingresar</button>
            <button id="cancel-login-btn" class="secondary-btn">Cancelar</button>
        </div>
        <p id="login-error" class="error-message">Error al iniciar sesión</p>
        <p class="form-footer">¿No tienes una cuenta? <a href="#" id="show-signup">Regístrate aquí</a></p>
    `;
    
    overlay.appendChild(loginForm);
    document.body.appendChild(overlay);
    
    // Event listeners for login form
    document.getElementById('login-btn').addEventListener('click', function() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            document.getElementById('login-error').textContent = "Por favor completa todos los campos";
            document.getElementById('login-error').style.display = 'block';
            return;
        }
        
        loginUser(email, password);
    });
    
    document.getElementById('cancel-login-btn').addEventListener('click', function() {
        document.body.removeChild(overlay);
    });
    
    document.getElementById('show-signup').addEventListener('click', function() {
        document.body.removeChild(overlay);
        showSignupForm();
    });
}

// Show signup form modal
function showSignupForm() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    // Create signup form
    const signupForm = document.createElement('div');
    signupForm.className = 'auth-form';
    
    signupForm.innerHTML = `
        <h2>Crear Cuenta</h2>
        <div class="form-group">
            <label for="signup-email">Correo electrónico:</label>
            <input type="email" id="signup-email" required>
        </div>
        <div class="form-group">
            <label for="signup-username">Nombre de usuario:</label>
            <input type="text" id="signup-username" required>
        </div>
        <div class="form-group">
            <label for="signup-display-name">Nombre visible:</label>
            <input type="text" id="signup-display-name" required>
        </div>
        <div class="form-group">
            <label for="signup-password">Contraseña:</label>
            <input type="password" id="signup-password" required>
        </div>
        <div class="form-group">
            <label for="signup-confirm-password">Confirmar contraseña:</label>
            <input type="password" id="signup-confirm-password" required>
        </div>
        <div class="form-actions">
            <button id="signup-submit-btn" class="primary-btn">Registrarse</button>
            <button id="cancel-signup-btn" class="secondary-btn">Cancelar</button>
        </div>
        <p id="signup-error" class="error-message">Error en el registro</p>
        <p class="form-footer">¿Ya tienes una cuenta? <a href="#" id="show-login">Inicia sesión aquí</a></p>
    `;
    
    overlay.appendChild(signupForm);
    document.body.appendChild(overlay);
    
    // Event listeners for signup form
    document.getElementById('signup-submit-btn').addEventListener('click', function() {
        const email = document.getElementById('signup-email').value;
        const username = document.getElementById('signup-username').value;
        const displayName = document.getElementById('signup-display-name').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        
        // Validate inputs
        if (!email || !username || !displayName || !password || !confirmPassword) {
            document.getElementById('signup-error').textContent = "Por favor completa todos los campos";
            document.getElementById('signup-error').style.display = 'block';
            return;
        }
        
        if (password !== confirmPassword) {
            document.getElementById('signup-error').textContent = "Las contraseñas no coinciden";
            document.getElementById('signup-error').style.display = 'block';
            return;
        }
        
        // Check if username already exists
        db.collection('users')
            .where('username', '==', username)
            .get()
            .then(snapshot => {
                if (!snapshot.empty) {
                    document.getElementById('signup-error').textContent = "Este nombre de usuario ya está en uso";
                    document.getElementById('signup-error').style.display = 'block';
                } else {
                    createUser(email, username, displayName, password);
                }
            })
            .catch(error => {
                console.error("Error checking username:", error);
                document.getElementById('signup-error').textContent = "Error al verificar nombre de usuario";
                document.getElementById('signup-error').style.display = 'block';
            });
    });
    
    document.getElementById('cancel-signup-btn').addEventListener('click', function() {
        document.body.removeChild(overlay);
    });
    
    document.getElementById('show-login').addEventListener('click', function() {
        document.body.removeChild(overlay);
        showLoginForm();
    });
}

// Create a new user
function createUser(email, username, displayName, password) {
    // Create user with email and password
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Store additional user data in Firestore
            return db.collection('users').doc(userCredential.user.uid).set({
                email: email,
                username: username,
                displayName: displayName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            // Close the signup modal
            const overlay = document.querySelector('.modal-overlay');
            if (overlay) document.body.removeChild(overlay);
            
            // Show success message
            showNotification("Cuenta creada con éxito", "success");
        })
        .catch(error => {
            console.error("Error creating user:", error);
            document.getElementById('signup-error').textContent = getAuthErrorMessage(error.code);
            document.getElementById('signup-error').style.display = 'block';
        });
}

// Login user
function loginUser(email, password) {
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            // Close the login modal
            const overlay = document.querySelector('.modal-overlay');
            if (overlay) document.body.removeChild(overlay);
            
            // Show success message
            showNotification("Has iniciado sesión correctamente", "success");
        })
        .catch(error => {
            console.error("Error logging in:", error);
            document.getElementById('login-error').textContent = getAuthErrorMessage(error.code);
            document.getElementById('login-error').style.display = 'block';
        });
}

// Logout user
function logoutUser() {
    auth.signOut()
        .then(() => {
            currentUser = null;
            isLoggedIn = false;
            showNotification("Has cerrado sesión correctamente", "success");
        })
        .catch(error => {
            console.error("Error signing out:", error);
            showNotification("Error al cerrar sesión", "error");
        });
}

// Show profile modal
function showProfileModal() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    // Create profile form
    const profileForm = document.createElement('div');
    profileForm.className = 'auth-form profile-form';
    
    profileForm.innerHTML = `
        <h2>Mi Perfil</h2>
        <div class="form-group">
            <label for="profile-email">Correo electrónico:</label>
            <input type="email" id="profile-email" value="${currentUser.email}" disabled>
        </div>
        <div class="form-group">
            <label for="profile-username">Nombre de usuario:</label>
            <input type="text" id="profile-username" value="${currentUser.username}">
        </div>
        <div class="form-group">
            <label for="profile-display-name">Nombre visible:</label>
            <input type="text" id="profile-display-name" value="${currentUser.displayName}">
        </div>
        <div class="form-group">
            <label for="profile-current-password">Contraseña actual:</label>
            <input type="password" id="profile-current-password" placeholder="Requerido para actualizar">
        </div>
        <div class="form-group">
            <label for="profile-new-password">Nueva contraseña:</label>
            <input type="password" id="profile-new-password" placeholder="Dejar en blanco para no cambiar">
        </div>
        <div class="form-group">
            <label for="profile-confirm-password">Confirmar nueva contraseña:</label>
            <input type="password" id="profile-confirm-password" placeholder="Dejar en blanco para no cambiar">
        </div>
        <div class="form-actions">
            <button id="update-profile-btn" class="primary-btn">Actualizar perfil</button>
            <button id="logout-btn" class="warning-btn">Cerrar sesión</button>
            <button id="cancel-profile-btn" class="secondary-btn">Cancelar</button>
        </div>
        <p id="profile-error" class="error-message">Error actualizando perfil</p>
        <p id="profile-success" class="success-message">Perfil actualizado correctamente</p>
    `;
    
    overlay.appendChild(profileForm);
    document.body.appendChild(overlay);
    
    // Event listeners for profile form
    document.getElementById('update-profile-btn').addEventListener('click', function() {
        updateUserProfile();
    });
    
    document.getElementById('logout-btn').addEventListener('click', function() {
        document.body.removeChild(overlay);
        logoutUser();
    });
    
    document.getElementById('cancel-profile-btn').addEventListener('click', function() {
        document.body.removeChild(overlay);
    });
}

// Update user profile
function updateUserProfile() {
    const username = document.getElementById('profile-username').value;
    const displayName = document.getElementById('profile-display-name').value;
    const currentPassword = document.getElementById('profile-current-password').value;
    const newPassword = document.getElementById('profile-new-password').value;
    const confirmPassword = document.getElementById('profile-confirm-password').value;
    
    const profileError = document.getElementById('profile-error');
    const profileSuccess = document.getElementById('profile-success');
    
    profileError.style.display = 'none';
    profileSuccess.style.display = 'none';
    
    // Validate inputs
    if (!username || !displayName) {
        profileError.textContent = "Nombre de usuario y nombre visible son obligatorios";
        profileError.style.display = 'block';
        return;
    }
    
    if (!currentPassword) {
        profileError.textContent = "Contraseña actual requerida para actualizar perfil";
        profileError.style.display = 'block';
        return;
    }
    
    if (newPassword && newPassword !== confirmPassword) {
        profileError.textContent = "Las contraseñas no coinciden";
        profileError.style.display = 'block';
        return;
    }
    
    // Check if username already exists (if changed)
    if (username !== currentUser.username) {
        db.collection('users')
            .where('username', '==', username)
            .get()
            .then(snapshot => {
                if (!snapshot.empty) {
                    profileError.textContent = "Este nombre de usuario ya está en uso";
                    profileError.style.display = 'block';
                } else {
                    proceedWithProfileUpdate(username, displayName, currentPassword, newPassword);
                }
            })
            .catch(error => {
                console.error("Error checking username:", error);
                profileError.textContent = "Error al verificar nombre de usuario";
                profileError.style.display = 'block';
            });
    } else {
        proceedWithProfileUpdate(username, displayName, currentPassword, newPassword);
    }
}

// Proceed with profile update after validations
function proceedWithProfileUpdate(username, displayName, currentPassword, newPassword) {
    const profileError = document.getElementById('profile-error');
    const profileSuccess = document.getElementById('profile-success');
    
    // Re-authenticate user to verify current password
    const credential = firebase.auth.EmailAuthProvider.credential(
        auth.currentUser.email, 
        currentPassword
    );
    
    auth.currentUser.reauthenticateWithCredential(credential)
        .then(() => {
            // Update Firestore profile
            const userRef = db.collection('users').doc(auth.currentUser.uid);
            return userRef.update({
                username: username,
                displayName: displayName,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            // Update password if provided
            if (newPassword) {
                return auth.currentUser.updatePassword(newPassword);
            }
            return Promise.resolve();
        })
        .then(() => {
            // Update current user object
            currentUser.username = username;
            currentUser.displayName = displayName;
            
            // Update UI
            updateUIForLoggedInUser();
            
            // Show success message
            profileSuccess.textContent = "Perfil actualizado correctamente";
            profileSuccess.style.display = 'block';
            
            // Reset password fields
            document.getElementById('profile-current-password').value = '';
            document.getElementById('profile-new-password').value = '';
            document.getElementById('profile-confirm-password').value = '';
        })
        .catch(error => {
            console.error("Error updating profile:", error);
            profileError.textContent = getAuthErrorMessage(error.code);
            profileError.style.display = 'block';
        });
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    const authBtn = document.getElementById('auth-btn');
    const signupBtn = document.getElementById('signup-btn');
    
    // Update auth button
    authBtn.textContent = 'Mi Perfil';
    authBtn.className = 'profile-button logged-in';
    
    // Hide signup button
    signupBtn.style.display = 'none';
    
    // Create an element for the display name if it doesn't exist
    if (!document.getElementById('user-name-display')) {
        const userNameDisplay = document.createElement('span');
        userNameDisplay.id = 'user-name-display';
        userNameDisplay.textContent = currentUser.displayName;
        
        const userProfile = document.querySelector('.user-profile');
        userProfile.insertBefore(userNameDisplay, authBtn);
    } else {
        document.getElementById('user-name-display').textContent = currentUser.displayName;
    }
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
    const authBtn = document.getElementById('auth-btn');
    const signupBtn = document.getElementById('signup-btn');
    
    // Reset current user data
    currentUser = null;
    isLoggedIn = false;
    
    // Update auth button
    authBtn.textContent = 'Iniciar sesión';
    authBtn.className = 'profile-button';
    
    // Show signup button
    signupBtn.style.display = 'inline-block';
    
    // Remove the display name
    const userNameDisplay = document.getElementById('user-name-display');
    if (userNameDisplay) {
        userNameDisplay.remove();
    }
}

// Display notification message
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Get user-friendly error messages
function getAuthErrorMessage(errorCode) {
    switch(errorCode) {
        case 'auth/email-already-in-use':
            return "Este correo electrónico ya está registrado";
        case 'auth/invalid-email':
            return "El formato del correo electrónico no es válido";
        case 'auth/weak-password':
            return "La contraseña es demasiado débil";
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return "Usuario o contraseña incorrectos";
        default:
            return "Error de autenticación: " + errorCode;
    }
}

// Initialize the authentication system
function initializeAuthSystem() {
    // Update HTML structure for auth buttons
    const userProfile = document.querySelector('.user-profile');
    userProfile.innerHTML = `
        <button id="signup-btn" class="signup-button">Registrarse</button>
        <button id="auth-btn" class="profile-button">Iniciar sesión</button>
    `;
    
    // Set up event listeners
    setupAuthUI();
    
    // Check if user is already logged in
    checkLoginStatus();
}

// Call when the page loads
window.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase and Auth system
    initializeAuthSystem();
});

// Fetch questions from Google Sheets
// Fetch questions from Google Sheets
async function fetchQuestions(className) {
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
        
        // Debug info to help troubleshoot
        console.log(`Loaded ${questions.length} questions for ${className}`);
        
    } catch (error) {
        console.error("Error fetching questions:", error);
        // Provide user feedback
        const quizForm = document.getElementById('quiz-form');
        quizForm.innerHTML = '<p>Error cargando preguntas. Por favor intente de nuevo.</p>';
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
    fetchQuestions(savedClass);
    
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
