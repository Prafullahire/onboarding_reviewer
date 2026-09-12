import type {
  AgentInfo,
  AutonomyMode,
  OnboardingCase,
  OnboardingCaseData,
  ReviewWorkflow,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    });
  } catch {
    throw new Error(
      'Cannot reach the backend API. Start MySQL (npm run db:up) and the server (npm run dev from project root).'
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error ?? `Request failed: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  getCases: () => request<OnboardingCase[]>('/cases'),
  getCase: (id: string) => request<OnboardingCase>(`/cases/${id}`),
  createCase: (title: string, caseData: OnboardingCaseData) =>
    request<OnboardingCase>('/cases', {
      method: 'POST',
      body: JSON.stringify({ title, caseData }),
    }),
  deleteCase: (id: string) => request<void>(`/cases/${id}`, { method: 'DELETE' }),

  startReview: (caseId: string, autonomyMode: AutonomyMode) =>
    request<ReviewWorkflow>('/reviews/start', {
      method: 'POST',
      body: JSON.stringify({ caseId, autonomyMode }),
    }),
  getWorkflow: (id: string) => request<ReviewWorkflow>(`/reviews/${id}`),
  getWorkflowsByCase: (caseId: string) => request<ReviewWorkflow[]>(`/reviews/case/${caseId}`),
  submitDecision: (workflowId: string, decision: string, notes?: string) =>
    request<ReviewWorkflow>(`/reviews/${workflowId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    }),
  getAuditLog: (workflowId: string) =>
    request<Array<{ eventType: string; eventData: Record<string, unknown>; createdAt?: string }>>(
      `/reviews/${workflowId}/audit`
    ),

  getAgents: () => request<AgentInfo[]>('/agents'),
};
