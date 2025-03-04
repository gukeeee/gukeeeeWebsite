const SHEET_URL = 'https://docs.google.com/spreadsheets/d/17OGUPM0djxN6LweVHa2CWHgf31GYherET482JmBLJxk/pub?output=csv';

async function fetchQuestions() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        const rows = data.split("\n").map(row => row.split(","));
        
        let questions = [];

        rows.forEach(row => {
            let questionText = row[0].trim(); // A1, A2, A3... (Question)
            let answers = row.slice(1).map(answer => answer.trim()).filter(answer => answer !== ""); // B1-Z1 (Answers)
            
            if (questionText && answers.length > 0) {
                questions.push({ text: questionText, answers });
            }
        });

        loadQuestions(questions);
    } catch (error) {
        console.error("Error fetching questions:", error);
    }
}

function loadQuestions(questions) {
    shuffleArray(questions);
    const quizForm = document.getElementById('quiz-form');
    quizForm.innerHTML = '';

    questions.forEach((question, index) => {
        const parts = question.text.split('__');
        const questionHtml = parts.map((part, i) => {
            if (i > 0) {
                return `<input type="text" id="q${index + 1}_${i}" placeholder="Tu respuesta aquí">${part}`;
            }
            return part;
        }).join('');

        quizForm.insertAdjacentHTML('beforeend', `<p id="question-${index + 1}">${index + 1}. ${questionHtml}</p><div id="feedback-q${index + 1}" class="feedback"></div>`);
    });

    document.getElementById('check-button').addEventListener('click', function() {
        checkAnswers(questions);
    });

    document.getElementById('clear-button').addEventListener('click', clearAnswers);
}

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

function revealAnswers(questions) {
    questions.forEach((question, index) => {
        question.answers.forEach((correctAnswer, i) => {
            const inputField = document.getElementById(`q${index + 1}_${i + 1}`);
            if (inputField) {
                inputField.value = correctAnswer;  // Fill in correct answer
                inputField.style.borderColor = 'purple';  // Highlight answer
            }
        });
    });
}

function hideAnswers(questions) {
    questions.forEach((question, index) => {
        question.answers.forEach((correctAnswer, i) => {
            const inputField = document.getElementById(`q${index + 1}_${i + 1}`);
            if (inputField) {
                inputField.value = '';  // Clear answer
                inputField.style.borderColor = '';  // Clear highlight
            }
        });
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Hotkeys for revealing/hiding answers
document.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
        event.preventDefault();
        if (event.code === "KeyS") {
            revealAnswers(questions);
        } else if (event.code === "KeyH") {
            hideAnswers(questions);
        }
    }
});

window.onload = fetchQuestions;
