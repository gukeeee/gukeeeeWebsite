const SHEET_URLS = {
    "Clase6": 'https://docs.google.com/spreadsheets/d/1_zyDdNFB2K6xz4I4CdgOPhDChqy1drBrPJwA/pub?output=csv',
    "Clase7": 'https://docs.google.com/spreadsheets/d/17OGUPM0djxN6LweVHa2CWHgf31GYherET482JmBLJxk/pub?output=csv'
};

async function fetchQuestions(className) {
    try {
        const response = await fetch(SHEET_URLS[className]);
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

// Load default class (Clase 6)
document.getElementById('class-selector').addEventListener('change', function() {
    fetchQuestions(this.value);
});

// Load default on page load
window.onload = function() {
    fetchQuestions("Clase6");
};
