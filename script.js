const questions = [
    { text: 'Cuando vosotros __ (comprometerse) a hacer algo, yo siempre podía contar con vosotros.', answers: ['os comprometíais'] },
    { text: 'No lo ves, es obvio que está __ (arrepentirse).', answers: ['arrepentido'] },
    { text: 'Cada vez que tú mientes, __ (arrepentirse) porque sabes que tu mamá la descubrirá.', answers: ['te arrepientes'] },
    { text: 'Señoritas García, ¡ __ de alguien que las quiera y las trate bien y no de alguien que no las valore! (enamorarse)', answers: ['enamórense'] },
    { text: 'Ay, ya tú __ de un chico nuevo otra vez. (enamorarse)', answers: ['te has enamorado'] },
    { text: 'Nosotros no __ de haber venido todavía. (arrepentirse) (pretérito perfecto)', answers: ['nos hemos arrepentido'] },
    { text: 'Octavia, ¡ __ (comprometerse) a ser amable con todos!', answers: ['comprométete'] },
    { text: 'Ayer vi a Roberto que __ con otra mujer en la fiesta mientras su esposa estaba ayudando a su amiga. (coquetear)', answers: ['coqueteaba'] },
    { text: 'Sr. Oso, ¡ __ (coquetear) (M-) con sus colegas porque todas están __ (comprometerse)!', answers: ['no coquetee', 'comprometidas'] },
    { text: 'Mis padres me dijeron, hija, ¡ __ hasta que tengas treinta años! (comprometerse) porque piensan que primero tengo que establecerme en mi profesión.', answers: ['no te comprometas'] },
    { text: 'Alejandra __ a ayudarme el otro día. (comprometerse)', answers: ['se comprometió'] },
    { text: 'Olga __ (enamorarse) de Salvador, la primera vez que lo vio hace diez años. Cuando ellos __ (comprometerse) sólo tenían veinte años.', answers: ['se enamoró', 'se comprometieron'] },
    { text: '¿Qué significa "arrepentirse"? Significa __.', answers: ['to regret'] },
    { text: 'Antonio, ¿Por qué no __ con la rubia que te está mirando a cada rato. (coquetear) Si no lo haces, vas a __. (arrepentirse)', answers: ['coqueteas', 'arrepentirte'] },
    { text: 'Yo __ de venir más y más. (arrepentirse) (presente progresivo)', answers: ['estoy arrepintiéndome / me estoy arrepintiendo'] },
    { text: 'Es muy claro que esa pareja que acaba de __ (comprometerse) está __ (enamorarse).', answers: ['comprometerse', 'enamorada'] }
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
        const feedbackElement = document.getElementById(`feedback-q${index + 1}`);
        let feedbackHtml = `<strong>Q${index + 1}:</strong> `;

        question.answers.forEach((correctAnswer, i) => {
            const inputField = document.getElementById(`q${index + 1}_${i + 1}`);
            const userAnswer = inputField?.value.trim().toLowerCase();
            const possibleAnswers = correctAnswer.toLowerCase().split(' / '); // Split by slash

            // Check if the input is empty
            if (!userAnswer) {
                feedbackHtml += `<span style="color: #CCCC00; font-weight: bold;">Sin respuesta</span> `;
                inputField.classList.add('empty'); // Add empty class for darker yellow
            } 
            // Check if the user's answer matches any of the possible correct answers
            else if (possibleAnswers.includes(userAnswer)) {
                feedbackHtml += `<span style="color: green; font-weight: bold;">Correcto</span> `;
                inputField.style.borderColor = 'green'; // Set border to green for correct answers
                score++;
                inputField.classList.remove('empty'); // Remove empty class if answered
            } else {
                feedbackHtml += `<span style="color: red; font-weight: bold;">Incorrecto</span> `;
                inputField.style.borderColor = 'red'; // Set border to red for incorrect answers
                inputField.classList.remove('empty'); // Remove empty class if answered
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
