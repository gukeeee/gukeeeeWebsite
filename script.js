const questions = [
    { text: '¡ __ nosotros que vamos a estar de vacaciones en unos días! (alegrarse). No hay que __ (temer) las conferencias porque nos van a ayudar ser mejores estudiantes.', answers: ['Alegrémonos', 'temer'] },
    { text: 'Los hermanos de Lila son más __ (atreverse) que ella porque suelen no __ (temer) nada.', answers: ['atrevidos', 'temer'] },
    { text: 'Siento mucho que mis hijos __ (atreverse) anoche a llevarse la frutas de sus árboles. Yo __ (alegrarse) que Uds. me hayan llamado para disciplinarlos.', answers: ['se hayan atrevido', 'me alegro'] },
    { text: 'Yo te __ (agradecer) mucho por la ayuda que siempre me das, Lisenia. Nunca __ (temer) (mandato) en pedirme cualquier cosa.', answers: ['agradezco', 'temas'] },
    { text: 'Espero que tú __ (alegrarse) cuando recibiste las buenas noticias.', answers: ['te hayas alegrado'] },
    { text: '¡ __ vosotros a saltar! (atreverse) (mandato +). ¡ __ caeros que estoy aquí! (temer) (mandato - )', answers: ['Atreveos', 'No temáis'] },
    { text: 'No __ Uds. (temer) (mandato) la verdad; es mejor saber que vivir en una burbuja de mentiras.', answers: ['teman'] },
    { text: 'De pequeñas, vosotras nunca __ (atreverse) a contradecir a vuestros padres. Tú en particular, __ (temer) hacerlos llorar.', answers: ['os atrevíais', 'temías'] },
    { text: '¿Quién de Uds. __ (temer) venir a vernos? (imperfecto) Fue Julio que no __ (atreverse) (imperfecto) a venir.', answers: ['temía', 'se atrevía'] },
    { text: 'La clase __ (alegrarse) al saber que no iba a haber un examen antes de las vacaciones.', answers: ['se alegró'] },
    { text: 'Yo estoy tan __ por todo lo que tengo en mi vida. (agradecer)', answers: ['agradecido'] },
    { text: 'Nosotros le __ (agradecer) (imperfecto progresivo) a la consejera por su ayuda cuando sonó el timbre.', answers: ['estábamos agradeciendo'] },
    { text: 'Ojalá que Uds. __ (agradecer) a sus padres todos los días por todo lo que hacen por Uds.', answers: ['agradezcan'] }
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
