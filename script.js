const questions = [
    { text: '¿Cuál es la definición de "desmayarse"?', answers: ['to faint, to pass out / to pass out, to faint'] },
    { text: '¿Qué quiere decir "mejorarse"?', answers: ['to get well, to get better / to get better, to get well'] },
    { text: 'Tengo el dedo __ (doblarse) ahora por jugar al basquétbol. Creo que nunca __ (mejorarse).', answers: ['doblado', 'voy a mejorarme / me voy a mejorar'] },
    { text: 'A: ¿Cómo __ (doblarse) tú el tobillo la vez pasada? --- __ (chocarse) con otro jugador.', answers: ['te doblaste', 'me choqué'] },
    { text: 'Ninguno de mis amigos jamás __ (desmayarse).', answers: ['se ha desmayado'] },
    { text: 'Como enfermera veo mucho. Pienso que tú __ (doblarse) el tobillo. Para __ (mejorarse) es mejor que descanses el pie.', answers: ['te has doblado', 'mejorarte'] },
    { text: 'Es bueno __ (mejorarse) lo más rápido para no perder tantos días de escuela.', answers: ['mejorarse'] },
    { text: 'Marina, ¡ __ (desmayarse) cuando estés cantando! ¡Come algo antes!', answers: ['no te desmayes'] },
    { text: 'Chicos, ¡ __ (mejorarse) pronto para poder ir al cine este fin de semana! (En España)', answers: ['mejoraos'] },
    { text: 'Ayer, por no haber comido, alguien __ (desmayarse). ¡Felizmente, no __ (chocarse) con algo cuando se cayó!', answers: ['se desmayó', 'se chocó'] },
    { text: 'Dani, es cierto que siempre __ (chocarse) con todo cuando eras más chico.', answers: ['te chocabas'] },
    { text: 'Es claro que los chicos __ (mejorarse) porque veo que ya quieren comer. (presente progresivo)', answers: ['se están mejorando / están mejorándose'] },
    { text: 'Para __ (mejorarse), tengo que descansar más.', answers: ['mejorarme'] },
    { text: '¡ __ (chocarse) vosotros con otros jugadores!', answers: ['no os choquéis'] },
    { text: 'De más pequeñas, nosotras __ (desmayarse) cada vez que nos sacaban sangre.', answers: ['nos desmayábamos'] },
    { text: '¡ __ (chocarse) nosotros con nadie, por favor!', answers: ['no nos choquemos'] }
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
            const possibleAnswers = correctAnswer.toLowerCase().split(' / ');

            if (!userAnswer) {
                feedbackHtml += `<span style="color: GoldenRod; font-weight: bold;">Sin respuesta, </span>`;
                inputField.classList.add('empty');
            } 
            else if (possibleAnswers.includes(userAnswer)) {
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
        feedbackHtml = feedbackHtml.slice(0, -9) + '</span>';
        feedbackElement.innerHTML = feedbackHtml;
    });

    document.getElementById('result').innerHTML = `<p><strong>Tu nota:</strong> ${score} / ${total} (${(score / total * 100).toFixed(2)}%)</p>`;
});

window.onload = loadQuestions;
