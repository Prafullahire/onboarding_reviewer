import { useState } from 'react';
import type { OnboardingCaseData } from '../types';

interface CaseFormProps {
  onSubmit: (title: string, caseData: OnboardingCaseData) => void;
  onCancel: () => void;
  initialData?: OnboardingCaseData;
  initialTitle?: string;
}

const emptyCase: OnboardingCaseData = {
  customerProfile: {
    fullName: '',
    dateOfBirth: '',
    nationality: '',
    email: '',
    phone: '',
    customerType: 'individual',
  },
  identityDetails: {
    idType: 'passport',
    idNumber: '',
    issuingCountry: '',
    expiryDate: '',
    nameOnDocument: '',
  },
  addressDetails: {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    addressType: 'residential',
  },
  employmentInfo: {
    status: 'employed',
    employerName: '',
    jobTitle: '',
    annualIncome: undefined,
    industry: '',
    yearsEmployed: undefined,
  },
  supportingDocuments: [],
  riskIndicators: {
    pepStatus: false,
    sanctionsMatch: false,
    adverseMedia: false,
    highRiskCountry: false,
    unusualTransactionPattern: false,
    sourceOfFundsUnclear: false,
  },
};

export function CaseForm({ onSubmit, onCancel, initialData, initialTitle }: CaseFormProps) {
  const [title, setTitle] = useState(initialTitle ?? '');
  const [form, setForm] = useState<OnboardingCaseData>(initialData ?? emptyCase);

  const updateProfile = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      customerProfile: { ...prev.customerProfile, [field]: value },
    }));
  };

  const updateIdentity = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      identityDetails: { ...prev.identityDetails, [field]: value },
    }));
  };

  const updateRisk = (field: string, value: boolean) => {
    setForm((prev) => ({
      ...prev,
      riskIndicators: { ...prev.riskIndicators, [field]: value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title, form);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>{initialData ? 'Review & Save Case' : 'Create Synthetic Case'}</h2>
          <p>All data must be synthetic — no real customer information</p>
        </div>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Case Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Low Risk Individual Application" />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.customerProfile.fullName} onChange={(e) => updateProfile('fullName', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" value={form.customerProfile.dateOfBirth} onChange={(e) => updateProfile('dateOfBirth', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Nationality</label>
              <input value={form.customerProfile.nationality} onChange={(e) => updateProfile('nationality', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.customerProfile.email} onChange={(e) => updateProfile('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>ID Type</label>
              <select value={form.identityDetails.idType} onChange={(e) => updateIdentity('idType', e.target.value)}>
                <option value="passport">Passport</option>
                <option value="national_id">National ID</option>
                <option value="drivers_license">Driver's License</option>
              </select>
            </div>
            <div className="form-group">
              <label>Name on Document</label>
              <input value={form.identityDetails.nameOnDocument} onChange={(e) => updateIdentity('nameOnDocument', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>ID Number</label>
              <input value={form.identityDetails.idNumber} onChange={(e) => updateIdentity('idNumber', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Expiry Date</label>
              <input type="date" value={form.identityDetails.expiryDate} onChange={(e) => updateIdentity('expiryDate', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Issuing Country</label>
              <input value={form.identityDetails.issuingCountry} onChange={(e) => updateIdentity('issuingCountry', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Street Address</label>
              <input value={form.addressDetails.street} onChange={(e) => setForm((p) => ({ ...p, addressDetails: { ...p.addressDetails, street: e.target.value } }))} required />
            </div>
            <div className="form-group">
              <label>City</label>
              <input value={form.addressDetails.city} onChange={(e) => setForm((p) => ({ ...p, addressDetails: { ...p.addressDetails, city: e.target.value } }))} required />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input value={form.addressDetails.country} onChange={(e) => setForm((p) => ({ ...p, addressDetails: { ...p.addressDetails, country: e.target.value } }))} required />
            </div>
          </div>

          <fieldset className="fieldset">
            <legend>Risk Indicators</legend>
            <div className="checkbox-grid">
              {Object.entries(form.riskIndicators).map(([key, value]) => (
                <label key={key} className="checkbox-label">
                  <input type="checkbox" checked={value} onChange={(e) => updateRisk(key, e.target.checked)} />
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-primary">Save Case</button>
          </div>
        </form>
      </div>
    </div>
  );
}
