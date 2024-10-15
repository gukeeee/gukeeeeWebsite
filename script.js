const questions = [
    { text: 'Antes, Alicia y yo siempre __ (tropezarse) y __ (caerse)', answers: ['nos tropezábamos', 'nos caíamos'] },
    { text: '¡ __ (jalarse) el pelo Ud.! (mandato negativo)', answers: ['no se jale'] },
    { text: 'Marina, __ (jalarse) el pelo. (mandato negativo)', answers: ['no te jales'] },
    { text: 'Ayer estaba caminando cuando yo __ (tropezarse) con una piedra y __ (caerse).', answers: ['me tropecé', 'me caí'] },
    { text: 'Señores y señoras, __ (tropezarse) con los cordones. (mandato negativo)', answers: ['no se tropiecen'] },
    { text: '¿Quién me habías dicho que __ (resbalarse)? (imperfecto progresivo)', answers: ['se estaba resbalando / estaba resbalándose'] },
    { text: '¿Qué quiere decir "tropezarse" __ __ (dos definiciones)?', answers: ['to run into / to trip', 'to trip / to run into'] },
    { text: 'No __ (tropezarse) Uds. (mandato negativo) ni __ (caerse) tampoco.', answers: ['se tropiecen', 'se caigan'] },
    { text: 'Nícola, ¿ __ (jalarse) un músculo ayer cuando __ (resbalarse)?', answers: ['te jalaste', 'te resbalaste'] },
    { text: 'Si no te estiras antes de correr, vas a __ (jalarse) un músculo y posiblemente __ (caerse).', answers: ['jalarte', 'caerte'] },
    { text: 'Si yo __ (tropezarse) con algo, yo __ (caerse) con frecuencia. (presente)', answers: ['me tropiezo', 'me caigo'] },
    { text: 'Vosotros __ (caerse). (presente progresivo)', answers: ['os estáis cayendo / estáis cayéndoos'] },
    { text: 'Jamás, en toda mi vida, __ (caerse) gracias al cuidado que siempre tengo, haga lo que haga.', answers: ['me he caído'] },
    { text: '¿Qué quiere decir "resbalarse"? __', answers: ['to slip / to slide'] }
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
