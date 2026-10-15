import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Plus,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Building2,
  Calendar
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { Modal, AlertBanner, EmptyState, LoadingSkeleton } from '../components/UIComponents';
import { useAuth } from '../context/AuthContext';
import { eventsApi, opsApi } from '../services/api';

export default function VendorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contracts, setContracts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [modalError, setModalError] = useState('');

  const [form, setForm] = useState({
    event_id: '',
    vendor_name: user?.name || 'Apex Audio Visuals',
    service_type: 'Audio Visual & Stage Setup',
    contract_amount: '35000',
    notes: 'Sound engineering, mic systems, and stage lighting'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, evRes] = await Promise.all([
        opsApi.getContracts().catch(() => ({ contracts: [] })),
        eventsApi.getAll().catch(() => ({ events: [] }))
      ]);
      if (cRes?.contracts) setContracts(cRes.contracts);
      if (evRes?.events) {
        setEvents(evRes.events);
        if (evRes.events.length > 0 && !form.event_id) {
          setForm((prev) => ({ ...prev, event_id: evRes.events[0].id }));
        }
      }
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to load vendor data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      await opsApi.createContract({
        ...form,
        event_id: parseInt(form.event_id, 10),
        contract_amount: parseFloat(form.contract_amount) || 0
      });
      setNotice({ type: 'success', text: 'Service agreement submitted and recorded successfully!' });
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setModalError(err.message || 'Failed to submit agreement.');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await opsApi.updateContract(id, { payment_status: newStatus });
      setNotice({ type: 'success', text: `Agreement status updated to "${newStatus}".` });
      await loadData();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to update status.' });
    }
  };

  return (
    <AppLayout
      title="Vendor Service Portal"
      subtitle="Manage audio/visual contracts, catering fulfillment, security agreements, and invoices"
    >
      <AlertBanner
        message={notice?.text}
        type={notice?.type}
        onClose={() => setNotice(null)}
      />

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Active Service Agreements & Invoices</h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.825rem', color: '#64748B' }}>
              Service contracts linked to college festivals and conferences
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} />
            <span>Submit Agreement</span>
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton lines={4} />
        ) : contracts.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No vendor agreements found"
            description="Log your first AV, catering, or stage management agreement."
            action={
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus size={16} />
                <span>Submit Agreement</span>
              </button>
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Vendor Partner</th>
                  <th>Service Category</th>
                  <th>Assigned Event</th>
                  <th>Agreed Amount</th>
                  <th>Payment Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: '#1D4ED8' }}>{c.vendor_name}</td>
                    <td>{c.service_type}</td>
                    <td>
                      <div>{c.event_title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Date: {c.event_date}</div>
                    </td>
                    <td style={{ fontWeight: 700 }}>₹{parseFloat(c.contract_amount || 0).toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${c.payment_status === 'Paid' ? 'available' : c.payment_status === 'Approved' ? 'scheduled' : 'maintenance'}`}>
                        {c.payment_status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        {c.payment_status !== 'Approved' && c.payment_status !== 'Paid' && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', color: '#059669', borderColor: '#A7F3D0' }}
                            onClick={() => handleUpdateStatus(c.id, 'Approved')}
                          >
                            Approve
                          </button>
                        )}
                        {c.payment_status !== 'Paid' && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', color: '#1D4ED8', borderColor: '#BFDBFE' }}
                            onClick={() => handleUpdateStatus(c.id, 'Paid')}
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Agreement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Service Agreement"
        maxWidth="520px"
      >
        {modalError && <AlertBanner type="error" message={modalError} />}

        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Vendor / Agency Name *
              </label>
              <input
                type="text"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                value={form.vendor_name}
                onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Assigned Event *
              </label>
              <select
                className="filter-select"
                style={{ width: '100%' }}
                value={form.event_id}
                onChange={(e) => setForm({ ...form, event_id: e.target.value })}
                required
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.date})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Service Category *
              </label>
              <input
                type="text"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                placeholder="e.g. Stage Lighting, Audio Visual, Catering"
                value={form.service_type}
                onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Agreed Contract Amount (₹) *
              </label>
              <input
                type="number"
                min="0"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                value={form.contract_amount}
                onChange={(e) => setForm({ ...form, contract_amount: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Notes / Scope of Work
              </label>
              <textarea
                className="search-input"
                style={{ padding: '0.65rem 0.85rem', height: '70px', resize: 'vertical' }}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Agreement
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
