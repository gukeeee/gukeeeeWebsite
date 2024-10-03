function loadQuestions() {
    shuffleArray(questions);
    const quizForm = document.getElementById('quiz-form');
    quizForm.innerHTML = ''; // Clear any existing questions

    questions.forEach((question, index) => {
        // Split the question text by the placeholders
        const parts = question.text.split('__');
        // Create the question HTML
        const questionHtml = parts.map((part, i) => {
            if (i > 0) {
                return `<input type="text" id="q${index + 1}_${i}" placeholder="Tu respuesta aquí">${part}`;
            }
            return part; // The first part before the first blank
        }).join('');

        // Add a span for feedback next to each question
        quizForm.insertAdjacentHTML('beforeend', `<p>${index + 1}. ${questionHtml} <span id="feedback${index + 1}" class="feedback"></span></p>`);
    });
}

document.getElementById('check-button').addEventListener('click', function() {
    let score = 0;
    let total = 0;

    questions.forEach((question, index) => {
        const correctAnswers = question.answers.map(ans => ans.toLowerCase());
        let feedbackText = ''; // Start feedback for each question

        // Collect and check user answers
        for (let i = 0; i < correctAnswers.length; i++) {
            const userAnswer = document.getElementById(`q${index + 1}_${i + 1}`)?.value.trim().toLowerCase();

            // Check answers and provide feedback for each input
            if (userAnswer === correctAnswers[i]) {
                feedbackText += `<span style="color: green;">Correct</span> `;
                score++;
            } else {
                feedbackText += `<span style="color: red;">Incorrect</span> `;
            }
            total++;
        }

        // Update the feedback span next to each question
        document.getElementById(`feedback${index + 1}`).innerHTML = feedbackText;
    });

    // Show the final score
    document.getElementById('result').innerHTML = `<p>Tu nota: ${score} / ${total} (${(score / total * 100).toFixed(2)}%)</p>`;
});

window.onload = loadQuestions;
