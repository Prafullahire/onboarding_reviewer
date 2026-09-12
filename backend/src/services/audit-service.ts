import { v4 as uuidv4 } from 'uuid';
import type { RowDataPacket } from 'mysql2';
import { getPool } from '../db/connection.js';

export interface AuditEvent {
  workflowId: string;
  caseId: string;
  eventType: string;
  eventData: Record<string, unknown>;
}

export class AuditService {
  async log(event: AuditEvent): Promise<void> {
    const pool = getPool();
    await pool.execute(
      `INSERT INTO audit_log (id, workflow_id, case_id, event_type, event_data)
       VALUES (:id, :workflowId, :caseId, :eventType, :eventData)`,
      {
        id: uuidv4(),
        workflowId: event.workflowId,
        caseId: event.caseId,
        eventType: event.eventType,
        eventData: JSON.stringify(event.eventData),
      }
    );
  }

  async getByWorkflow(workflowId: string): Promise<AuditEvent[]> {
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT workflow_id, case_id, event_type, event_data, created_at
       FROM audit_log WHERE workflow_id = :workflowId ORDER BY created_at ASC`,
      { workflowId }
    );

    return (rows as Array<{
      workflow_id: string;
      case_id: string;
      event_type: string;
      event_data: string;
    }>).map((row) => ({
      workflowId: row.workflow_id,
      caseId: row.case_id,
      eventType: row.event_type,
      eventData: JSON.parse(row.event_data) as Record<string, unknown>,
    }));
  }
}
