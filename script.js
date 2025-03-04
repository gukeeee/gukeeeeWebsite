const SHEET_URLS = {
    "Clase 6": 'https://docs.google.com/spreadsheets/d/1_zyDdNFB2K6xz4I4CdgOPhDChqy1drBrPJwA-9Hy7Ag/pub?output=csv',
    "Clase 7": 'https://docs.google.com/spreadsheets/d/17OGUPM0djxN6LweVHa2CWHgf31GYherET482JmBLJxk/pub?output=csv'
};

async function fetchQuestions(className) {
    try {
        const response = await fetch(SHEET_URLS[className]);
        const data = await response.text();
        const rows = data.split("\n").map(row => row.split(","));
        
        let questions = [];

        // Start processing from row 2 (B2) onwards and treat columns as follows
        // B2: Question Text, C2-Z2: Answers
        for (let i = 1; i < rows.length; i++) { // Skip the header row (A1)
            const row = rows[i].map(cell => cell.trim());
            
            // The question text will be in column B (index 1)
            let questionText = row[1]; // Question is in column B (index 1)
            
            // The possible answers will be in columns C to Z (index 2 to 25)
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
    quizForm.innerHTML = ''; // Clear any existing questions

    questions.forEach((question, index) => {
        const parts = question.text.split('_'); // Split question text if it's formatted with __ as placeholders
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

    // Ensure the buttons are still functional
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

// Event listener for class selection
document.getElementById('class-selector').addEventListener('change', function() {
    fetchQuestions(this.value); // Fetch questions for the selected class
});

// Load default on page load (Clase 6)
window.onload = function() {
    fetchQuestions("Clase 6");
};
