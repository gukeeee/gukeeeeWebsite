const questions = [
    { text: 'Es improbable que alguien __ (desarrollar) algo hace poco porque es un problema muy grande.', answers: ['haya desarrollado'] },
    { text: '¡ __ nosotros (quejarse) de lo que está pasando ya!', answers: ['Quejémonos'] },
    { text: '¿Qué significa "quejarse" en inglés? Quiere decir __.', answers: ['to complain'] },
    { text: 'Puede ser que el Sr. Contreras __ (quejarse) porque siempre lo hace.', answers: ['se queje'] },
    { text: 'En clase, había unos chicos que __ a menudo del trabajo. (quejarse)', answers: ['se quejaban'] },
    { text: 'Los planes __ por los arquitectos son innovadores. (desarrollar)', answers: ['desarrollados'] },
    { text: 'Nadie aún no __ (desarrollar) algo para limpiar la contaminación al aire.', answers: ['ha desarrollado'] },
    { text: 'Mami y papi,¡ ya __ más que estamos agotados! (exigirnos)', answers: ['no nos exijan'] },
    { text: '¿Quién de Uds. __ (estirar) la liga (rubberband) tanto? --Lo siento, yo la __ (estirar) pensando que tenía más elasticidad.', answers: ['estiró', 'estiré'] },
    { text: 'Yo les __ mucho a mis hijos para tener un mejor futuro. (exigir)', answers: ['exijo'] },
    { text: 'Valentina, ¡__ sólo de las cosas que te importan más. ¡ __ de todo! (quejarse)', answers: ['quéjate', 'no te quejes'] },
    { text: 'La manta que está __ en la mesa es la que yo hice. (estirar)', answers: ['estirada'] },
    { text: 'La tarea __ de nosotros es casi imposible de lograr. (exigir)', answers: ['exigida'] },
    { text: '¿De qué __ vosotros cuando los vi ? (quejarse) (pasado progresivo)', answers: ['os estabais quejando'] },
    { text: '-- __ del servicio. (quejarse) (pasado progresivo)', answers: ['Nos estábamos quejando'] },
    { text: 'Hija, ¡__ antes de correr! (estirarse)', answers: ['estírate'] },
    { text: 'El equipo de correr __ en este momento porque los corredores van a competir en unos minutos. (estirarse)', answers: ['se está estirando'] },
    { text: 'Cuando era más pequeño mis padres me __ que yo saludara a mis abuela cuando íbamos a su casa. (exigir)', answers: ['exigían'] }
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
