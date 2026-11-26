import {
  formatQuestionnaireAnswer,
  isQuestionnaireAnswerEmpty,
  questionnaireQuestions,
  type QuestionnaireAnswers,
} from '../../../shared/questionnaire';

interface Props {
  answers: QuestionnaireAnswers | null | undefined;
}

export function QuestionnaireReview({ answers }: Props) {
  const safeAnswers = answers ?? {};
  const answered = questionnaireQuestions.filter(
    (question) => !isQuestionnaireAnswerEmpty(safeAnswers[question.id]),
  ).length;

  return (
    <section className="research-questionnaire" aria-labelledby="research-questionnaire-title">
      <div className="research-questionnaire__header">
        <div>
          <p>DECLARACIONES DEL INVESTIGADOR</p>
          <h2 id="research-questionnaire-title">Cuestionario de investigación</h2>
        </div>
        <span>{answered}/{questionnaireQuestions.length} respondidas</span>
      </div>

      {answered === 0 ? (
        <p className="research-questionnaire__empty">Esta investigación no tiene respuestas registradas.</p>
      ) : (
        <ol className="research-questionnaire__list">
          {questionnaireQuestions.map((question) => (
            <li key={question.id}>
              <div className="research-questionnaire__question">
                <span>{question.number}</span>
                <strong>{question.label}</strong>
              </div>
              <p className="research-questionnaire__answer">
                {formatQuestionnaireAnswer(question, safeAnswers) || 'Sin respuesta'}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
