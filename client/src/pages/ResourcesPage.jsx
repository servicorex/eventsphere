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
  CheckCircle2,
  Layers,
  ArrowRight
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
        text: `Allocated ${reqQty} unit(s) of "${allocTargetResource.name}" to event.`
      });
      setIsAllocateOpen(false);
      await loadData();
    } catch (err) {
      setModalError(err.message || 'Failed to allocate resource.');
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
      r.resource_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.type?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || r.type === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout
      title="Resource Inventory"
      subtitle="Track physical equipment, technical kits, audio/visual units, and event staff"
    >
      <AlertBanner
        message={banner?.text}
        type={banner?.type}
        onClose={() => setBanner(null)}
      />

      <div className="card">
        {/* Search & Filter Toolbar */}
        <div className="filter-bar">
          <div className="search-box">
            <Search size={16} className="search-box-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by resource name, type, or code..."
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
              <option value="Equipment">Equipment</option>
              <option value="Staff">Staff</option>
              <option value="Service">Service</option>
            </select>

            <button type="button" className="btn-primary" onClick={openCreateModal}>
              <Plus size={16} />
              <span>Add Resource</span>
            </button>
          </div>
        </div>

        {/* Content Table or Empty State */}
        {loading ? (
          <LoadingSkeleton lines={4} />
        ) : filteredResources.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No resources found"
            description="Add your first piece of equipment or staff role."
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
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Total Stock</th>
                  <th>Available Units</th>
                  <th>Inventory Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.map((r) => {
                  const isDepleted = r.available_quantity <= 0;
                  const isLow = r.available_quantity > 0 && r.available_quantity <= 3;
                  return (
                    <tr key={r.id}>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.45rem',
                          background: 'var(--canvas-subtle)',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-xs)',
                          color: 'var(--text-secondary)'
                        }}>
                          {r.resource_code || `R-${r.id}`}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</td>
                      <td>
                        <span style={{
                          fontSize: '0.775rem',
                          padding: '0.2rem 0.5rem',
                          backgroundColor: 'var(--canvas-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-secondary)'
                        }}>
                          {r.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{r.quantity} units</td>
                      <td>
                        <strong style={{
                          color: isDepleted ? 'var(--color-danger)' : isLow ? 'var(--color-warning)' : 'var(--color-success)',
                          fontSize: '0.95rem'
                        }}>
                          {r.available_quantity}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '0.25rem' }}>
                          / {r.quantity}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${isDepleted ? 'depleted' : isLow ? 'maintenance' : 'available'}`}>
                          {isDepleted ? 'Depleted' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ height: '30px', padding: '0 0.65rem', fontSize: '0.775rem' }}
                            title="Allocate to Event"
                            disabled={isDepleted}
                            onClick={() => openAllocateModal(r)}
                          >
                            <Share2 size={13} />
                            <span>Allocate</span>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingResource ? 'Edit Resource' : 'Add Inventory Resource'}
        maxWidth="480px"
      >
        {modalError && <AlertBanner type="error" message={modalError} />}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Code *</label>
                <input
                  type="text"
                  className="search-input"
                  style={{ paddingLeft: '0.85rem', fontFamily: 'var(--font-mono)' }}
                  placeholder="e.g. R001"
                  value={formData.resource_code}
                  onChange={(e) => setFormData({ ...formData, resource_code: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Resource Name *</label>
                <input
                  type="text"
                  className="search-input"
                  style={{ paddingLeft: '0.85rem' }}
                  placeholder="e.g. 4K Projector Rig"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Category *</label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Equipment">Equipment</option>
                  <option value="Staff">Staff</option>
                  <option value="Service">Service</option>
                </select>
              </div>

              <div>
                <label className="form-label">Total Stock Quantity *</label>
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
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editingResource ? 'Save Changes' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Allocate to Event Modal */}
      <Modal
        isOpen={isAllocateOpen}
        onClose={() => setIsAllocateOpen(false)}
        title={`Allocate "${allocTargetResource?.name}"`}
        maxWidth="460px"
      >
        {modalError && <AlertBanner type="error" message={modalError} />}

        <form onSubmit={handleAllocateSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div style={{
              background: 'var(--canvas-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Available in Stock:</span>
              <strong style={{ fontSize: '1rem', color: 'var(--color-brand)' }}>
                {allocTargetResource?.available_quantity} units
              </strong>
            </div>

            <div>
              <label className="form-label">Select Scheduled Event *</label>
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

            <div>
              <label className="form-label">Units to Reserve *</label>
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
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsAllocateOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !allocTargetResource || allocTargetResource.available_quantity <= 0}
            >
              {isSubmitting ? 'Allocating...' : 'Confirm Allocation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Resource"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Any past allocation history will be unlinked.`}
        confirmText="Delete Resource"
      />
    </AppLayout>
  );
}
