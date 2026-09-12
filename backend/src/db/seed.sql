INSERT INTO onboarding_cases (id, reference_number, title, case_data) VALUES
(
  'case-001-low-risk',
  'ONB-2026-0001',
  'Low Risk Individual - Complete Application',
  JSON_OBJECT(
    'customerProfile', JSON_OBJECT(
      'fullName', 'Alexandra Chen',
      'dateOfBirth', '1990-03-15',
      'nationality', 'United States',
      'email', 'alexandra.chen@example-mail.com',
      'phone', '+1-555-0101',
      'customerType', 'individual'
    ),
    'identityDetails', JSON_OBJECT(
      'idType', 'passport',
      'idNumber', 'P12345678',
      'issuingCountry', 'United States',
      'expiryDate', '2030-06-30',
      'nameOnDocument', 'Alexandra Chen'
    ),
    'addressDetails', JSON_OBJECT(
      'street', '742 Evergreen Terrace',
      'city', 'Springfield',
      'state', 'IL',
      'postalCode', '62704',
      'country', 'United States',
      'addressType', 'residential'
    ),
    'employmentInfo', JSON_OBJECT(
      'status', 'employed',
      'employerName', 'TechCorp Solutions',
      'jobTitle', 'Software Engineer',
      'annualIncome', 95000,
      'industry', 'Technology',
      'yearsEmployed', 5
    ),
    'supportingDocuments', JSON_ARRAY(
      JSON_OBJECT('documentType', 'passport', 'fileName', 'passport_scan.pdf', 'uploadedAt', '2026-01-10T10:00:00Z', 'verified', true),
      JSON_OBJECT('documentType', 'proof_of_address', 'fileName', 'utility_bill.pdf', 'uploadedAt', '2026-01-10T10:05:00Z', 'verified', true),
      JSON_OBJECT('documentType', 'proof_of_income', 'fileName', 'pay_stub.pdf', 'uploadedAt', '2026-01-10T10:10:00Z', 'verified', true)
    ),
    'riskIndicators', JSON_OBJECT(
      'pepStatus', false,
      'sanctionsMatch', false,
      'adverseMedia', false,
      'highRiskCountry', false,
      'unusualTransactionPattern', false,
      'sourceOfFundsUnclear', false
    )
  )
),
(
  'case-002-high-risk',
  'ONB-2026-0002',
  'High Risk - PEP with Missing Documents',
  JSON_OBJECT(
    'customerProfile', JSON_OBJECT(
      'fullName', 'Marcus Volkov',
      'dateOfBirth', '1975-11-22',
      'nationality', 'Country X',
      'email', 'm.volkov@example-mail.com',
      'phone', '+99-555-0202',
      'customerType', 'individual'
    ),
    'identityDetails', JSON_OBJECT(
      'idType', 'national_id',
      'idNumber', 'NID-99887766',
      'issuingCountry', 'Country X',
      'expiryDate', '2025-12-31',
      'nameOnDocument', 'M. Volkov'
    ),
    'addressDetails', JSON_OBJECT(
      'street', '15 Harbor View',
      'city', 'Port City',
      'state', 'Coastal',
      'postalCode', '99001',
      'country', 'Country X',
      'addressType', 'residential'
    ),
    'employmentInfo', JSON_OBJECT(
      'status', 'self_employed',
      'employerName', 'Volkov Trading LLC',
      'jobTitle', 'Director',
      'annualIncome', 500000,
      'industry', 'Import/Export',
      'yearsEmployed', 12
    ),
    'supportingDocuments', JSON_ARRAY(
      JSON_OBJECT('documentType', 'national_id', 'fileName', 'id_front.jpg', 'uploadedAt', '2026-01-15T14:00:00Z', 'verified', false)
    ),
    'riskIndicators', JSON_OBJECT(
      'pepStatus', true,
      'sanctionsMatch', false,
      'adverseMedia', true,
      'highRiskCountry', true,
      'unusualTransactionPattern', true,
      'sourceOfFundsUnclear', true
    )
  )
),
(
  'case-003-inconsistent',
  'ONB-2026-0003',
  'Identity Inconsistency - Name Mismatch',
  JSON_OBJECT(
    'customerProfile', JSON_OBJECT(
      'fullName', 'Sarah Johnson',
      'dateOfBirth', '1988-07-08',
      'nationality', 'United Kingdom',
      'email', 'sarah.j@example-mail.com',
      'phone', '+44-555-0303',
      'customerType', 'individual'
    ),
    'identityDetails', JSON_OBJECT(
      'idType', 'drivers_license',
      'idNumber', 'DL-44556677',
      'issuingCountry', 'United Kingdom',
      'expiryDate', '2028-03-20',
      'nameOnDocument', 'S. J. Williams'
    ),
    'addressDetails', JSON_OBJECT(
      'street', '42 Baker Street',
      'city', 'London',
      'state', 'England',
      'postalCode', 'NW1 6XE',
      'country', 'United Kingdom',
      'addressType', 'residential'
    ),
    'employmentInfo', JSON_OBJECT(
      'status', 'employed',
      'employerName', 'Global Finance Ltd',
      'jobTitle', 'Account Manager',
      'annualIncome', 65000,
      'industry', 'Financial Services',
      'yearsEmployed', 3
    ),
    'supportingDocuments', JSON_ARRAY(
      JSON_OBJECT('documentType', 'drivers_license', 'fileName', 'license.pdf', 'uploadedAt', '2026-02-01T09:00:00Z', 'verified', true),
      JSON_OBJECT('documentType', 'proof_of_address', 'fileName', 'bank_statement.pdf', 'uploadedAt', '2026-02-01T09:05:00Z', 'verified', true)
    ),
    'riskIndicators', JSON_OBJECT(
      'pepStatus', false,
      'sanctionsMatch', false,
      'adverseMedia', false,
      'highRiskCountry', false,
      'unusualTransactionPattern', false,
      'sourceOfFundsUnclear', false
    )
  )
);
