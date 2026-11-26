import { useMemo, useRef, useState } from 'react';
import {
  OTHER_ANSWER_SUFFIX,
  OTHER_OPTION,
  hasOtherAnswer,
  isQuestionnaireAnswerEmpty,
  questionnaireQuestions,
  type QuestionnaireAnswer,
  type QuestionnaireAnswers,
  type QuestionnaireQuestion,
} from '../../../shared/questionnaire';
import { btnClass } from '../../../shared/components/common/ui';
import { cn } from '../../../utils/cn';

interface Props {
  onCancel: () => void;
  onSubmit: (answers: QuestionnaireAnswers) => Promise<void>;
}

function answerId(question: QuestionnaireQuestion): string {
  return `questionnaire-question-${question.id}`;
}

function questionHasError(question: QuestionnaireQuestion, answers: QuestionnaireAnswers): boolean {
  if (isQuestionnaireAnswerEmpty(answers[question.id])) return true;
  if (question.allowOther && hasOtherAnswer(answers, question.id)) {
    const detail = answers[`${question.id}${OTHER_ANSWER_SUFFIX}`];
    return typeof detail !== 'string' || detail.trim().length === 0;
  }
  return false;
}

export function QuestionnaireModal({ onCancel, onSubmit }: Props) {
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [invalidIds, setInvalidIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const answeredCount = useMemo(
    () => questionnaireQuestions.filter((question) => !questionHasError(question, answers)).length,
    [answers],
  );
  const progress = Math.round((answeredCount / questionnaireQuestions.length) * 100);

  const setAnswer = (questionId: string, value: QuestionnaireAnswer) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    setInvalidIds((current) => current.filter((id) => id !== questionId));
    setError(null);
  };

  const setOtherAnswer = (questionId: string, value: string) => {
    setAnswers((current) => ({ ...current, [`${questionId}${OTHER_ANSWER_SUFFIX}`]: value }));
    setInvalidIds((current) => current.filter((id) => id !== questionId));
    setError(null);
  };

  const toggleMultiple = (question: QuestionnaireQuestion, option: string) => {
    const current = answers[question.id];
    const values = Array.isArray(current) ? current : [];
    const next = values.includes(option)
      ? values.filter((value) => value !== option)
      : [...values, option];
    setAnswer(question.id, next);
    if (!next.includes(OTHER_OPTION)) {
      setAnswers((previous) => {
        const copy = { ...previous };
        delete copy[`${question.id}${OTHER_ANSWER_SUFFIX}`];
        return copy;
      });
    }
  };

  const handleSubmit = async () => {
    const invalid = questionnaireQuestions
      .filter((question) => questionHasError(question, answers))
      .map((question) => question.id);
    if (invalid.length > 0) {
      setInvalidIds(invalid);
      setError(`Faltan ${invalid.length} respuesta(s) obligatoria(s). Revisa las preguntas marcadas.`);
      document.getElementById(answerId(questionnaireQuestions.find((q) => q.id === invalid[0])!))
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(answers);
    } catch (cause) {
      setError((cause as Error).message || 'No se pudo enviar la investigación.');
      bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputBaseClass =
    'w-full mt-3.5 px-3 py-2.5 border border-slate-300 rounded-[7px] bg-white text-slate-900 text-[13px] outline-none transition focus:border-[#ef3e3a] focus:ring-3 focus:ring-[#ef3e3a]/15 placeholder:text-slate-400';

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center sm:p-4 bg-slate-900/55 backdrop-blur-[6px]" role="presentation">
      <section
        className="flex flex-col w-screen h-[100dvh] sm:w-[min(1180px,97vw)] sm:h-[min(94vh,1020px)] overflow-hidden sm:border sm:border-slate-200 sm:rounded-[14px] bg-slate-50 shadow-2xl text-slate-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="questionnaire-title"
      >
        <header className="flex items-start justify-between gap-5 px-4 sm:px-7 pt-5 pb-4 sm:pt-6 sm:pb-[18px] border-b border-slate-200 bg-[radial-gradient(circle_at_12%_0%,rgba(239,62,58,0.08),transparent_38%)] bg-white">
          <div>
            <p className="m-0 mb-1.5 text-[#ef3e3a] text-[10px] font-extrabold tracking-[0.12em]">
              REVISIÓN PROTOCOLO CEISH-ULEAM / INVESTIGADOR
            </p>
            <h2 className="m-0 text-slate-900 text-[21px] sm:text-[26px] font-semibold tracking-[-0.035em]" id="questionnaire-title">
              Cuestionario de investigación
            </h2>
            <p className="mt-1.5 text-slate-500 text-[13px]">
              Completa las {questionnaireQuestions.length} preguntas obligatorias antes de enviar tu investigación.
            </p>
          </div>
          <button
            className="grid shrink-0 w-[34px] h-[34px] place-items-center border border-slate-300 rounded-[7px] bg-white text-slate-600 cursor-pointer transition-colors hover:border-red-300 hover:bg-red-50 hover:text-[#d92f2c] disabled:opacity-50"
            type="button"
            onClick={onCancel}
            aria-label="Cerrar cuestionario"
            disabled={submitting}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div
          className="flex items-center gap-3 px-4 sm:px-7 py-2.5 sm:py-3 border-b border-slate-200 bg-white text-slate-500 text-[11px]"
          aria-label={`${answeredCount} de ${questionnaireQuestions.length} preguntas respondidas`}
        >
          <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-[#ef3e3a] to-[#f05c58] transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <strong className="text-slate-900 text-[11px]">{answeredCount}/{questionnaireQuestions.length}</strong>
          <span>{progress}% completado</span>
        </div>

        {error && (
          <div
            className="mx-4 sm:mx-7 mt-3 sm:mt-4 px-3.5 py-3 border border-red-200 rounded-[7px] bg-red-50 text-[#b91c1c] text-[13px]"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3.5 sm:px-7 pt-4 sm:pt-[22px] pb-3" ref={bodyRef}>
          <ol className="grid gap-3.5 max-w-[980px] mx-auto p-0 list-none">
            {questionnaireQuestions.map((question) => {
              const isInvalid = invalidIds.includes(question.id);
              const value = answers[question.id];
              return (
                <li
                  className={cn(
                    'p-3.5 sm:p-[18px] border rounded-[10px] bg-white shadow-2xs transition-all',
                    isInvalid
                      ? 'border-red-400 ring-3 ring-[#ef3e3a]/15'
                      : 'border-slate-200',
                  )}
                  id={answerId(question)}
                  key={question.id}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid shrink-0 w-7 h-7 place-items-center border border-red-200 rounded-[7px] bg-red-50 text-[#ef3e3a] text-[12px] font-extrabold">
                      {question.number}
                    </span>
                    <div>
                      <p className="m-0 text-slate-900 text-[13px] font-semibold leading-relaxed break-words">
                        {question.label}
                      </p>
                      <span className="block mt-1 text-slate-400 text-[10px] tracking-[0.04em] uppercase">
                        Respuesta necesaria
                      </span>
                    </div>
                  </div>

                  {question.type === 'single' && (
                    <div className="grid gap-2 mt-3.5 sm:pl-10" role="radiogroup" aria-label={`Pregunta ${question.number}`}>
                      {[...(question.options ?? []), ...(question.allowOther ? [OTHER_OPTION] : [])].map((option) => {
                        const selected = value === option;
                        return (
                          <label
                            className={cn(
                              'flex items-start gap-2.5 px-3 py-2.5 border rounded-[7px] text-[12px] leading-normal cursor-pointer transition-colors',
                              selected
                                ? 'border-[#ef3e3a] bg-red-50/70 text-slate-900 font-medium'
                                : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-slate-100/70',
                            )}
                            key={option}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              value={option}
                              checked={selected}
                              onChange={() => setAnswer(question.id, option)}
                              className="shrink-0 mt-0.5 accent-[#ef3e3a]"
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {question.type === 'multiple' && (
                    <div className="grid gap-2 mt-3.5 sm:pl-10" aria-label={`Pregunta ${question.number}`}>
                      {[...(question.options ?? []), ...(question.allowOther ? [OTHER_OPTION] : [])].map((option) => {
                        const selected = Array.isArray(value) && value.includes(option);
                        return (
                          <label
                            className={cn(
                              'flex items-start gap-2.5 px-3 py-2.5 border rounded-[7px] text-[12px] leading-normal cursor-pointer transition-colors',
                              selected
                                ? 'border-[#ef3e3a] bg-red-50/70 text-slate-900 font-medium'
                                : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-slate-100/70',
                            )}
                            key={option}
                          >
                            <input
                              type="checkbox"
                              value={option}
                              checked={selected}
                              onChange={() => toggleMultiple(question, option)}
                              className="shrink-0 mt-0.5 accent-[#ef3e3a]"
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {question.type === 'text' && (
                    <input
                      className={inputBaseClass}
                      type="text"
                      value={typeof value === 'string' ? value : ''}
                      onChange={(event) => setAnswer(question.id, event.target.value)}
                      placeholder="Escriba su respuesta"
                    />
                  )}

                  {question.type === 'textarea' && (
                    <textarea
                      className={cn(inputBaseClass, 'min-h-[110px] resize-y leading-relaxed')}
                      value={typeof value === 'string' ? value : ''}
                      onChange={(event) => setAnswer(question.id, event.target.value)}
                      placeholder="Escriba su respuesta"
                      rows={5}
                    />
                  )}

                  {question.type === 'date' && (
                    <input
                      className={cn(inputBaseClass, 'max-w-[240px]')}
                      type="date"
                      value={typeof value === 'string' ? value : ''}
                      onChange={(event) => setAnswer(question.id, event.target.value)}
                    />
                  )}

                  {question.allowOther && hasOtherAnswer(answers, question.id) && (
                    <input
                      className={cn(inputBaseClass, 'border-red-300 bg-red-50/40')}
                      type="text"
                      value={typeof answers[`${question.id}${OTHER_ANSWER_SUFFIX}`] === 'string'
                        ? answers[`${question.id}${OTHER_ANSWER_SUFFIX}`] as string
                        : ''}
                      onChange={(event) => setOtherAnswer(question.id, event.target.value)}
                      placeholder="Detalle la opción Otras"
                    />
                  )}

                  {isInvalid && <p className="mt-2.5 text-[#d92f2c] text-[11px] font-medium">Esta pregunta es obligatoria.</p>}
                </li>
              );
            })}
          </ol>
        </div>

        <footer className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-7 py-3.5 sm:py-4 border-t border-slate-200 bg-white">
          <p className="m-0 text-slate-500 text-[11px]">La información del cuestionario será revisada por el administrador del CEISH.</p>
          <div className="flex justify-end gap-2.5">
            <button className={btnClass('outline')} type="button" onClick={onCancel} disabled={submitting}>
              Cancelar
            </button>
            <button className={btnClass('primary')} type="button" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? 'Enviando…' : 'Enviar investigación'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
