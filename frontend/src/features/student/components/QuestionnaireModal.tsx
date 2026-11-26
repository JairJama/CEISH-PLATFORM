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
import './QuestionnaireModal.css';

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

  return (
    <div className="questionnaire-backdrop" role="presentation">
      <section
        className="questionnaire-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="questionnaire-title"
      >
        <header className="questionnaire-modal__header">
          <div>
            <p className="questionnaire-modal__kicker">REVISIÓN PROTOCOLO CEISH-ULEAM / INVESTIGADOR</p>
            <h2 className="questionnaire-modal__title" id="questionnaire-title">Cuestionario de investigación</h2>
            <p className="questionnaire-modal__subtitle">
              Completa las {questionnaireQuestions.length} preguntas obligatorias antes de enviar tu investigación.
            </p>
          </div>
          <button
            className="questionnaire-modal__close"
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

        <div className="questionnaire-progress" aria-label={`${answeredCount} de ${questionnaireQuestions.length} preguntas respondidas`}>
          <div className="questionnaire-progress__track">
            <span style={{ width: `${progress}%` }} />
          </div>
          <strong>{answeredCount}/{questionnaireQuestions.length}</strong>
          <span>{progress}% completado</span>
        </div>

        {error && <div className="questionnaire-modal__alert" role="alert">{error}</div>}

        <div className="questionnaire-modal__body" ref={bodyRef}>
          <ol className="questionnaire-list">
            {questionnaireQuestions.map((question) => {
              const isInvalid = invalidIds.includes(question.id);
              const value = answers[question.id];
              return (
                <li
                  className={`questionnaire-question${isInvalid ? ' questionnaire-question--invalid' : ''}`}
                  id={answerId(question)}
                  key={question.id}
                >
                  <div className="questionnaire-question__heading">
                    <span className="questionnaire-question__number">{question.number}</span>
                    <div>
                      <p className="questionnaire-question__label">{question.label}</p>
                      <span className="questionnaire-question__hint">Respuesta necesaria</span>
                    </div>
                  </div>

                  {question.type === 'single' && (
                    <div className="questionnaire-options" role="radiogroup" aria-label={`Pregunta ${question.number}`}>
                      {[...(question.options ?? []), ...(question.allowOther ? [OTHER_OPTION] : [])].map((option) => (
                        <label className={`questionnaire-option${value === option ? ' is-selected' : ''}`} key={option}>
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={value === option}
                            onChange={() => setAnswer(question.id, option)}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'multiple' && (
                    <div className="questionnaire-options" aria-label={`Pregunta ${question.number}`}>
                      {[...(question.options ?? []), ...(question.allowOther ? [OTHER_OPTION] : [])].map((option) => {
                        const selected = Array.isArray(value) && value.includes(option);
                        return (
                          <label className={`questionnaire-option${selected ? ' is-selected' : ''}`} key={option}>
                            <input
                              type="checkbox"
                              value={option}
                              checked={selected}
                              onChange={() => toggleMultiple(question, option)}
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {question.type === 'text' && (
                    <input
                      className="questionnaire-input"
                      type="text"
                      value={typeof value === 'string' ? value : ''}
                      onChange={(event) => setAnswer(question.id, event.target.value)}
                      placeholder="Escriba su respuesta"
                    />
                  )}

                  {question.type === 'textarea' && (
                    <textarea
                      className="questionnaire-textarea"
                      value={typeof value === 'string' ? value : ''}
                      onChange={(event) => setAnswer(question.id, event.target.value)}
                      placeholder="Escriba su respuesta"
                      rows={5}
                    />
                  )}

                  {question.type === 'date' && (
                    <input
                      className="questionnaire-input questionnaire-input--date"
                      type="date"
                      value={typeof value === 'string' ? value : ''}
                      onChange={(event) => setAnswer(question.id, event.target.value)}
                    />
                  )}

                  {question.allowOther && hasOtherAnswer(answers, question.id) && (
                    <input
                      className="questionnaire-input questionnaire-input--other"
                      type="text"
                      value={typeof answers[`${question.id}${OTHER_ANSWER_SUFFIX}`] === 'string'
                        ? answers[`${question.id}${OTHER_ANSWER_SUFFIX}`] as string
                        : ''}
                      onChange={(event) => setOtherAnswer(question.id, event.target.value)}
                      placeholder="Detalle la opción Otras"
                    />
                  )}

                  {isInvalid && <p className="questionnaire-question__error">Esta pregunta es obligatoria.</p>}
                </li>
              );
            })}
          </ol>
        </div>

        <footer className="questionnaire-modal__footer">
          <p>La información del cuestionario será revisada por el administrador del CEISH.</p>
          <div>
            <button className="eval-btn eval-btn--outline" type="button" onClick={onCancel} disabled={submitting}>
              Cancelar
            </button>
            <button className="eval-btn eval-btn--primary" type="button" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? 'Enviando…' : 'Enviar investigación'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
