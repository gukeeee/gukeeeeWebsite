const questions = [
    { text: 'Las chicas que están "__" (pararse) en la esquina son mis primas.', answers: ['paradas'] },
    { text: 'Sra. Hidalgo, su hermana y Ud. "__" más y más a su mamá cada día. (parecerse) (PP)', answers: ['se están pareciendo', 'están pareciéndose'] },
    { text: 'Carmen, ¡ "__" tanto! (destacarse) (M-)', answers: ['no te destaques'] },
    { text: 'Vosotras "__" ayer en el concurso por ser tan creativas. (destacarse)', answers: ['os destacasteis'] },
    { text: '¿Quién de vosotros "__" con ser doctor o ingeniero? (soñar) (presente)', answers: ['sueña'] },
    { text: '¿Qué quiere decir "destacarse"? "__"', answers: ['to stand out'] },
    { text: 'Doña Lola, ¡ "__" (pararse) (M+), pero Uds. "__" todavía (pararse) (M-)', answers: ['párese', 'no se paren'] },
    { text: 'Timoteo, ¡ "__" cuando entre la novia! (pararse)', answers: ['párate'] },
    { text: 'Tenéis que "__" (pararse) o no vais a poder ver nada.', answers: ['pararos'] },
    { text: 'Anoche yo tuve miedo porque "__" que me enfermé con el coronavirus. ¿ "__" tú algo similar? (soñar)', answers: ['soñé', 'soñaste'] },
    { text: 'Mario, ¡ "__" ya! Si no lo haces nunca vas a lograr lo que quieres. (destacarse)', answers: ['destácate'] },
    { text: 'A mí me dicen que yo "__" a mi mamá ahora. Pero, antes cuando era chica, yo "__" más a mi abuelita. (parecerse)', answers: ['me parezco', 'me parecía'] },
    { text: '¿Cuál es el significado de parecerse a? "__" "__"', answers: ['to look like', 'to be like'] },
    { text: 'Uno de Uds. "__" cada día más y más por ser tan listo. (destacarse) (PP)', answers: ['se está destacando', 'está destacándose'] },
    { text: 'Cuando vuestros padres eran más jóvenes "__" con ser exitosos y ahora lo son. (soñar)', answers: ['soñaban'] },
    { text: 'Si tú "__" para hablar con ese chico nuevo, yo voy a "__" tú para hablar con su amigo? (pararse)', answers: ['te paras', 'pararme'] },
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
    
    questions.forEach((question, index) => {
        const questionHtml = `<p>${index + 1}. ${question.text.replace('__', `<input type="text" id="q${index + 1}" placeholder="your answer">`)}</p>`;
        quizForm.insertAdjacentHTML('beforeend', questionHtml);
    });
}

document.getElementById('check-button').addEventListener('click', function() {
    let score = 0;
    let feedback = '';

    questions.forEach((question, index) => {
        const userAnswer = document.getElementById(`q${index + 1}`).value.trim();
        const correctAnswers = question.answers.flatMap(ans => ans.split(' / ')).map(ans => ans.toLowerCase());

        if (correctAnswers.includes(userAnswer.toLowerCase())) {
            score++;
            feedback += `<p>${index + 1}: Correct!</p>`;
        } else {
            feedback += `<p>${index + 1}: Wrong! Correct answer(s): "${question.answers.join(', ')}".</p>`;
        }
    });

    feedback += `<p>Your score: ${score} out of ${questions.length}</p>`;
    document.getElementById('result').innerHTML = feedback;
});

// Load questions on page load
window.onload = loadQuestions;
