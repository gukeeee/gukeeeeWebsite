const questions = [
    {
        text: 'Señores, ¡__ (repartir) todos los periódicos ahora y __ (cumplir) con lo que les he pedido!',
        answers: ['repartan', 'cumplan']
    },
    {
        text: '¿Qué está haciendo Ud. en este momento? __ (atender) a los invitados. ¿Y Uds. qué han hecho? -- Ya __ (repartir) todos los recuerdos.',
        answers: ['Estoy atendiendo', 'hemos repartido']
    },
    {
        text: 'Si __ (sembrar) (se pasivo) las semillas al final del invierno, habrá flores en la primavera, pero si no __ (repartir) con cuidado no brotarán (will flower).',
        answers: ['se siembran', 'se reparten']
    },
    {
        text: 'Niño, ¡__ (atenderme) ya que me muero de hambre!',
        answers: ['atiéndeme']
    },
    {
        text: 'Carlos es tan perezoso. Dudo que él __ (cumplir) anteayer con lo prometido. Te aconsejo que __ (repartir) los deberes de él entre nosotros.',
        answers: ['haya cumplido', 'repartas']
    },
    {
        text: 'Cada año mi abuelo __ (sembrar) verduras en su jardín cuando vivía en nuestra casa. Ahora es mi papá que __ (cumplir) con ese deber.',
        answers: ['sembraba', 'cumple']
    },
    {
        text: 'Vosotros ya __ (cumplir) (pret perfecto) con lo que habíais prometido. Fue algo nuevo para vosotros porque jamás __ (sembrar) flores en un jardín antes.',
        answers: ['habéis cumplido', 'habíais sembrado']
    },
    {
        text: 'Mi amiga ideal es __ (cumplir) y __ (atender) a las necesidades de otros.',
        answers: ['cumplida', 'atenta']
    },
    {
        text: 'El verbo atender significa __ (to attend to, deal with, take care of) (3 definiciones)',
        answers: ['to attend to', 'deal with', 'take care of']
    },
    {
        text: 'Todas fueron __ (atender) por mis padres. Por supuesto. En nuestra casa, siempre __ (cumplir) con lo que se promete.',
        answers: ['atendidas', 'se cumple con']
    },
    {
        text: 'A: Marína, ¿__ (repartir) anoche los anuncios?\n\nB: Claro que sí. Yo __ (cumplir) con lo que fui asignada.',
        answers: ['Repartiste', 'cumplí']
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
