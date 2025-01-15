const questions = [
    { 
        text: 'Sofi, ¿a qué universidades ya __ (to apply)? -- A diez, porque sabes que en la vida nada es __ (to guarantee); hay que luchar siempre.', 
        answers: ['has solicitado', 'garantizado'] 
    },
    { 
        text: 'Chicos, ¡__ (to protect) vuestras cosas que hay ladrones por todas partes!', 
        answers: ['protejed'] 
    },
    { 
        text: 'Mi compañero de clase me __ (guarantee) (pluscuamperfecto) antes de empezar el proyecto que él __ (was taking care of) editar la presentación.', 
        answers: ['había garantizado', 'se encargaba de'] 
    },
    { 
        text: 'Yo __ (to see to) traer todas las bebidas para la fiesta. Y tú, ¿De qué ya __ (to see to) (pretérito perfecto) traer?', 
        answers: ['me encargo de', 'te has encargado de'] 
    },
    { 
        text: 'Cuando eras chico, ¿quién te __ a ti? (to protect). -- Era mi hermana mayor porque ella __ mí. (to be in charge of)', 
        answers: ['protegía', 'se encargaba de'] 
    },
    { 
        text: 'Espero que Iván __ (handles, takes care of) mirar todas las solicitudes ayer. -- No, fui yo que fue la persona __ (handles, takes care of) mirarlas todas.', 
        answers: ['se haya encargado de', 'encargada de'] 
    },
    { 
        text: 'Esta área está __ (to protect) por el gobierno. Es importante que nosotros __ nuestros recursos naturales. (to protect)', 
        answers: ['protegida', 'protejamos'] 
    },
    { 
        text: 'Diego: Valentino, ¿Qué haces aquí?\n\nCarisa: --- Yo __ (to apply) (presente progresivo) para el puesto de gerente.\n\nDiego: ¡Qué coincidencia! Yo soy la persona __ (in charge of) contratar al personal de esta tienda.', 
        answers: ['estoy solicitando', 'encargada de'] 
    },
    { 
        text: 'Cada vez que ella se va y yo tengo que __ (take charge of) mi hermano menor, ella siempre me dice, "¡__ a tu hermanito!" (to protect)', 
        answers: ['encargarme de', 'protege'] 
    },
    { 
        text: 'Muchos de los aparatos electrónicos están __ (guarantee), pero si uno abusa y no los __ (to protect), no es seguro que se puedan devolver.', 
        answers: ['garantizados', 'protege'] 
    },
    { 
        text: 'Conviene que haya un sistema que sea comprensible y que nos __ buenos resultados. (to guarantee)', 
        answers: ['garantice'] 
    }
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
