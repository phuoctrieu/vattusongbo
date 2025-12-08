import React, { useState, useEffect } from 'react';
import { 
  Proposal, ProposalItem, ProposalStatus, ProposalPriority, MaterialType,
  PROPOSAL_STATUS_LABELS, PROPOSAL_PRIORITY_LABELS, MATERIAL_TYPE_LABELS,
  UserRole, UNIT_SUGGESTIONS
} from '../types';
import { db } from '../services/mockDb';
import { 
  Plus, Search, Filter, Check, X, FileText, Clock, AlertTriangle,
  CheckCircle, XCircle, ShoppingCart, Download, Trash2, Eye, ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ProposalsProps {
  user: { id: number; fullName: string; role: UserRole };
}

const Proposals: React.FC<ProposalsProps> = ({ user }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [filterStatus, setFilterStatus] = useState<ProposalStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    department: '',
    priority: ProposalPriority.NORMAL,
    reason: '',
    note: ''
  });
  const [items, setItems] = useState<Partial<ProposalItem>[]>([{
    name: '',
    type: MaterialType.CONSUMABLE,
    unit: 'Cái',
    quantity: 1,
    estimatedPrice: 0,
    reason: ''
  }]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await db.getProposals();
      setProposals(data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      department: '',
      priority: ProposalPriority.NORMAL,
      reason: '',
      note: ''
    });
    setItems([{
      name: '',
      type: MaterialType.CONSUMABLE,
      unit: 'Cái',
      quantity: 1,
      estimatedPrice: 0,
      reason: ''
    }]);
  };

  const handleSubmit = async () => {
    if (!formData.department || !formData.reason || items.some(i => !i.name || !i.quantity)) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      await db.createProposal({
        requesterId: user.id,
        department: formData.department,
        priority: formData.priority,
        reason: formData.reason,
        note: formData.note,
        items: items as ProposalItem[]
      });
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      alert('Lỗi khi tạo đề xuất');
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Xác nhận duyệt đề xuất này?')) return;
    try {
      await db.approveProposal(id, user.id);
      fetchData();
      if (showDetailModal) setShowDetailModal(false);
    } catch (error) {
      alert('Lỗi khi duyệt');
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (!reason) return;
    try {
      await db.rejectProposal(id, user.id, reason);
      fetchData();
      if (showDetailModal) setShowDetailModal(false);
    } catch (error) {
      alert('Lỗi khi từ chối');
    }
  };

  const handleMarkPurchased = async (id: number) => {
    if (!confirm('Đánh dấu đề xuất này đã mua?')) return;
    try {
      await db.markProposalPurchased(id);
      fetchData();
    } catch (error) {
      alert('Lỗi');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xác nhận xóa đề xuất này?')) return;
    try {
      await db.deleteProposal(id);
      fetchData();
    } catch (error) {
      alert('Lỗi khi xóa');
    }
  };

  const addItem = () => {
    setItems([...items, {
      name: '',
      type: MaterialType.CONSUMABLE,
      unit: 'Cái',
      quantity: 1,
      estimatedPrice: 0,
      reason: ''
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  // Export đề xuất đã duyệt ra Excel
  const exportApprovedToExcel = () => {
    const approved = proposals.filter(p => p.status === ProposalStatus.APPROVED);
    if (approved.length === 0) {
      alert('Không có đề xuất nào đã duyệt');
      return;
    }

    // Flatten items for export
    const data: any[] = [];
    approved.forEach(p => {
      p.items.forEach((item, idx) => {
        data.push({
          'Mã đề xuất': p.code,
          'Ngày tạo': new Date(p.createdAt).toLocaleDateString('vi-VN'),
          'Người đề xuất': p.requesterName,
          'Bộ phận': p.department,
          'Ưu tiên': PROPOSAL_PRIORITY_LABELS[p.priority],
          'STT': idx + 1,
          'Tên vật tư/dụng cụ': item.name,
          'Loại': MATERIAL_TYPE_LABELS[item.type],
          'Đơn vị': item.unit,
          'Số lượng': item.quantity,
          'Giá dự kiến': item.estimatedPrice || 0,
          'Thành tiền': (item.quantity || 0) * (item.estimatedPrice || 0),
          'Lý do': item.reason,
          'Người duyệt': p.approverName,
          'Ngày duyệt': p.approvedAt ? new Date(p.approvedAt).toLocaleDateString('vi-VN') : ''
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      {wch: 15}, {wch: 12}, {wch: 18}, {wch: 15}, {wch: 12},
      {wch: 5}, {wch: 30}, {wch: 20}, {wch: 10}, {wch: 10},
      {wch: 12}, {wch: 15}, {wch: 25}, {wch: 18}, {wch: 12}
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Đề xuất đã duyệt');
    XLSX.writeFile(wb, `de_xuat_da_duyet_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Filter
  const filteredProposals = proposals.filter(p => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return p.code.toLowerCase().includes(search) ||
             p.requesterName?.toLowerCase().includes(search) ||
             p.department.toLowerCase().includes(search) ||
             p.reason.toLowerCase().includes(search);
    }
    return true;
  });

  const getStatusStyle = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.PENDING: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case ProposalStatus.APPROVED: return 'bg-green-100 text-green-700 border-green-200';
      case ProposalStatus.REJECTED: return 'bg-red-100 text-red-700 border-red-200';
      case ProposalStatus.PURCHASED: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getPriorityStyle = (priority: ProposalPriority) => {
    switch (priority) {
      case ProposalPriority.LOW: return 'bg-slate-100 text-slate-600';
      case ProposalPriority.NORMAL: return 'bg-blue-100 text-blue-600';
      case ProposalPriority.HIGH: return 'bg-orange-100 text-orange-600';
      case ProposalPriority.URGENT: return 'bg-red-100 text-red-600';
    }
  };

  const canManage = user.role === UserRole.ADMIN || user.role === UserRole.DIRECTOR || user.role === UserRole.KEEPER;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Đề xuất Vật tư / Dụng cụ</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý các đề xuất mua sắm</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={exportApprovedToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Xuất Excel (Đã duyệt)</span>
            <span className="sm:hidden">Excel</span>
          </button>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Tạo đề xuất</span>
            <span className="sm:hidden">Tạo mới</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><Clock size={20} className="text-yellow-600" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {proposals.filter(p => p.status === ProposalStatus.PENDING).length}
              </p>
              <p className="text-xs text-slate-500">Chờ duyệt</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle size={20} className="text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {proposals.filter(p => p.status === ProposalStatus.APPROVED).length}
              </p>
              <p className="text-xs text-slate-500">Đã duyệt</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><ShoppingCart size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {proposals.filter(p => p.status === ProposalStatus.PURCHASED).length}
              </p>
              <p className="text-xs text-slate-500">Đã mua</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><XCircle size={20} className="text-red-600" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {proposals.filter(p => p.status === ProposalStatus.REJECTED).length}
              </p>
              <p className="text-xs text-slate-500">Từ chối</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo mã, người đề xuất, bộ phận..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-slate-200 rounded-lg bg-white min-w-[150px]"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as ProposalStatus | 'ALL')}
          >
            <option value="ALL">Tất cả trạng thái</option>
            {Object.entries(PROPOSAL_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Proposals List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải...</div>
        ) : filteredProposals.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>Chưa có đề xuất nào</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProposals.map(proposal => (
              <div key={proposal.id} className="p-4 hover:bg-slate-50 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800">{proposal.code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(proposal.status)}`}>
                        {PROPOSAL_STATUS_LABELS[proposal.status]}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityStyle(proposal.priority)}`}>
                        {PROPOSAL_PRIORITY_LABELS[proposal.priority]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 truncate">{proposal.reason}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                      <span>👤 {proposal.requesterName}</span>
                      <span>🏢 {proposal.department}</span>
                      <span>📅 {new Date(proposal.createdAt).toLocaleDateString('vi-VN')}</span>
                      <span>📦 {proposal.items.length} mục</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setSelectedProposal(proposal); setShowDetailModal(true); }}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      title="Xem chi tiết"
                    >
                      <Eye size={18} />
                    </button>
                    
                    {proposal.status === ProposalStatus.PENDING && canManage && (
                      <>
                        <button
                          onClick={() => handleApprove(proposal.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Duyệt"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => handleReject(proposal.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Từ chối"
                        >
                          <X size={18} />
                        </button>
                      </>
                    )}
                    
                    {proposal.status === ProposalStatus.APPROVED && canManage && (
                      <button
                        onClick={() => handleMarkPurchased(proposal.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Đánh dấu đã mua"
                      >
                        <ShoppingCart size={18} />
                      </button>
                    )}
                    
                    {(proposal.status === ProposalStatus.PENDING || proposal.status === ProposalStatus.REJECTED) && (
                      <button
                        onClick={() => handleDelete(proposal.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Tạo đề xuất mới</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bộ phận/Phòng ban <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    placeholder="VD: Tổ máy 1, Phòng kỹ thuật..."
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mức độ ưu tiên</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value as ProposalPriority})}
                  >
                    {Object.entries(PROPOSAL_PRIORITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Lý do đề xuất chung <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Mô tả ngắn gọn lý do cần mua sắm..."
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-700">Danh sách vật tư/dụng cụ</label>
                  <button
                    onClick={addItem}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={16} /> Thêm mục
                  </button>
                </div>
                
                <div className="space-y-4">
                  {items.map((item, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-slate-700">Mục #{idx + 1}</span>
                        {items.length > 1 && (
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2"
                            placeholder="Tên vật tư/dụng cụ *"
                            value={item.name}
                            onChange={e => updateItem(idx, 'name', e.target.value)}
                          />
                        </div>
                        <select
                          className="border border-slate-200 rounded-lg px-3 py-2 bg-white"
                          value={item.type}
                          onChange={e => updateItem(idx, 'type', e.target.value)}
                        >
                          {Object.entries(MATERIAL_TYPE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            className="w-20 border border-slate-200 rounded-lg px-3 py-2"
                            placeholder="SL"
                            min={1}
                            value={item.quantity}
                            onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                          />
                          <select
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 bg-white"
                            value={item.unit}
                            onChange={e => updateItem(idx, 'unit', e.target.value)}
                          >
                            {UNIT_SUGGESTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                        <input
                          type="number"
                          className="border border-slate-200 rounded-lg px-3 py-2"
                          placeholder="Giá dự kiến (VNĐ)"
                          value={item.estimatedPrice || ''}
                          onChange={e => updateItem(idx, 'estimatedPrice', parseFloat(e.target.value) || 0)}
                        />
                        <input
                          type="text"
                          className="border border-slate-200 rounded-lg px-3 py-2"
                          placeholder="Lý do cần mua"
                          value={item.reason}
                          onChange={e => updateItem(idx, 'reason', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú thêm</label>
                <textarea
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Ghi chú thêm (nếu có)..."
                  value={formData.note}
                  onChange={e => setFormData({...formData, note: e.target.value})}
                />
              </div>
            </div>
            
            <div className="p-4 sm:p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Tạo đề xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedProposal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedProposal.code}</h2>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(selectedProposal.status)}`}>
                  {PROPOSAL_STATUS_LABELS[selectedProposal.status]}
                </span>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Người đề xuất:</span>
                  <p className="font-medium">{selectedProposal.requesterName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Bộ phận:</span>
                  <p className="font-medium">{selectedProposal.department}</p>
                </div>
                <div>
                  <span className="text-slate-500">Ngày tạo:</span>
                  <p className="font-medium">{new Date(selectedProposal.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <span className="text-slate-500">Ưu tiên:</span>
                  <p className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getPriorityStyle(selectedProposal.priority)}`}>
                    {PROPOSAL_PRIORITY_LABELS[selectedProposal.priority]}
                  </p>
                </div>
              </div>
              
              <div>
                <span className="text-slate-500 text-sm">Lý do đề xuất:</span>
                <p className="mt-1">{selectedProposal.reason}</p>
              </div>
              
              {selectedProposal.note && (
                <div>
                  <span className="text-slate-500 text-sm">Ghi chú:</span>
                  <p className="mt-1 text-slate-600">{selectedProposal.note}</p>
                </div>
              )}

              {/* Items Table */}
              <div>
                <h3 className="font-medium text-slate-800 mb-3">Danh sách vật tư/dụng cụ ({selectedProposal.items.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Tên</th>
                        <th className="px-3 py-2 text-left">Loại</th>
                        <th className="px-3 py-2 text-center">SL</th>
                        <th className="px-3 py-2 text-right">Giá DK</th>
                        <th className="px-3 py-2 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedProposal.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2">
                            <div>{item.name}</div>
                            {item.reason && <div className="text-xs text-slate-500">{item.reason}</div>}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{MATERIAL_TYPE_LABELS[item.type]}</td>
                          <td className="px-3 py-2 text-center">{item.quantity} {item.unit}</td>
                          <td className="px-3 py-2 text-right">{(item.estimatedPrice || 0).toLocaleString()}</td>
                          <td className="px-3 py-2 text-right font-medium">
                            {((item.quantity || 0) * (item.estimatedPrice || 0)).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-right font-medium">Tổng dự kiến:</td>
                        <td className="px-3 py-2 text-right font-bold text-blue-600">
                          {selectedProposal.items.reduce((sum, i) => sum + (i.quantity || 0) * (i.estimatedPrice || 0), 0).toLocaleString()} VNĐ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Approval Info */}
              {selectedProposal.status !== ProposalStatus.PENDING && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-medium text-slate-800 mb-2">Thông tin xử lý</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Người xử lý:</span>
                      <p className="font-medium">{selectedProposal.approverName}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Ngày xử lý:</span>
                      <p className="font-medium">
                        {selectedProposal.approvedAt ? new Date(selectedProposal.approvedAt).toLocaleString('vi-VN') : '-'}
                      </p>
                    </div>
                    {selectedProposal.rejectReason && (
                      <div className="col-span-2">
                        <span className="text-slate-500">Lý do từ chối:</span>
                        <p className="font-medium text-red-600">{selectedProposal.rejectReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions */}
            {selectedProposal.status === ProposalStatus.PENDING && canManage && (
              <div className="p-4 sm:p-6 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => handleReject(selectedProposal.id)}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition flex items-center gap-2"
                >
                  <X size={18} /> Từ chối
                </button>
                <button
                  onClick={() => handleApprove(selectedProposal.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <Check size={18} /> Duyệt đề xuất
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Proposals;

