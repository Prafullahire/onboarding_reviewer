import { v4 as uuidv4 } from 'uuid';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getPool } from '../db/connection.js';
import {
  OnboardingCaseDataSchema,
  type OnboardingCase,
  type OnboardingCaseData,
} from '../types/onboarding-case.js';

interface CaseRow extends RowDataPacket {
  id: string;
  reference_number: string;
  title: string;
  case_data: string | OnboardingCaseData;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: CaseRow): OnboardingCase {
  const caseData =
    typeof row.case_data === 'string'
      ? (JSON.parse(row.case_data) as OnboardingCaseData)
      : row.case_data;

  return {
    id: row.id,
    referenceNumber: row.reference_number,
    title: row.title,
    caseData,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class CaseService {
  async list(): Promise<OnboardingCase[]> {
    const pool = getPool();
    const [rows] = await pool.execute<CaseRow[]>(
      'SELECT * FROM onboarding_cases ORDER BY created_at DESC'
    );
    return rows.map(mapRow);
  }

  async getById(id: string): Promise<OnboardingCase | null> {
    const pool = getPool();
    const [rows] = await pool.execute<CaseRow[]>(
      'SELECT * FROM onboarding_cases WHERE id = :id',
      { id }
    );
    return rows.length > 0 ? mapRow(rows[0]) : null;
  }

  async create(title: string, caseData: OnboardingCaseData): Promise<OnboardingCase> {
    const validated = OnboardingCaseDataSchema.parse(caseData);
    const id = uuidv4();
    const referenceNumber = `ONB-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const pool = getPool();
    await pool.execute<ResultSetHeader>(
      `INSERT INTO onboarding_cases (id, reference_number, title, case_data)
       VALUES (:id, :referenceNumber, :title, :caseData)`,
      {
        id,
        referenceNumber,
        title,
        caseData: JSON.stringify(validated),
      }
    );

    const created = await this.getById(id);
    if (!created) throw new Error('Failed to create case');
    return created;
  }

  async delete(id: string): Promise<boolean> {
    const pool = getPool();
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM onboarding_cases WHERE id = :id',
      { id }
    );
    return result.affectedRows > 0;
  }
}
