import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Users,
  DollarSign
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { Modal, ConfirmModal, AlertBanner, EmptyState, LoadingSkeleton } from '../components/UIComponents';
import { venuesApi } from '../services/api';

export default function VenuesPage() {
  const location = useLocation();

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [banner, setBanner] = useState(null);
  const [modalError, setModalError] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formData, setFormData] = useState({
    venue_code: '',
    name: '',
    location: '',
    capacity: '500',
    availability: 'Available',
    cost_per_day: '25000'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadVenues = async () => {
    try {
      setLoading(true);
      const res = await venuesApi.getAll();
      if (res?.venues) setVenues(res.venues);
    } catch (err) {
      setBanner({ type: 'error', text: err.message || 'Failed to load venues.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenues();
  }, []);

  useEffect(() => {
    if (location.state?.openCreate) {
      openCreateModal();
    }
  }, [location.state]);

  const openCreateModal = () => {
    setEditingVenue(null);
    setFormData({
      venue_code: `V${String(venues.length + 1).padStart(3, '0')}`,
      name: '',
      location: '',
      capacity: '500',
      availability: 'Available',
      cost_per_day: '25000'
    });
    setModalError('');
    setIsFormOpen(true);
  };

  const openEditModal = (v) => {
    setEditingVenue(v);
    setFormData({
      venue_code: v.venue_code || '',
      name: v.name,
      location: v.location,
      capacity: String(v.capacity),
      availability: v.availability,
      cost_per_day: String(v.cost_per_day || 0)
    });
    setModalError('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    const cap = parseInt(formData.capacity, 10);
    if (isNaN(cap) || cap <= 0) {
      setModalError('Capacity must be a positive number.');
      return;
    }

    const cost = parseFloat(formData.cost_per_day);
    if (isNaN(cost) || cost < 0) {
      setModalError('Cost per day must be non-negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingVenue) {
        await venuesApi.update(editingVenue.id, formData);
        setBanner({ type: 'success', text: `Venue "${formData.name}" updated successfully.` });
      } else {
        await venuesApi.create(formData);
        setBanner({ type: 'success', text: `Venue "${formData.name}" added successfully.` });
      }
      setIsFormOpen(false);
      await loadVenues();
    } catch (err) {
      setModalError(err.message || 'Failed to save venue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await venuesApi.delete(deleteTarget.id);
      setBanner({ type: 'success', text: `Venue "${deleteTarget.name}" deleted.` });
      setDeleteTarget(null);
      await loadVenues();
    } catch (err) {
      // If server rejects because of linked events, display server message
      setBanner({ type: 'error', text: err.message || 'Failed to delete venue.' });
    }
  };

  const filteredVenues = venues.filter((v) => {
    const matchesSearch =
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.venue_code?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || v.availability === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout
      title="Venue Management"
      subtitle="Configure event halls, auditoriums, seating capacities, and daily rates"
    >
      <AlertBanner
        message={banner?.text}
        type={banner?.type}
        onClose={() => setBanner(null)}
      />

      <div className="card">
        <div className="filter-bar">
          <div className="search-box">
            <Search size={16} className="search-box-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by venue name, location, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Availabilities</option>
              <option value="Available">Available</option>
              <option value="Booked">Booked</option>
              <option value="Maintenance">Maintenance</option>
            </select>

            <button type="button" className="btn-primary" onClick={openCreateModal}>
              <Plus size={16} />
              <span>Add Venue</span>
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton lines={4} />
        ) : filteredVenues.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No venues found"
            description="Add your first auditorium or hall to begin booking."
            action={
              <button type="button" className="btn-primary" onClick={openCreateModal}>
                <Plus size={16} />
                <span>Add Venue</span>
              </button>
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Venue Name</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Cost / Day</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVenues.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600, color: '#1D4ED8' }}>{v.venue_code || `V${v.id}`}</td>
                    <td style={{ fontWeight: 600 }}>{v.name}</td>
                    <td>{v.location}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{v.capacity?.toLocaleString()}</span> seats
                    </td>
                    <td>
                      <span className={`badge badge-${v.availability?.toLowerCase() || 'available'}`}>
                        {v.availability}
                      </span>
                    </td>
                    <td>₹{parseFloat(v.cost_per_day || 0).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Edit Venue"
                          onClick={() => openEditModal(v)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon danger"
                          title="Delete Venue"
                          onClick={() => setDeleteTarget(v)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Venue Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingVenue ? 'Edit Venue' : 'Add New Venue'}
        maxWidth="520px"
      >
        {modalError && <AlertBanner type="error" message={modalError} />}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Venue Code
              </label>
              <input
                type="text"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                value={formData.venue_code}
                onChange={(e) => setFormData({ ...formData, venue_code: e.target.value })}
                placeholder="e.g. V005"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Availability Status *
              </label>
              <select
                className="filter-select"
                style={{ width: '100%' }}
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="Booked">Booked</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Venue Name *
              </label>
              <input
                type="text"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                placeholder="e.g. Main Auditorium"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Location *
              </label>
              <input
                type="text"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                placeholder="e.g. North Campus, Block B"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Seating Capacity *
              </label>
              <input
                type="number"
                min="1"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Cost Per Day (₹)
              </label>
              <input
                type="number"
                min="0"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                value={formData.cost_per_day}
                onChange={(e) => setFormData({ ...formData, cost_per_day: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingVenue ? 'Save Changes' : 'Create Venue'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Venue"
        message={`Are you sure you want to delete venue "${deleteTarget?.name}"?`}
        confirmText="Yes, Delete"
      />
    </AppLayout>
  );
}
