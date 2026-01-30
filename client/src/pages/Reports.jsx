import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportAPI, authAPI } from '../utils/api';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  ChartBarIcon,
  TrashIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [todayReport, setTodayReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  // Form data for submitting report
  const [formData, setFormData] = useState({
    content: '',
    activitiesCompleted: [''],
    stats: {
      customersAdded: 0,
      customersCalled: 0,
      visitsCompleted: 0,
      propertiesShown: 0
    }
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch reports based on role
      if (user?.role === 'super_admin') {
        const [reportsRes, statsRes, agentsRes] = await Promise.all([
          reportAPI.getAll({ limit: 100 }),
          reportAPI.getStats(),
          authAPI.getAllUsers()
        ]);
        setReports(reportsRes.data.reports || []);
        setStats(statsRes.data.stats || null);
        const agentUsers = (agentsRes.data.users || []).filter(u => u.role === 'agent');
        setAgents(agentUsers);
      } else if (user?.role === 'admin' && user?.assignedZone) {
        // Zonal admin/agent
        const reportsRes = await reportAPI.getZoneReports({ limit: 100 });
        setReports(reportsRes.data.reports || []);
      } else {
        // Regular agent - get their own reports
        const [myReportsRes, todayRes] = await Promise.all([
          reportAPI.getMyReports({ limit: 50 }),
          reportAPI.getTodayReport()
        ]);
        setReports(myReportsRes.data.reports || []);
        setTodayReport(todayRes.data.report);
        
        // Pre-fill form if today's report exists
        if (todayRes.data.report) {
          setFormData({
            content: todayRes.data.report.content || '',
            activitiesCompleted: todayRes.data.report.activitiesCompleted?.length > 0 
              ? todayRes.data.report.activitiesCompleted 
              : [''],
            stats: todayRes.data.report.stats || {
              customersAdded: 0,
              customersCalled: 0,
              visitsCompleted: 0,
              propertiesShown: 0
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    try {
      const reportData = {
        content: formData.content,
        activitiesCompleted: formData.activitiesCompleted.filter(a => a.trim() !== ''),
        stats: formData.stats
      };

      await reportAPI.create(reportData);
      toast.success(todayReport ? 'Report updated successfully!' : 'Report submitted successfully!');
      setShowSubmitModal(false);
      fetchData();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error(error.response?.data?.message || 'Failed to submit report');
    }
  };

  const handleReviewReport = async (reportId, status) => {
    try {
      await reportAPI.review(reportId, { status });
      toast.success('Report reviewed successfully!');
      fetchData();
      if (showViewModal) setShowViewModal(false);
    } catch (error) {
      console.error('Error reviewing report:', error);
      toast.error('Failed to review report');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await reportAPI.delete(reportId);
      toast.success('Report deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  const addActivity = () => {
    setFormData(prev => ({
      ...prev,
      activitiesCompleted: [...prev.activitiesCompleted, '']
    }));
  };

  const removeActivity = (index) => {
    setFormData(prev => ({
      ...prev,
      activitiesCompleted: prev.activitiesCompleted.filter((_, i) => i !== index)
    }));
  };

  const updateActivity = (index, value) => {
    setFormData(prev => ({
      ...prev,
      activitiesCompleted: prev.activitiesCompleted.map((a, i) => i === index ? value : a)
    }));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reviewed':
        return 'bg-green-100 text-green-700';
      case 'acknowledged':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchTerm || 
      report.agent?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAgent = filterAgent === 'all' || report.agent?._id === filterAgent;
    
    const matchesDate = !filterDate || 
      new Date(report.reportDate).toDateString() === new Date(filterDate).toDateString();
    
    return matchesSearch && matchesAgent && matchesDate;
  });

  return (
    <DashboardLayout 
      title="Daily Reports" 
      subtitle={user?.role === 'super_admin' ? 'View all agent daily reports' : 'Submit your daily work report'}
    >
      {/* Stats Cards - Super Admin Only */}
      {user?.role === 'super_admin' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <UserCircleIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Agents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAgents}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Submitted Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.reportsSubmittedToday}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <ClockIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingSubmissions}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        {/* Agent: Submit Report Button */}
        {user?.role === 'agent' && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              {todayReport ? 'Update Today\'s Report' : 'Submit Daily Report'}
            </button>
            {todayReport && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircleIcon className="w-4 h-4" />
                Today's report submitted
              </span>
            )}
          </div>
        )}

        {/* Super Admin: Filters */}
        {user?.role === 'super_admin' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 w-64"
              />
            </div>
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
            >
              <option value="all">All Agents</option>
              {agents.map(agent => (
                <option key={agent._id} value={agent._id}>{agent.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-700"
            />
            {(searchTerm || filterAgent !== 'all' || filterDate) && (
              <button
                onClick={() => { setSearchTerm(''); setFilterAgent('all'); setFilterDate(''); }}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No reports found</h3>
          <p className="text-gray-500">
            {user?.role === 'agent' 
              ? 'Submit your first daily report to track your activities.'
              : 'No reports match your filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div 
              key={report._id} 
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* Agent Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-lg">
                      {report.agent?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{report.agent?.name || 'Unknown Agent'}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                      {report.agent?.assignedZone && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {report.agent.assignedZone}
                        </span>
                      )}
                    </div>
                    
                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <CalendarDaysIcon className="w-4 h-4" />
                      <span>{formatDate(report.reportDate)}</span>
                    </div>
                    
                    {/* Content Preview */}
                    <p className="text-gray-700 line-clamp-3 whitespace-pre-wrap">
                      {report.content}
                    </p>

                    {/* Stats */}
                    {report.stats && (
                      <div className="flex flex-wrap gap-4 mt-3">
                        {report.stats.customersAdded > 0 && (
                          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                            {report.stats.customersAdded} customers added
                          </span>
                        )}
                        {report.stats.customersCalled > 0 && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                            {report.stats.customersCalled} calls made
                          </span>
                        )}
                        {report.stats.visitsCompleted > 0 && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                            {report.stats.visitsCompleted} visits
                          </span>
                        )}
                        {report.stats.propertiesShown > 0 && (
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                            {report.stats.propertiesShown} properties shown
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedReport(report); setShowViewModal(true); }}
                    className="px-3 py-1.5 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    View
                  </button>
                  {user?.role === 'super_admin' && report.status === 'submitted' && (
                    <button
                      onClick={() => handleReviewReport(report._id, 'reviewed')}
                      className="px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      Review
                    </button>
                  )}
                  {user?.role === 'super_admin' && (
                    <button
                      onClick={() => handleDeleteReport(report._id)}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Report Modal (Agent) */}
      <Transition appear show={showSubmitModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowSubmitModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
                  <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <Dialog.Title className="text-xl font-semibold text-gray-900">
                      {todayReport ? 'Update Daily Report' : 'Submit Daily Report'}
                    </Dialog.Title>
                    <button onClick={() => setShowSubmitModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitReport} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Date Display */}
                    <div className="bg-purple-50 rounded-xl p-4 flex items-center gap-3">
                      <CalendarDaysIcon className="w-6 h-6 text-purple-600" />
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Report Date</p>
                        <p className="text-lg font-semibold text-purple-900">{formatDate(new Date())}</p>
                      </div>
                    </div>

                    {/* Main Report Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What did you do today? *
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        required
                        rows={5}
                        placeholder="Describe your work activities, customer interactions, property showings, calls made, etc..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 resize-none"
                      />
                    </div>

                    {/* Activities List */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Activities Completed (Optional)
                      </label>
                      <div className="space-y-2">
                        {formData.activitiesCompleted.map((activity, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={activity}
                              onChange={(e) => updateActivity(index, e.target.value)}
                              placeholder={`Activity ${index + 1}`}
                              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                            />
                            {formData.activitiesCompleted.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeActivity(index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addActivity}
                          className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                        >
                          <PlusIcon className="w-4 h-4" />
                          Add Activity
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Today's Statistics
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Customers Added</label>
                          <input
                            type="number"
                            min="0"
                            value={formData.stats.customersAdded}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              stats: { ...prev.stats, customersAdded: parseInt(e.target.value) || 0 }
                            }))}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Customers Called</label>
                          <input
                            type="number"
                            min="0"
                            value={formData.stats.customersCalled}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              stats: { ...prev.stats, customersCalled: parseInt(e.target.value) || 0 }
                            }))}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Visits Completed</label>
                          <input
                            type="number"
                            min="0"
                            value={formData.stats.visitsCompleted}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              stats: { ...prev.stats, visitsCompleted: parseInt(e.target.value) || 0 }
                            }))}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Properties Shown</label>
                          <input
                            type="number"
                            min="0"
                            value={formData.stats.propertiesShown}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              stats: { ...prev.stats, propertiesShown: parseInt(e.target.value) || 0 }
                            }))}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <button 
                        type="button" 
                        onClick={() => setShowSubmitModal(false)} 
                        className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium"
                      >
                        {todayReport ? 'Update Report' : 'Submit Report'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* View Report Modal */}
      <Transition appear show={showViewModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowViewModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
                  {selectedReport && (
                    <>
                      <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                        <Dialog.Title className="text-xl font-semibold text-gray-900">
                          Report Details
                        </Dialog.Title>
                        <button onClick={() => setShowViewModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="p-6 max-h-[70vh] overflow-y-auto">
                        {/* Agent Info */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">
                              {selectedReport.agent?.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{selectedReport.agent?.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                                {selectedReport.status}
                              </span>
                              {selectedReport.agent?.assignedZone && (
                                <span className="text-xs text-gray-500">
                                  Zone: {selectedReport.agent.assignedZone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                          <div className="flex items-center gap-2 text-gray-700">
                            <CalendarDaysIcon className="w-5 h-5 text-purple-600" />
                            <span className="font-medium">{formatDate(selectedReport.reportDate)}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-900 mb-3">Report Content</h4>
                          <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl">
                            {selectedReport.content}
                          </p>
                        </div>

                        {/* Activities */}
                        {selectedReport.activitiesCompleted?.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-3">Activities Completed</h4>
                            <ul className="space-y-2">
                              {selectedReport.activitiesCompleted.map((activity, index) => (
                                <li key={index} className="flex items-start gap-2 text-gray-700">
                                  <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{activity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Stats */}
                        {selectedReport.stats && (
                          <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-3">Statistics</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-purple-50 rounded-xl p-4">
                                <p className="text-sm text-purple-600">Customers Added</p>
                                <p className="text-2xl font-bold text-purple-900">{selectedReport.stats.customersAdded || 0}</p>
                              </div>
                              <div className="bg-blue-50 rounded-xl p-4">
                                <p className="text-sm text-blue-600">Customers Called</p>
                                <p className="text-2xl font-bold text-blue-900">{selectedReport.stats.customersCalled || 0}</p>
                              </div>
                              <div className="bg-green-50 rounded-xl p-4">
                                <p className="text-sm text-green-600">Visits Completed</p>
                                <p className="text-2xl font-bold text-green-900">{selectedReport.stats.visitsCompleted || 0}</p>
                              </div>
                              <div className="bg-orange-50 rounded-xl p-4">
                                <p className="text-sm text-orange-600">Properties Shown</p>
                                <p className="text-2xl font-bold text-orange-900">{selectedReport.stats.propertiesShown || 0}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Review Info */}
                        {selectedReport.reviewedBy && (
                          <div className="bg-green-50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-green-700">
                              Reviewed by <span className="font-medium">{selectedReport.reviewedBy.name}</span>
                              {selectedReport.reviewedAt && (
                                <span> on {formatDate(selectedReport.reviewedAt)}</span>
                              )}
                            </p>
                            {selectedReport.reviewNotes && (
                              <p className="mt-2 text-green-800">{selectedReport.reviewNotes}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                        <button
                          onClick={() => setShowViewModal(false)}
                          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
                        >
                          Close
                        </button>
                        {user?.role === 'super_admin' && selectedReport.status === 'submitted' && (
                          <>
                            <button
                              onClick={() => handleReviewReport(selectedReport._id, 'reviewed')}
                              className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg font-medium"
                            >
                              Mark as Reviewed
                            </button>
                            <button
                              onClick={() => handleReviewReport(selectedReport._id, 'acknowledged')}
                              className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:shadow-lg font-medium"
                            >
                              Acknowledge
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </DashboardLayout>
  );
};

export default Reports;
