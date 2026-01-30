import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { customerAPI } from '../utils/api';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  ArrowsRightLeftIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  ArrowPathIcon,
  XMarkIcon,
  PhoneIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  HomeModernIcon,
  CalendarDaysIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';

const ClosedDeals = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [closedDeals, setClosedDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchClosedDeals();
  }, [user]);

  const fetchClosedDeals = async () => {
    try {
      setLoading(true);
      const response = user?.role === 'agent' 
        ? await customerAPI.getMyCustomers()
        : await customerAPI.getAll({ page: 1, limit: 500 });
      
      // Filter only closed/deal-closed customers (transferred customers)
      const allCustomers = response.data.customers || [];
      const closed = allCustomers.filter(c => c.agentClosed || c.status === 'closed' || c.status === 'deal-closed');
      setClosedDeals(closed);
    } catch (error) {
      console.error('Error fetching closed customers:', error);
      toast.error('Failed to load closed customers');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (deal) => {
    setSelectedDeal(deal);
    setShowDetailsModal(true);
  };

  const handleReopenDeal = async (customerId) => {
    if (!window.confirm('Are you sure you want to reopen this customer?')) return;
    
    try {
      await customerAPI.reopenCustomer(customerId);
      toast.success('Customer reopened successfully');
      fetchClosedDeals();
    } catch (error) {
      console.error('Error reopening customer:', error);
      toast.error('Failed to reopen customer');
    }
  };

  // Navigate to Edit Customer page
  const handleEditCustomer = (customerId) => {
    navigate(`/dashboard/customers?edit=${customerId}`);
  };

  // Filter logic
  const filteredDeals = closedDeals.filter(deal => {
    const searchLower = searchTerm.toLowerCase();
    return !searchTerm || 
      deal.name?.toLowerCase().includes(searchLower) ||
      deal.phone?.includes(searchTerm) ||
      deal.closeReason?.toLowerCase().includes(searchLower) ||
      deal.interestedProperties?.some(p => p.name?.toLowerCase().includes(searchLower) || p.title?.toLowerCase().includes(searchLower));
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout title="Closed Customers" subtitle={user?.role === 'agent' ? 'View your closed customers' : 'Manage closed/transferred customers'}>
      {/* Header Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl">
            <ArrowsRightLeftIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              {user?.role === 'agent' ? 'My Closed' : 'Total Closed'}
            </p>
            <p className="text-2xl font-bold text-gray-800">{closedDeals.length}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, reason, or property..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
          />
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredDeals.length}</span> of <span className="font-semibold">{closedDeals.length}</span> closed customers
        </div>
      </div>

      {/* Closed Customers Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <ArrowsRightLeftIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No closed customers</h3>
          <p className="text-gray-500">
            {closedDeals.length === 0 
              ? 'No customers have been closed yet.'
              : 'No customers match your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeals.map((deal) => (
            <div key={deal._id} className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-orange-500 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-lg">
                      {deal.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{deal.name}</h3>
                    <p className="text-sm text-gray-600">{deal.phone}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                  CLOSED
                </span>
              </div>

              {/* Deal Info */}
              <div className="space-y-2 mb-4">
                {deal.closeReason && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <ChatBubbleLeftIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="line-clamp-2">Reason: {deal.closeReason}</span>
                  </div>
                )}
                
                {(deal.budget?.min || deal.budget?.max) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                    <span>Budget: ৳{deal.budget?.min?.toLocaleString() || 0} - ৳{deal.budget?.max?.toLocaleString() || 0}</span>
                  </div>
                )}

                {deal.interestedProperties?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <HomeModernIcon className="w-4 h-4 text-gray-400" />
                    <span>{deal.interestedProperties.length} properties interested</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserCircleIcon className="w-4 h-4 text-gray-400" />
                  <span>Agent: {deal.assignedAgent?.name || 'Unassigned'}</span>
                </div>

                {deal.closedAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                    <span>Closed: {formatDate(deal.closedAt || deal.updatedAt)}</span>
                  </div>
                )}

                {deal.closedBy?.name && (
                  <div className="text-xs text-gray-500 mt-1">
                    Closed by: {deal.closedBy.name}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => handleViewDetails(deal)}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 font-medium"
                >
                  <EyeIcon className="w-4 h-4" />
                  View
                </button>
                {user?.role !== 'agent' && (
                  <>
                    <button
                      onClick={() => handleEditCustomer(deal._id)}
                      className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors flex items-center justify-center gap-1 font-medium"
                      title="Edit customer"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleReopenDeal(deal._id)}
                      className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors flex items-center justify-center gap-1 font-medium"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      Reopen
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Transition appear show={showDetailsModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowDetailsModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
                  {selectedDeal && (
                    <>
                      <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50">
                        <div>
                          <Dialog.Title className="text-xl font-semibold text-gray-900">
                            Closed Customer Details
                          </Dialog.Title>
                          <p className="text-sm text-orange-600 mt-1">
                            {selectedDeal.closeReason || 'Closed by agent'}
                          </p>
                        </div>
                        <button onClick={() => setShowDetailsModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100">
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="p-6 max-h-[70vh] overflow-y-auto">
                        {/* Customer Header */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">{selectedDeal.name?.charAt(0)}</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{selectedDeal.name}</h3>
                            <div className="flex items-center gap-2 text-gray-600 mt-1">
                              <PhoneIcon className="w-4 h-4" />
                              <span>{selectedDeal.phone}</span>
                            </div>
                          </div>
                        </div>

                        {/* Closure Info */}
                        <div className="mb-6 bg-orange-50 rounded-xl p-4 border border-orange-200">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <ChatBubbleLeftIcon className="w-5 h-5 text-orange-600" />
                            Closure Information
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-xs font-medium text-gray-500">Reason</span>
                              <p className="text-gray-900 font-medium">{selectedDeal.closeReason || 'Not specified'}</p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500">Closed By</span>
                              <p className="text-gray-900">{selectedDeal.closedBy?.name || 'Unknown'}</p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500">Closed Date</span>
                              <p className="text-gray-900">{formatDate(selectedDeal.closedAt || selectedDeal.updatedAt)}</p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-500">Assigned Agent</span>
                              <p className="text-gray-900">{selectedDeal.assignedAgent?.name || 'Unassigned'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Budget & Preferences */}
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-900 mb-3">Requirements</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded-xl">
                              <span className="text-xs font-medium text-gray-500">Budget Range</span>
                              <p className="text-gray-900 font-semibold">
                                ৳{selectedDeal.budget?.min?.toLocaleString() || 0} - ৳{selectedDeal.budget?.max?.toLocaleString() || 0}
                              </p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                              <span className="text-xs font-medium text-gray-500">Source</span>
                              <p className="text-gray-900 font-semibold capitalize">{selectedDeal.source || 'N/A'}</p>
                            </div>
                          </div>
                          {selectedDeal.preferredLocation?.length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                              <span className="text-xs font-medium text-gray-500">Preferred Locations</span>
                              <p className="text-gray-900">{selectedDeal.preferredLocation.join(', ')}</p>
                            </div>
                          )}
                          {selectedDeal.propertyType?.length > 0 && (
                            <div className="mt-3">
                              <span className="text-xs font-medium text-gray-500">Property Types</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {selectedDeal.propertyType.map(type => (
                                  <span key={type} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs capitalize">
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Interested Properties */}
                        {selectedDeal.interestedProperties?.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <HomeModernIcon className="w-5 h-5 text-purple-600" />
                              Interested Properties
                            </h4>
                            <div className="space-y-2">
                              {selectedDeal.interestedProperties.map(property => (
                                <div key={property._id} className="border border-gray-200 rounded-xl p-3 flex justify-between items-center bg-gray-50">
                                  <div>
                                    <p className="font-medium text-gray-900">{property.title || property.name}</p>
                                    <p className="text-sm text-gray-600">{property.location}</p>
                                  </div>
                                  <p className="text-lg font-semibold text-purple-600">
                                    ৳{property.price?.toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes/Address */}
                        {(selectedDeal.address || selectedDeal.requirements) && (
                          <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-xl whitespace-pre-wrap">
                              {selectedDeal.requirements || selectedDeal.address}
                            </p>
                          </div>
                        )}

                        {/* Communication Log */}
                        {selectedDeal.notes?.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-3">Communication History</h4>
                            <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto space-y-3">
                              {selectedDeal.notes
                                .slice()
                                .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
                                .slice(0, 5)
                                .map((note, index) => (
                                  <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-sm font-medium text-gray-900">
                                        {note.addedBy?.name || 'Admin'}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {formatDate(note.addedAt)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600">{note.note}</p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Timeline */}
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Created:</span> {formatDate(selectedDeal.createdAt)}
                          </div>
                          <div>
                            <span className="font-medium">Last Updated:</span> {formatDate(selectedDeal.updatedAt)}
                          </div>
                        </div>
                      </div>

                      <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                        <button
                          onClick={() => setShowDetailsModal(false)}
                          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
                        >
                          Close
                        </button>
                        {user?.role !== 'agent' && (
                          <>
                            <button
                              onClick={() => {
                                setShowDetailsModal(false);
                                handleEditCustomer(selectedDeal._id);
                              }}
                              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium"
                            >
                              Edit Customer
                            </button>
                            <button
                              onClick={() => {
                                handleReopenDeal(selectedDeal._id);
                                setShowDetailsModal(false);
                              }}
                              className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg font-medium"
                            >
                              Reopen
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

export default ClosedDeals;
