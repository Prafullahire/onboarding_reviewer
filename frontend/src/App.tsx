import { useCallback, useEffect, useState } from 'react';
import { api } from './api/client';
import { AgentInfoPanel } from './components/AgentInfoPanel';
import { BackendStatus } from './components/BackendStatus';
import { CaseDetail } from './components/CaseDetail';
import { CaseForm } from './components/CaseForm';
import { CaseList } from './components/CaseList';
import { ExecutionTrace } from './components/ExecutionTrace';
import { ReviewPanel } from './components/ReviewPanel';
import type { AgentInfo, AutonomyMode, OnboardingCase, OnboardingCaseData, ReviewWorkflow } from './types';

type View = 'main' | 'create' | 'upload';

export default function App() {
  const [cases, setCases] = useState<OnboardingCase[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<ReviewWorkflow | null>(null);
  const [view, setView] = useState<View>('main');
  const [uploadData, setUploadData] = useState<{ title: string; caseData: OnboardingCaseData } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCase = cases.find((c) => c.id === selectedCaseId) ?? null;

  const loadCases = useCallback(async () => {
    try {
      const data = await api.getCases();
      setCases(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cases');
    }
  }, []);

  const loadAgents = useCallback(async () => {
    try {
      const data = await api.getAgents();
      setAgents(data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    loadCases();
    loadAgents();
  }, [loadCases, loadAgents]);

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setWorkflow(null);
    setError(null);
  };

  const handleCreateCase = async (title: string, caseData: OnboardingCaseData) => {
    setLoading(true);
    try {
      const created = await api.createCase(title, caseData);
      await loadCases();
      setSelectedCaseId(created.id);
      setView('main');
      setUploadData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as { title: string; caseData: OnboardingCaseData };
        setUploadData(parsed);
        setView('upload');
      } catch {
        setError('Invalid JSON file. Expected { title, caseData } format.');
      }
    };
    input.click();
  };

  const handleStartReview = async (autonomyMode: AutonomyMode) => {
    if (!selectedCaseId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.startReview(selectedCaseId, autonomyMode);
      setWorkflow(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDecision = async (decision: string, notes: string) => {
    if (!workflow) return;
    setLoading(true);
    try {
      const updated = await api.submitDecision(workflow.id, decision, notes);
      setWorkflow(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit decision');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'create' || (view === 'upload' && uploadData)) {
    return (
      <div className="app-shell">
        <div className="main-area" style={{ marginLeft: 0, width: '100%' }}>
          <div className="topbar">
            <div>
              <div className="topbar-title">
                {view === 'upload' ? 'Import Case' : 'New Onboarding Case'}
              </div>
              <div className="topbar-subtitle">Synthetic data only</div>
            </div>
            <button className="btn-secondary btn-sm" onClick={() => { setView('main'); setUploadData(null); }}>
              Back to Dashboard
            </button>
          </div>
          <div className="form-page">
            <CaseForm
              initialTitle={uploadData?.title}
              initialData={uploadData?.caseData}
              onSubmit={handleCreateCase}
              onCancel={() => { setView('main'); setUploadData(null); }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>Case Reviewer</h1>
          <p>Multi-Agent Onboarding Platform</p>
        </div>
        <div className="sidebar-content">
          <CaseList
            cases={cases}
            selectedId={selectedCaseId}
            onSelect={handleSelectCase}
            onCreateNew={() => setView('create')}
            onUpload={handleUpload}
          />
        </div>
      </aside>

      <div className="main-area">
        <div className="topbar">
          <div>
            {selectedCase ? (
              <>
                <div className="topbar-title">{selectedCase.title}</div>
                <div className="topbar-subtitle">{selectedCase.referenceNumber}</div>
              </>
            ) : (
              <>
                <div className="topbar-title">Dashboard</div>
                <div className="topbar-subtitle">Select a case to begin review</div>
              </>
            )}
          </div>
          <span className="badge badge-primary">Synthetic Data</span>
        </div>

        <BackendStatus />

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
            <button className="btn-secondary btn-sm" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        <div className="page-content">
          {agents.length > 0 && !selectedCase && <AgentInfoPanel agents={agents} />}

          {selectedCase ? (
            <div className="content-grid">
              <CaseDetail case={selectedCase} />
              <div className="content-grid content-grid-2">
                <ReviewPanel
                  caseId={selectedCase.id}
                  workflow={workflow}
                  loading={loading}
                  onStartReview={handleStartReview}
                  onSubmitDecision={handleSubmitDecision}
                />
                {workflow ? (
                  <ExecutionTrace traces={workflow.traces} />
                ) : (
                  agents.length > 0 && <AgentInfoPanel agents={agents} compact />
                )}
              </div>
              {workflow && (
                <div style={{ marginTop: '0.25rem' }}>
                  <AgentInfoPanel agents={agents} compact />
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>No case selected</h3>
                <p>Choose an onboarding case from the sidebar, or create a new synthetic case to start the multi-agent review workflow.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
