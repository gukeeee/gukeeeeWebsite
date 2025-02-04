const questions = [
    {
        text: "Vosotros le __ (prohibir) (pretérito perfecto) a Lucía mirar Youtube hasta que __ terminado su tarea, ¿no?",
        answers: ["habéis prohibido", "haya"]
    },
    {
        text: "Lo siento, chicos. Es que sé que mi madre me lo __ (prohibir) sin pedírselo. Es mejor que __ (conseguir) a otra persona que pueda ir con Uds.",
        answers: ["prohibirá", "consigan"]
    },
    {
        text: "¿Escuchaste el tiempo __ para hoy? (pronosticar)",
        answers: ["pronosticado"]
    },
    {
        text: "No __ (haber) nadie que me __ (haber) podido ayudar con mi problema ayer.",
        answers: ["hubo", "haya"]
    },
    {
        text: "Para __ (conservar) la flora y la fauna de este santuario, __ (prohibir) entrar sin guía.",
        answers: ["conservar", "se prohíbe"]
    },
    {
        text: "¡Deja de hablar! No ves que quiero escuchar lo que __ (pronosticar) el meteorólogo antes de salir afuera.",
        answers: ["está pronosticando"]
    },
    {
        text: " __ (haber) una vez dos princesas gemelas que estaban __ (prohibir) salir de su torre.",
        answers: ["Había", "prohibidas"]
    },
    {
        text: "¿Alguno de Uds. nos __ (pronosticar) el clima hoy ya que Daniel está enfermo? No sé, quizás haya otra persona más calificada.",
        answers: ["pronosticará"]
    },
    {
        text: "La mermelada __ (conservar) es para ti.",
        answers: ["conservada"]
    },
    {
        text: "Hace varias semanas el noticiero __ (pronosticar) que iba a llover toda esta semana, pero no he visto ni una nube.",
        answers: ["había pronosticado"]
    },
    {
        text: "¡__ (conservar) nosotros nuestros recursos naturales por el bien de nuestro futuro y el de nuestros hijos! Hay que __ (prohibir) el uso de plásticos desechables.",
        answers: ["Conservemos", "prohibir"]
    },
    {
        text: "Haber significa __. En el presente es __ y su segundo uso es como un verbo __ para los tiempos perfectos.",
        answers: ["to have", "hay", "ayudando"]
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
