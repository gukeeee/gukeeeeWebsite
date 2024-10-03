const questions = [
    { text: 'Las obras de Shakespeare son __ (conocer, saber) por todo el mundo. El año pasado yo __ (saber, conocer) que mi abuelo __ (tener) una colección de muchas de sus obras por décadas.', answers: ['conocidas', 'supe', 'ha tenido'] },
    { text: 'Anteanoche, mientras los estudiantes hacían su tarea, hubo un apagón. Desafortunadamente, nadie __ (poder) terminarla porque la luz no volvió hasta muy tarde. El problema es tan grande que hasta hoy hay gente que __ (tener) problemas ahora mismo.', answers: ['pudo', 'está teniendo'] },
    { text: 'Señores, ¡ __ (tener) más cuidado con lo que dicen, hay niños presentes!', answers: ['tengan'] },
    { text: 'Desde el momento que entré, yo __ (tener) la sensación que alguien me ha estado mirando. --¿ __ (saber, conocer) tú a quién me refiero? ¿Lo has visto tú?', answers: ['he tenido', 'Sabes'] },
    { text: 'Al __ (saber, conocer) la verdad, nosotros __ (tener) que irnos hace un rato. Ahora no __ (tener) dónde quedarnos. ¿Nos __ (poder) ayudar Ud. encontrar alojamiento?', answers: ['saber', 'tuvimos', 'tenemos', 'puede'] },
    { text: 'Ayer, yo __ (saber, conocer) a la novia de mi hermano por primera vez. Yo no __ (saber, conocer) que ella era ingeniera y que ella __ (tener) una hija de cinco años. Ella la __ (tener) cuando estaba en la universidad.', answers: ['conocí', 'sabía', 'tenía', 'tuvo'] },
    { text: 'Lila, ¿ __ (poder) (pretérito perfecto) terminar lo que te pedí? ---Lo siento, no lo __ (poder) hacer todavía.', answers: ['has podido', 'he podido'] },
    { text: 'Las definiciones en inglés de tener son __.', answers: ['to have, to be'] },
    { text: 'Vosotros lo __ (saber, conocer) (pretérito perfecto) a Tito desde que era chico porque les sorprende verlo hacerse el payaso ahora.', answers: ['habéis conocido'] }
];

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function loadQuestions() {
    shuffleArray(questions);
    const quizForm = document.getElementById('quiz-form');
    quizForm.innerHTML = ''; // Clear any existing questions

    questions.forEach((question, index) => {
        // Split the question text by the placeholders
        const parts = question.text.split('__');
        // Create the question HTML with feedback span next to each input
        const questionHtml = parts.map((part, i) => {
            if (i > 0) {
                return `<input type="text" id="q${index + 1}_${i}" placeholder="Tu respuesta aquí">${part}`;
            }
            return part; // The first part before the first blank
        }).join('');

        quizForm.insertAdjacentHTML('beforeend', `<p id="question-${index + 1}">${index + 1}. ${questionHtml}</p><div id="feedback-q${index + 1}" class="feedback"></div>`);
    });
}

document.getElementById('check-button').addEventListener('click', function() {
    let score = 0;
    let total = 0;

    questions.forEach((question, index) => {
        const correctAnswers = question.answers.map(ans => ans.toLowerCase());
        const feedbackElement = document.getElementById(`feedback-q${index + 1}`);
        let feedbackHtml = `<strong>Q${index + 1}:</strong> `;

        // Collect user answers and provide feedback for each input box
        correctAnswers.forEach((correctAnswer, i) => {
            const userAnswer = document.getElementById(`q${index + 1}_${i + 1}`)?.value.trim().toLowerCase();

            // Check if the user's answer is correct
            if (userAnswer === correctAnswer) {
                feedbackHtml += `<span style="color: green; font-weight: bold;">Correcto</span> `;
                score++;
            } else {
                feedbackHtml += `<span style="color: red; font-weight: bold;">Incorrecto</span> `;
            }
            total++;
        });

        // Display the feedback for this question
        feedbackElement.innerHTML = feedbackHtml;
    });

    // Display the total score in the result section
    document.getElementById('result').innerHTML = `<p><strong>Tu nota:</strong> ${score} / ${total} (${(score / total * 100).toFixed(2)}%)</p>`;
});

window.onload = loadQuestions;
