import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Share2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { Modal, ConfirmModal, AlertBanner, EmptyState, LoadingSkeleton } from '../components/UIComponents';
import { resourcesApi, eventsApi } from '../services/api';

export default function ResourcesPage() {
  const location = useLocation();

  const [resources, setResources] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [banner, setBanner] = useState(null);
  const [modalError, setModalError] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Allocation Modal
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [allocTargetResource, setAllocTargetResource] = useState(null);
  const [allocEventId, setAllocEventId] = useState('');
  const [allocQuantity, setAllocQuantity] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    resource_code: '',
    name: '',
    type: 'Equipment',
    quantity: '10'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [rRes, evRes] = await Promise.all([
        resourcesApi.getAll().catch(() => ({ resources: [] })),
        eventsApi.getAll().catch(() => ({ events: [] }))
      ]);
      if (rRes?.resources) setResources(rRes.resources);
      if (evRes?.events) {
        setEvents(evRes.events);
        if (evRes.events.length > 0 && !allocEventId) {
          setAllocEventId(evRes.events[0].id);
        }
      }
    } catch (err) {
      setBanner({ type: 'error', text: err.message || 'Failed to load resources.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (location.state?.openCreate) {
      openCreateModal();
    }
  }, [location.state]);

  const openCreateModal = () => {
    setEditingResource(null);
    setFormData({
      resource_code: `R${String(resources.length + 1).padStart(3, '0')}`,
      name: '',
      type: 'Equipment',
      quantity: '10'
    });
    setModalError('');
    setIsFormOpen(true);
  };

  const openEditModal = (r) => {
    setEditingResource(r);
    setFormData({
      resource_code: r.resource_code || '',
      name: r.name,
      type: r.type,
      quantity: String(r.quantity)
    });
    setModalError('');
    setIsFormOpen(true);
  };

  const openAllocateModal = (r) => {
    setAllocTargetResource(r);
    setAllocQuantity('1');
    setModalError('');
    setIsAllocateOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    const qty = parseInt(formData.quantity, 10);
    if (isNaN(qty) || qty < 0) {
      setModalError('Quantity must be a non-negative integer.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingResource) {
        await resourcesApi.update(editingResource.id, formData);
        setBanner({ type: 'success', text: `Resource "${formData.name}" updated successfully.` });
      } else {
        await resourcesApi.create(formData);
        setBanner({ type: 'success', text: `Resource "${formData.name}" created successfully.` });
      }
      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      setModalError(err.message || 'Failed to save resource.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    const reqQty = parseInt(allocQuantity, 10);
    if (isNaN(reqQty) || reqQty <= 0) {
      setModalError('Quantity must be greater than zero.');
      return;
    }

    if (allocTargetResource && reqQty > allocTargetResource.available_quantity) {
      setModalError(`Cannot allocate ${reqQty}. Only ${allocTargetResource.available_quantity} available in stock.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await eventsApi.allocateResource(allocEventId, {
        resourceId: allocTargetResource.id,
        quantity: reqQty
      });
      setBanner({
        type: 'success',
        text: `Successfully allocated ${reqQty} units of ${allocTargetResource.name} to event.`
      });
      setIsAllocateOpen(false);
      await loadData();
    } catch (err) {
      setModalError(err.message || 'Allocation rejected by server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await resourcesApi.delete(deleteTarget.id);
      setBanner({ type: 'success', text: `Resource "${deleteTarget.name}" deleted.` });
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setBanner({ type: 'error', text: err.message || 'Failed to delete resource.' });
    }
  };

  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.resource_code?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || r.type === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout
      title="Resource Management"
      subtitle="Track equipment, microphones, projectors, campus security, and shuttle buses"
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
              placeholder="Search by resource name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="Equipment">Equipment (Projectors, Mic, Sound)</option>
              <option value="Staff">Staff (Security, Technicians)</option>
              <option value="Transport">Transport (Buses, Vans)</option>
              <option value="Other">Other</option>
            </select>

            <button type="button" className="btn-primary" onClick={openCreateModal}>
              <Plus size={16} />
              <span>Add Resource</span>
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton lines={4} />
        ) : filteredResources.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No resources found"
            description="Add projectors, sound systems, or personnel to build your inventory."
            action={
              <button type="button" className="btn-primary" onClick={openCreateModal}>
                <Plus size={16} />
                <span>Add Resource</span>
              </button>
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Resource Name</th>
                  <th>Category</th>
                  <th>Total Stock</th>
                  <th>Available Quantity</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600, color: '#1D4ED8' }}>{r.resource_code || `R${r.id}`}</td>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td>
                      <span style={{ background: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.75rem' }}>
                        {r.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.quantity}</td>
                    <td>
                      <strong style={{ color: r.available_quantity > 0 ? '#059669' : '#DC2626' }}>
                        {r.available_quantity}
                      </strong>{' '}
                      <span style={{ color: '#64748B', fontSize: '0.8rem' }}>/ {r.quantity}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${r.status?.toLowerCase() || 'available'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Allocate to Event"
                          disabled={r.available_quantity <= 0}
                          onClick={() => openAllocateModal(r)}
                        >
                          <Share2 size={16} color={r.available_quantity > 0 ? '#1D4ED8' : '#94A3B8'} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Edit Resource"
                          onClick={() => openEditModal(r)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon danger"
                          title="Delete Resource"
                          onClick={() => setDeleteTarget(r)}
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

      {/* Create / Edit Resource Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingResource ? 'Edit Resource' : 'Add New Resource'}
        maxWidth="500px"
      >
        {modalError && <AlertBanner type="error" message={modalError} />}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Resource Code
              </label>
              <input
                type="text"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                value={formData.resource_code}
                onChange={(e) => setFormData({ ...formData, resource_code: e.target.value })}
                placeholder="e.g. R006"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Category *
              </label>
              <select
                className="filter-select"
                style={{ width: '100%' }}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Equipment">Equipment</option>
                <option value="Staff">Staff</option>
                <option value="Transport">Transport</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Resource Name *
              </label>
              <input
                type="text"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                placeholder="e.g. 4K Video Projector"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Total Quantity *
              </label>
              <input
                type="number"
                min="0"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
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
              {isSubmitting ? 'Saving...' : editingResource ? 'Save Changes' : 'Create Resource'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Allocate to Event Modal */}
      <Modal
        isOpen={isAllocateOpen}
        onClose={() => setIsAllocateOpen(false)}
        title={`Allocate: ${allocTargetResource?.name}`}
        maxWidth="480px"
      >
        {modalError && <AlertBanner type="error" message={modalError} />}

        <form onSubmit={handleAllocateSubmit}>
          <p style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.875rem' }}>
            Currently available in stock:{' '}
            <strong style={{ color: '#059669' }}>{allocTargetResource?.available_quantity} units</strong>.
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Assign to Event *
            </label>
            <select
              className="filter-select"
              style={{ width: '100%' }}
              value={allocEventId}
              onChange={(e) => setAllocEventId(e.target.value)}
              required
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.date})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Quantity to Allocate *
            </label>
            <input
              type="number"
              min="1"
              max={allocTargetResource?.available_quantity || 1}
              className="search-input"
              style={{ paddingLeft: '0.85rem' }}
              value={allocQuantity}
              onChange={(e) => setAllocQuantity(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAllocateOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Allocating...' : 'Confirm Allocation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Resource"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmText="Yes, Delete"
      />
    </AppLayout>
  );
}
