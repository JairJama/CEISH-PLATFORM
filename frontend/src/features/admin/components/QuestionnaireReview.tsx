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
    <section
      className="mt-4 p-3.5 sm:p-5 border border-slate-200 rounded-xl bg-white shadow-xs"
      aria-labelledby="research-questionnaire-title"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5 mb-4">
        <div>
          <p className="mb-1 text-[#ef3e3a] text-[10px] font-extrabold tracking-[0.1em]">
            DECLARACIONES DEL INVESTIGADOR
          </p>
          <h2 id="research-questionnaire-title" className="text-slate-900 text-[17px] font-semibold">
            Cuestionario de investigación
          </h2>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold self-start">
          {answered}/{questionnaireQuestions.length} respondidas
        </span>
      </div>

      {answered === 0 ? (
        <p className="text-slate-500 text-[13px]">Esta investigación no tiene respuestas registradas.</p>
      ) : (
        <ol className="grid gap-2.5 m-0 p-0 list-none">
          {questionnaireQuestions.map((question) => (
            <li key={question.id} className="px-3.5 py-3 border border-slate-200 rounded-md bg-slate-50">
              <div className="flex items-start gap-2.5">
                <span className="grid w-6 h-6 shrink-0 place-items-center rounded-md bg-white border border-red-200 text-[#ef3e3a] text-[10px] font-extrabold">
                  {question.number}
                </span>
                <strong className="text-slate-800 text-[12px] font-semibold leading-normal break-words">
                  {question.label}
                </strong>
              </div>
              <p className="mt-2 sm:ml-[34px] text-slate-900 text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                {formatQuestionnaireAnswer(question, safeAnswers) || 'Sin respuesta'}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
