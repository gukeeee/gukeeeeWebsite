const SHEET_URLS = {
    "Clase 6": 'https://docs.google.com/spreadsheets/d/1_zyDdNFB2K6xz4I4CdgOPhDChqy1drBrPJwA-9Hy7Ag/pub?output=csv',
    "Clase 7": 'https://docs.google.com/spreadsheets/d/17OGUPM0djxN6LweVHa2CWHgf31GYherET482JmBLJxk/pub?output=csv'
};

let questions = []; // Global variable to store questions

async function fetchQuestions(className) {
    try {
        const response = await fetch(SHEET_URLS[className]);
        const data = await response.text();
        const rows = data.split("\n").map(row => row.split(","));

        questions = []; // Reset global questions array

        for (let i = 2; i < rows.length; i++) { // Start from index 2 (B3)
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

document.getElementById('class-selector').addEventListener('change', function() {
    const selectedClass = this.value;
    localStorage.setItem('selectedClass', selectedClass);
    fetchQuestions(selectedClass);
    document.getElementById('result').innerHTML = '';
});

window.onload = function() {
    const savedClass = localStorage.getItem('selectedClass') || "Clase 6";
    document.getElementById('class-selector').value = savedClass;
    fetchQuestions(savedClass);
};

document.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
        event.preventDefault();
        if (event.code === "KeyS") {
            revealAnswers();
        } else if (event.code === "KeyH") {
            hideAnswers();
        }
    }
});

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
