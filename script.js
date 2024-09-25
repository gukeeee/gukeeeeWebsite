const questions = [
    { text: 'Javi, ¡ __ a esos chicos allá! (vencer) (M-) ¡ __ a ésos! (vencer) (M+)', answers: ['no venzas', 'Vence'] },
    { text: 'Alma, __ (alcanzarles) (M-) ese juguete ni a Pablito ni a Lisa. Están castigados por portarse mal. Es que ellos todavía no __ (darse cuenta de) (pretérito perfecto) su error.', answers: ['no les alcances', 'se han dado cuenta de'] },
    { text: 'Si yo __ mi miedo de alturas, voy a poder escalar El Capitán en Yosemite. (vencer)', answers: ['venzo'] },
    { text: 'Yo no __ (alcanzar) verte anteayer. ¡Qué pena! ¿ __ tú ver a tus primos?', answers: ['alcancé', 'Alcanzaste'] },
    { text: 'Ellos no creían que nosotros __ (darse cuenta de) (IMP) lo que estaba pasando, pero no fue así.', answers: ['nos dábamos cuenta de'] },
    { text: 'Un sueño __ por mi papá fue de tener su propia casa. (realizar)', answers: ['realizado'] },
    { text: 'Nosotros te __ (alcanzar) por fin. (pretérito perfecto)', answers: ['hemos alcanzado'] },
    { text: 'El otro día, Lalo __ (darse cuenta de) que para __ (alcanzar) sus sueños, tiene que trabajar duro.', answers: ['se dio cuenta de', 'alcanzar'] },
    { text: 'Teodoro, ¡ __ a ese jugador en este partido! (vencer)', answers: ['vence'] },
    { text: 'Valentina, ¡ __ tu error! (darse cuenta de)', answers: ['date cuenta de'] },
    { text: 'Antes, mis hermanas y yo éramos bajas y no __ (alcanzar) lo que mis padres ponían encima de la refri.', answers: ['alcanzábamos'] },
    { text: 'Sr. Ávila, ¡ __ sus metas porque vale la pena! (realizar)', answers: ['realice'] },
    { text: 'Vosotros nos __ (alcanzar), no os canséis. (presente progresivo)', answers: ['estáis alcanzando'] },
    { text: 'Después de mucho esfuerzo, mi mejor amiga __ (alcanzar) estar en los semi-finales. Tristemente, fue __ (vencer) por otra jugadora más fuerte en el último partido.', answers: ['alcanzó', 'vencida'] },
    { text: 'Esos chicos os __ a vosotros. ¡Qué vergüenza! (vencer) (presente progresivo)', answers: ['están venciendo'] }
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
    quizForm.innerHTML = ''; // Clear any existing questions

    questions.forEach((question, index) => {
        // Split the question text by the placeholders
        const parts = question.text.split('__');
        // Create the question HTML
        const questionHtml = parts.map((part, i) => {
            if (i > 0) {
                return `<input type="text" id="q${index + 1}_${i}" placeholder="Tu respuesta aquí">${part}`;
            }
            return part; // The first part before the first blank
        }).join('');

        quizForm.insertAdjacentHTML('beforeend', `<p>${index + 1}. ${questionHtml}</p>`);
    });
}

document.getElementById('check-button').addEventListener('click', function() {
    let score = 0;
    let incorrect = 0;
    let feedback = '';

    questions.forEach((question, index) => {
        const userAnswers = [];
        let correctAnswers = question.answers.map(ans => ans.toLowerCase());

        // Collect user answers
        for (let i = 0; i < correctAnswers.length; i++) {
            const userAnswer = document.getElementById(`q${index + 1}_${i + 1}`)?.value.trim();
            userAnswers.push(userAnswer);
        }

        // Check answers
        userAnswers.forEach((userAnswer, i) => {
            if (correctAnswers.includes(userAnswer.toLowerCase())) {
                score++;
                feedback += `<p>Answer ${i + 1} - ¡Correcto!</p>`;
            } else {
                incorrect++;
                feedback += `<p>Answer ${i + 1} - ¡Incorrecto!</p>`;
            }
        });
    });

    feedback += `<p>Tu nota: ${score} de ${score + incorrect}</p>`;
    document.getElementById('result').innerHTML = feedback;
});

window.onload = loadQuestions;
