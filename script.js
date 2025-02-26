const questions = [
    {
        text: "¿Qué significa 'trazar' en inglés? __",
        answers: ["to draw, to trace"]
    },
    {
        text: "Se contribuyeron figuras __ (trazar) por artistas famosos el año pasado.",
        answers: ["trazadas"]
    },
    {
        text: "Muchos no creen que __ (existir) una civilización en la selva (jungle) hace más de cien años.",
        answers: ["haya existido"]
    },
    {
        text: "En menos de cinco horas, el día __ (convertirse) en noche el día que estuvimos en Islandia.",
        answers: ["se convirtió"]
    },
    {
        text: "Las Líneas de Nazca son dibujos __ (trazar) en la tierra que sólo se pueden ver desde un avión.",
        answers: ["trazados"]
    },
    {
        text: "Mientras yo __ (trazar) la ruta que íbamos a tomar, mi esposo __ (contribuir) en hacer las maletas.",
        answers: ["trazaba", "contribuía"]
    },
    {
        text: "¿__ (Existir) los extraterrestres? --- No lo sé, pero hay personas que dicen que los han visto.",
        answers: ["Existirán"]
    },
    {
        text: "Yo __ (contribuir) a tu causa el mes que viene con tal de que __ (existir) una forma de probárselo a mi contador.",
        answers: ["contribuiré", "exista"]
    },
    {
        text: "Mis abuelos __ (contribuir) (pluscuamperfecto) mucho dinero a la fundación por muchos años.",
        answers: ["habían contribuido"]
    },
    {
        text: "¡__ (Trazar) nosotros nuestros nombres con un marcador más oscuro!",
        answers: ["Tracemos"]
    },
    {
        text: "Es increíble que __ (existir) una civilización tan avanzada en la Ciudad Perdida.",
        answers: ["haya existido"]
    },
    {
        text: "No hay nadie que __ (convertirse) en pianista de noche al día sin haber practicado millones de horas.",
        answers: ["se convierta"]
    },
    {
        text: "Ahoritita mismo, hay mucha gente que __ (contribuir) una gran cantidad de dinero. ¡Ojalá __ (convertirse) en algo bueno!",
        answers: ["está contribuyendo", "se convierta"]
    },
    {
        text: "Chicos, ¡__ (convertirse) vosotros en humanitarios para el bien de todos!",
        answers: ["convertíos"]
    },
    {
        text: "Yo __ (convertirse) (pretérito perfecto) en una mejor persona después de estudiar filosofía.",
        answers: ["me he convertido"]
    },
    {
        text: "Con los pies __ (trazar) en un papel, voy a poder comprarte los zapatos sin que tú estés.",
        answers: ["trazados"]
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

document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.shiftKey && event.key === "1") {
        revealAnswers();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.shiftKey && event.key === "2") {
        hideAnswers();
    }
});

function revealAnswers() {
    questions.forEach((question, index) => {
        question.answers.forEach((correctAnswer, i) => {
            const inputField = document.getElementById(`q${index + 1}_${i + 1}`);
            if (inputField) {
                inputField.value = correctAnswer;  // Fill in correct answer
                inputField.style.borderColor = 'purple';  // Highlight answer
            }
        });
    });
}

function hideAnswers() {
    questions.forEach((question, index) => {
        question.answers.forEach((correctAnswer, i) => {
            const inputField = document.getElementById(`q${index + 1}_${i + 1}`);
            if (inputField) {
                inputField.value = '';  // Clear answer
                inputField.style.borderColor = '';  // Clear highlight
            }
        });
    });
}
