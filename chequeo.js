// Sheet URLs for different classes
const SHEET_URLS = {
    "Clase 6": 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDujY9EaaiPwPnZq8PcHrSKKxHUkmaVn3nJY9DASaI8MhCw2hjECM5kFmCZUyUnQ_sigJ6acOj-Hqi/pub?output=csv',
    "Clase 7": 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSETEUaN_bm0xn7JOBNI-pngCABGgeCo_8h2PFKUbP7sg7jNNU-mtKVEso5kA1EHFfVWM2rcVD1j8ZZ/pub?output=csv'
};

let questions = []; // Global variable to store questions

// Hide quiz content
function hideQuizContent() {
    document.getElementById('quiz-form').style.display = 'none';
    document.getElementById('check-button').style.display = 'none';
    document.getElementById('clear-button').style.display = 'none';
    document.getElementById('result').style.display = 'none';
}

// Show quiz content
function showQuizContent() {
    document.getElementById('quiz-form').style.display = 'block';
    document.getElementById('check-button').style.display = 'inline-flex';
    document.getElementById('clear-button').style.display = 'inline-flex';
    document.getElementById('result').style.display = 'block';

    const loginMessage = document.getElementById('login-message');
    if (loginMessage) loginMessage.remove();
}

// Show login message prompting the user to sign in
function showLoginMessage() {
    if (document.getElementById('login-message')) return;

    const container = document.querySelector('.card');
    const loginMessage = document.createElement('div');
    loginMessage.id = 'login-message';
    loginMessage.className = 'empty-state';
    loginMessage.style.marginTop = 'var(--space-4)';
    loginMessage.innerHTML = `
        <h3 style="color: var(--color-accent); margin-bottom: 12px;">Inicie sesión para acceder al chequeo de verbos</h3>
        <p style="margin-bottom: 16px;">Para ver y completar el chequeo de verbos, debe iniciar sesión con su cuenta.</p>
        <button id="login-prompt-btn" class="btn btn-primary">Iniciar sesión</button>
    `;
    container.appendChild(loginMessage);
    document.getElementById('login-prompt-btn').addEventListener('click', () => Auth.openLoginModal());
}

// Fetch questions from Google Sheets
async function fetchQuestions(className) {
    if (!Auth.isLoggedIn()) return;

    try {
        const response = await fetch(SHEET_URLS[className]);
        const data = await response.text();

        // Split the CSV data into rows, handling quoted fields with embedded commas
        const rows = data.split("\n").map(row => {
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
            processedRow.push(currentField.trim());
            return processedRow;
        });

        questions = [];

        // Skip header rows (first 3 rows)
        for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 3 || !row[1]) continue;

            const questionText = row[1];
            const answers = row.slice(2).filter(answer => answer !== "");

            if (questionText && answers.length > 0) {
                questions.push({ text: questionText, answers });
            }
        }

        loadQuestions(questions);
        document.getElementById('result').innerHTML = '';
    } catch (error) {
        console.error("Error fetching questions:", error);
        document.getElementById('quiz-form').innerHTML = '<p>Error cargando preguntas. Por favor intente de nuevo.</p>';
    }
}

// Load questions into the form
function loadQuestions(questions) {
    if (!Auth.isLoggedIn()) return;

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
    if (!Auth.isLoggedIn()) return;

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
                feedbackHtml += `<span style="color: var(--color-warning); font-weight: bold;">Sin respuesta, </span>`;
                inputField.classList.add('empty');
            } else if (possibleAnswers.includes(userAnswer)) {
                feedbackHtml += `<span style="color: var(--color-success); font-weight: bold;">Correcto, </span>`;
                inputField.classList.remove('empty');
                inputField.classList.add('is-correct');
                inputField.classList.remove('is-incorrect');
                score++;
            } else {
                feedbackHtml += `<span style="color: var(--color-danger); font-weight: bold;">Incorrecto, </span>`;
                inputField.classList.remove('empty');
                inputField.classList.remove('is-correct');
                inputField.classList.add('is-incorrect');
            }
            total++;
        });
        feedbackElement.innerHTML = feedbackHtml.slice(0, -9) + '</span>';
    });
    document.getElementById('result').innerHTML = `<p><strong>Tu nota:</strong> ${score} / ${total} (${(score / total * 100).toFixed(2)}%)</p>`;
}

// Clear answers
function clearAnswers() {
    if (!Auth.isLoggedIn()) return;

    document.querySelectorAll('#quiz-form input').forEach(input => {
        input.value = '';
        input.classList.remove('empty', 'is-correct', 'is-incorrect');
    });
    document.querySelectorAll('.feedback').forEach(feedback => { feedback.innerHTML = ''; });
    document.getElementById('result').innerHTML = '';
}

// Reveal answers (teacher shortcut)
function revealAnswers() {
    if (!Auth.isLoggedIn()) return;
    questions.forEach((question, index) => {
        question.answers.forEach((correctAnswer, i) => {
            const inputField = document.getElementById(`q${index + 1}_${i + 1}`);
            if (inputField) {
                inputField.value = correctAnswer;
                inputField.style.borderColor = 'var(--color-primary)';
            }
        });
    });
}

// Hide answers (teacher shortcut)
function hideAnswers() {
    if (!Auth.isLoggedIn()) return;
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
window.onload = function () {
    const savedClass = localStorage.getItem('selectedClass') || "Clase 6";
    document.getElementById('class-selector').value = savedClass;

    document.getElementById('class-selector').addEventListener('change', function () {
        const selectedClass = this.value;
        localStorage.setItem('selectedClass', selectedClass);
        if (Auth.isLoggedIn()) {
            fetchQuestions(selectedClass);
            document.getElementById('result').innerHTML = '';
        }
    });

    document.getElementById('check-button').addEventListener('click', () => checkAnswers(questions));
    document.getElementById('clear-button').addEventListener('click', clearAnswers);

    document.addEventListener("keydown", function (event) {
        if (Auth.isLoggedIn() && (event.ctrlKey || event.metaKey) && event.shiftKey) {
            event.preventDefault();
            if (event.code === "KeyS") revealAnswers();
            else if (event.code === "KeyH") hideAnswers();
        }
    });

    Auth.onChange((user) => {
        if (user) {
            showQuizContent();
            fetchQuestions(document.getElementById('class-selector').value);
        } else {
            hideQuizContent();
            showLoginMessage();
        }
    });
};
