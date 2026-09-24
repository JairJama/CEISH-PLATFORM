import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '../../store/authStore';
import { EvaluationPage } from '../../features/evaluation/EvaluationPage';
import { LoginPage } from '../../features/auth/LoginPage';
import { RegistrationPage } from '../../features/auth/RegistrationPage';
import { AppShell } from '../../shared/components/AppShell';
import { SubmissionPage } from '../../features/student/SubmissionPage';
import { EvaluatorDashboard } from '../../features/evaluator/EvaluatorDashboard';
import { ReviewPage } from '../../features/evaluator/components/ReviewPage';
import { AdminDashboard } from '../../features/admin/AdminDashboard';
import { AssignmentPanel } from '../../features/admin/components/AssignmentPanel';
import { RegistrationRequestsPanel } from '../../features/admin/components/RegistrationRequestsPanel';
import { ResearchManagementPanel } from '../../features/admin/components/ResearchManagementPanel';
import { StratificationDashboard } from '../../features/evaluator/StratificationDashboard';
import { QualificationDashboard } from '../../features/evaluator/QualificationDashboard';

function RootRedirect() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isRestored = useAuthStore((s) => s.isRestored);
  if (!isRestored) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'student') return <Navigate to="/estudiante" replace />;
  if (currentUser.role === 'evaluator') return <Navigate to="/evaluador/estratificacion" replace />;
  return <Navigate to="/admin" replace />;
}

function RequireRole({ role, children }: { role: 'student' | 'evaluator' | 'admin'; children: ReactNode }) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isRestored = useAuthStore((s) => s.isRestored);
  if (!isRestored) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== role) return <RootRedirect />;
  return children;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistrationPage />} />

        {/* Full-screen evaluation routes (existing + review) */}
        <Route path="/evaluacion" element={<RequireRole role="evaluator"><EvaluationPage /></RequireRole>} />
        <Route path="/evaluacion/:id" element={<RequireRole role="evaluator"><EvaluationPage /></RequireRole>} />
        <Route path="/evaluador/revision/:submissionId" element={<RequireRole role="evaluator"><ReviewPage /></RequireRole>} />

        {/* Dashboard routes wrapped in AppShell */}
        <Route element={<AppShell />}>
          <Route path="/estudiante" element={<RequireRole role="student"><SubmissionPage /></RequireRole>} />
          <Route path="/evaluador" element={<RequireRole role="evaluator"><EvaluatorDashboard /></RequireRole>} />
          <Route path="/evaluador/estratificacion" element={<RequireRole role="evaluator"><StratificationDashboard /></RequireRole>} />
          <Route path="/evaluador/calificacion" element={<RequireRole role="evaluator"><QualificationDashboard /></RequireRole>} />
          <Route path="/admin" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
          <Route path="/admin/asignaciones" element={<RequireRole role="admin"><AssignmentPanel /></RequireRole>} />
          <Route path="/admin/solicitudes" element={<RequireRole role="admin"><RegistrationRequestsPanel /></RequireRole>} />
          <Route path="/admin/investigaciones" element={<RequireRole role="admin"><ResearchManagementPanel /></RequireRole>} />
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
