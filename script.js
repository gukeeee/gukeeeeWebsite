const questions = [
    {
        text: "Hace unos minutos mi hijo __ (aparecer) a la puerta con la rodilla __ (cubrir) de sangre porque se había caído de su bici.",
        answers: ["apareció", "cubierta"]
    },
    {
        text: "Me parece increíble que nadie __ (cubrir) esa mesa tan fea con un mantel. ¡__ (cubrirla) nosotros con algo antes de que vengan los invitados y la vean!",
        answers: ["haya cubierto", "Cubrámosla"]
    },
    {
        text: "¿Qué quiere decir 'cubrir' en inglés?",
        answers: ["to cover", "to hide"]
    },
    {
        text: "No te preocupes si yo __ (aparecerse) tarde a la función esta noche. Más vale que yo __ (aparecerse) tarde que nunca, ¿no crees?",
        answers: ["me aparezco", "me aparezca"]
    },
    {
        text: "¿Qué está haciendo Ud. en este momento?--- __ (medir) el tamaño de la piscina para saber la cantidad de agua que necesitaremos para poder llenarla.",
        answers: ["Estoy midiendo"]
    },
    {
        text: "Día tras día había un gato que __ (aparecerse) para que le diéramos algo de comer.",
        answers: ["se aparecía"]
    },
    {
        text: "Cecilia, ¿__ (resolver) (pretérito perfecto) el problema para la tarea de hoy? - No, porque no __ (medir) (pluscuamperfecto) mi tiempo bien anoche.",
        answers: ["has resuelto", "había medido"]
    },
    {
        text: "Yo todavía no __ (cubrir) las jaulas (cages) de los pájaros hasta que __ (aparecer) el que se escapó.",
        answers: ["he cubierto", "aparezca"]
    },
    {
        text: "Te ayudaré después de que tú __ (cubrir) los carros.",
        answers: ["cubras"]
    },
    {
        text: "Hasta ahora, ninguna organización __ (medir) (pluscuamperfecto) la huella (footprint) de carbono en sus instalaciones.",
        answers: ["había medido"]
    },
    {
        text: "Señores, ¡__ (resolver) sus problemas! ¡No __ (aparecerse) (mandato negativo) hasta hacer las paces!",
        answers: ["resuelvan", "se aparezcan"]
    },
    {
        text: "De aquí en adelante, nosotros __ (medir) cuanta azúcar consumimos para prevenir la diabetes.",
        answers: ["mediremos"]
    },
    {
        text: "Tú ya __ (resolver) (el futuro perfecto) el problema antes de la fecha límite, ¿verdad? Te aconsejo que __ (medir) tu tiempo bien porque no te queda mucho más tiempo.",
        answers: ["habrás resuelto", "midas"]
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

document.getElementById('clear-button').addEventListener('click', function() {
    // Clear all input fields and reset their styles
    const inputs = document.querySelectorAll('#quiz-form input');
    inputs.forEach(input => {
        input.value = ''; // Clear the input value
        input.style.borderColor = ''; // Reset border color
        input.classList.remove('empty'); // Remove empty class if applied
    });

    // Clear all feedback messages
    const feedbackElements = document.querySelectorAll('.feedback');
    feedbackElements.forEach(feedback => {
        feedback.innerHTML = '';
    });

    // Clear the result display
    document.getElementById('result').innerHTML = '';
});

window.onload = loadQuestions;
