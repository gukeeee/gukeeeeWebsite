const questions = [
    { text: '¡Tengamos cuidado y __ (arañarse) al abrir la caja porque podríamos __ (hacerse) un gran daño.', answers: ['no nos arañemos', 'hacernos'] },
    { text: 'La definición de arañarse es __ y de lastimarse es __.', answers: ['to scratch', 'to hurt oneself, to injure oneself / to injure oneself, to hurt oneself'] },
    { text: 'Niña,¡ __ (rascarse) o vas a crear una herida más grande! Es mejor que no __ (hacerse) más daño.', answers: ['no te rasques', 'te hagas'] },
    { text: 'Últimamente, mis amigos y yo __ (lastimarse) (pretérito perfecto) varias veces haciendo ejercicio. Tenemos las piernas todas __ (arañarse) por chocarnos con las barras.', answers: ['nos hemos lastimado', 'arañadas'] },
    { text: 'Busque atención médica inmediatamente si se cae o __.', answers: ['se lastima'] },
    { text: 'Hubo un accidente ayer en la carretera. Es bueno que nadie __ (lastimarse) gravemente, pero sé que María __ (hacerse) daño al brazo porque la he visto hoy con un yeso.', answers: ['se haya lastimado', 'se hizo'] },
    { text: 'De jóvenes, Uds. siempre __ (arañarse) sin darse cuenta.', answers: ['se arañaban'] },
    { text: 'Si tienes un picazón (itch), ¡__ (rascarse), pero no me digas después que __ (lastimarse) (pretérito perfecto)!', answers: ['ráscate', 'te has lastimado'] },
    { text: 'Dale una crema a ese niño que __ (rascarse) en este momento antes de que __ (hacerse) (subjuntivo) más daño.', answers: ['se está rascando / está rascándose', 'se haga'] },
    { text: 'Mis hijos jamás __ (lastimarse) como mi sobrino.', answers: ['se han lastimado'] },
    { text: 'Cuando yo era pequeño siempre __ (arañarse) con las ramas de los árboles. Felizmente, nunca __ (hacerse) daño.', answers: ['me arañaba', 'me hice'] },
    { text: '¡__ (Rascarse) nosotros el bolsillo con las personas que sufren!', answers: ['Rasquémonos'] }
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
