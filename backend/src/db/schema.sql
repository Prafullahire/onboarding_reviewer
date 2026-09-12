CREATE TABLE IF NOT EXISTS onboarding_cases (
  id VARCHAR(36) PRIMARY KEY,
  reference_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  case_data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reference_number (reference_number),
  INDEX idx_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS review_workflows (
  id VARCHAR(36) PRIMARY KEY,
  case_id VARCHAR(36) NOT NULL,
  autonomy_mode ENUM('human_approval_required', 'exception_only_review') NOT NULL,
  status ENUM(
    'pending',
    'running',
    'awaiting_human_approval',
    'awaiting_exception_review',
    'completed',
    'failed',
    'cancelled'
  ) NOT NULL DEFAULT 'pending',
  traces JSON NOT NULL DEFAULT (JSON_ARRAY()),
  recommendation JSON NULL,
  final_decision ENUM('approve', 'reject', 'refer_manual_review') NULL,
  human_decision ENUM('approve', 'reject', 'refer_manual_review', 'override') NULL,
  human_decision_notes TEXT NULL,
  human_decision_at TIMESTAMP NULL,
  requires_human_action BOOLEAN NOT NULL DEFAULT FALSE,
  exception_reason TEXT NULL,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES onboarding_cases(id) ON DELETE CASCADE,
  INDEX idx_case_id (case_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id VARCHAR(36) PRIMARY KEY,
  workflow_id VARCHAR(36) NOT NULL,
  case_id VARCHAR(36) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES review_workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (case_id) REFERENCES onboarding_cases(id) ON DELETE CASCADE,
  INDEX idx_workflow_id (workflow_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at)
);
