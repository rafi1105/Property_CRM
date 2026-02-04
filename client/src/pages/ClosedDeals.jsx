import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { customerAPI } from '../utils/api';
import { formatDateShort } from '../utils/dateFormat';
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
  EnvelopeIcon,
  MapPinIcon,
  TagIcon,
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

  // Navigate to Customer Details page
  const handleEditCustomer = (customerId) => {
    navigate(`/dashboard/customers/${customerId}`);
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

  // Using formatDateShort from utils/dateFormat.js for dd/mm/yyyy format

  return (
    <DashboardLayout title="Closed Customers" subtitle={user?.role === 'agent' ? 'View your closed customers' : 'Manage closed/transferred customers'}>
      {/* Header Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2.5 sm:p-3 rounded-xl">
            <ArrowsRightLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              {user?.role === 'agent' ? 'My Closed' : 'Total Closed'}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-gray-800">{closedDeals.length}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="relative w-full sm:max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 text-sm sm:text-base"
          />
        </div>
        <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredDeals.length}</span> of <span className="font-semibold">{closedDeals.length}</span> closed customers
        </div>
      </div>

      {/* Closed Customers Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
          <ArrowsRightLeftIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">No closed customers</h3>
          <p className="text-sm sm:text-base text-gray-500">
            {closedDeals.length === 0 
              ? 'No customers have been closed yet.'
              : 'No customers match your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredDeals.map((deal) => (
            <div key={deal._id} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-l-4 border-orange-500 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-base sm:text-lg">
                      {deal.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{deal.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{deal.phone}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-[10px] sm:text-xs font-semibold rounded-full flex-shrink-0">
                  CLOSED
                </span>
              </div>

              {/* Deal Info */}
              <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                {deal.closeReason && (
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                    <ChatBubbleLeftIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">Reason: {deal.closeReason}</span>
                  </div>
                )}
                
                {(deal.budget?.min || deal.budget?.max) && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <CurrencyDollarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">৳{deal.budget?.min?.toLocaleString() || 0} - ৳{deal.budget?.max?.toLocaleString() || 0}</span>
                  </div>
                )}

                {deal.interestedProperties?.length > 0 && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <HomeModernIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{deal.interestedProperties.length} properties interested</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <UserCircleIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">Agent: {deal.assignedAgent?.name || 'Unassigned'}</span>
                </div>

                {deal.closedAt && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                    <CalendarDaysIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>Closed: {formatDateShort(deal.closedAt || deal.updatedAt)}</span>
                  </div>
                )}

                {deal.closedBy?.name && (
                  <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                    Closed by: {deal.closedBy.name}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 sm:pt-4 border-t border-gray-100 flex gap-1.5 sm:gap-2">
                <button
                  onClick={() => handleViewDetails(deal)}
                  className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 font-medium"
                >
                  <EyeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  View
                </button>
                {user?.role !== 'agent' && (
                  <>
                    <button
                      onClick={() => handleEditCustomer(deal._id)}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors flex items-center justify-center gap-1 font-medium"
                      title="Edit customer"
                    >
                      <PencilIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => handleReopenDeal(deal._id)}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors flex items-center justify-center gap-1 font-medium"
                    >
                      <ArrowPathIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Reopen</span>
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
            <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-[95vh] overflow-hidden">
                  {selectedDeal && (
                    <>
                      <div className="border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50">
                        <div className="min-w-0 flex-1">
                          <Dialog.Title className="text-lg sm:text-xl font-semibold text-gray-900">
                            Closed Customer Details
                          </Dialog.Title>
                          <p className="text-xs sm:text-sm text-orange-600 mt-1 truncate">
                            {selectedDeal.closeReason || 'Closed by agent'}
                          </p>
                        </div>
                        <button onClick={() => setShowDetailsModal(false)} className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 flex-shrink-0 ml-2">
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
                        {/* Customer Header */}
                        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-xl sm:text-2xl">{selectedDeal.name?.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{selectedDeal.name}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-2">
                              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-orange-100 text-orange-700 rounded-full text-xs sm:text-sm font-medium">
                                {selectedDeal.status || 'closed'}
                              </span>
                              <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium border ${
                                selectedDeal.priority === 'high' ? 'bg-red-100 text-red-700 border-red-200' :
                                selectedDeal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                'bg-green-100 text-green-700 border-green-200'
                              }`}>
                                {selectedDeal.priority || 'medium'} priority
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div className="mb-4 sm:mb-6 bg-gray-50 rounded-xl p-3 sm:p-4">
                          <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                            <UserCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                            Contact Information
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border border-gray-100">
                              <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[10px] sm:text-xs text-gray-500">Phone</p>
                                <p className="text-gray-900 font-medium text-sm sm:text-base">{selectedDeal.phone}</p>
                              </div>
                            </div>
                            {selectedDeal.email && (
                              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border border-gray-100">
                                <EnvelopeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] sm:text-xs text-gray-500">Email</p>
                                  <p className="text-gray-900 font-medium text-sm sm:text-base truncate">{selectedDeal.email}</p>
                                </div>
                              </div>
                            )}
                            {selectedDeal.address && (
                              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border border-gray-100 sm:col-span-2">
                                <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-[10px] sm:text-xs text-gray-500">Address</p>
                                  <p className="text-gray-900 font-medium text-sm sm:text-base">{selectedDeal.address}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Closure Info */}
                        <div className="mb-4 sm:mb-6 bg-orange-50 rounded-xl p-3 sm:p-4 border border-orange-200">
                          <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                            <ChatBubbleLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                            Closure Information
                          </h4>
                          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                            <div>
                              <span className="text-[10px] sm:text-xs font-medium text-gray-500">Reason</span>
                              <p className="text-gray-900 font-medium text-xs sm:text-sm">{selectedDeal.closeReason || 'Not specified'}</p>
                            </div>
                            <div>
                              <span className="text-[10px] sm:text-xs font-medium text-gray-500">Closed By</span>
                              <p className="text-gray-900 text-xs sm:text-sm">{selectedDeal.closedBy?.name || selectedDeal.addedBy?.name || 'System'}</p>
                            </div>
                            <div>
                              <span className="text-[10px] sm:text-xs font-medium text-gray-500">Closed Date</span>
                              <p className="text-gray-900 text-xs sm:text-sm">{formatDateShort(selectedDeal.closedAt || selectedDeal.updatedAt)}</p>
                            </div>
                            <div>
                              <span className="text-[10px] sm:text-xs font-medium text-gray-500">Assigned Agent</span>
                              <p className="text-gray-900 text-xs sm:text-sm">{selectedDeal.assignedAgent?.name || selectedDeal.addedBy?.name || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Budget & Preferences */}
                        <div className="mb-4 sm:mb-6">
                          <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                            <TagIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                            Requirements & Preferences
                          </h4>
                          <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-purple-50 rounded-xl">
                              <span className="text-[10px] sm:text-xs font-medium text-purple-600">Budget Range</span>
                              <p className="text-gray-900 font-semibold text-xs sm:text-base">
                                ৳{selectedDeal.budget?.min?.toLocaleString() || 0} - ৳{selectedDeal.budget?.max?.toLocaleString() || 0}
                              </p>
                            </div>
                            <div className="p-2 sm:p-3 bg-indigo-50 rounded-xl">
                              <span className="text-[10px] sm:text-xs font-medium text-indigo-600">Source</span>
                              <p className="text-gray-900 font-semibold capitalize text-xs sm:text-base">{selectedDeal.source || 'N/A'}</p>
                            </div>
                            {(selectedDeal.customerZone || selectedDeal.customerThana) && (
                              <div className="p-2 sm:p-3 bg-gray-50 rounded-xl col-span-2">
                                <span className="text-[10px] sm:text-xs font-medium text-gray-500">Customer Zone/Thana</span>
                                <p className="text-gray-900 font-medium text-xs sm:text-base">
                                  {selectedDeal.customerThana}{selectedDeal.customerZone ? `, ${selectedDeal.customerZone}` : ''}
                                </p>
                              </div>
                            )}
                          </div>
                          {selectedDeal.preferredLocation?.length > 0 && (
                            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-50 rounded-xl">
                              <span className="text-[10px] sm:text-xs font-medium text-gray-500">Preferred Locations</span>
                              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
                                {(Array.isArray(selectedDeal.preferredLocation) ? selectedDeal.preferredLocation : [selectedDeal.preferredLocation]).map((loc, idx) => (
                                  <span key={idx} className="px-2 py-0.5 sm:py-1 bg-white border border-gray-200 rounded-full text-xs sm:text-sm text-gray-700">
                                    {loc}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedDeal.propertyType?.length > 0 && (
                            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-50 rounded-xl">
                              <span className="text-[10px] sm:text-xs font-medium text-gray-500">Property Types</span>
                              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
                                {selectedDeal.propertyType.map(type => (
                                  <span key={type} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] sm:text-xs capitalize">
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Interested Properties - Text */}
                        {selectedDeal.interestedProperties && typeof selectedDeal.interestedProperties === 'string' && (
                          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-xl">
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                              <HomeModernIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                              Interested Properties
                            </h4>
                            <p className="text-gray-700 whitespace-pre-wrap text-xs sm:text-sm">{selectedDeal.interestedProperties}</p>
                          </div>
                        )}

                        {/* Interested Properties - Array */}
                        {selectedDeal.interestedProperties?.length > 0 && Array.isArray(selectedDeal.interestedProperties) && (
                          <div className="mb-4 sm:mb-6">
                            <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                              <HomeModernIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                              Interested Properties
                            </h4>
                            <div className="space-y-2">
                              {selectedDeal.interestedProperties.map(property => (
                                <div key={property._id} className="border border-gray-200 rounded-xl p-2 sm:p-3 flex flex-col sm:flex-row justify-between sm:items-center bg-gray-50 gap-1 sm:gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-medium text-gray-900 text-sm sm:text-base">{property.title || property.name}</p>
                                      {property.propertyCode && (
                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] sm:text-xs font-medium rounded">
                                          {property.propertyCode}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600 truncate">{property.location}</p>
                                  </div>
                                  <p className="text-base sm:text-lg font-semibold text-purple-600 flex-shrink-0">
                                    ৳{property.price?.toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Additional Requirements */}
                        {selectedDeal.requirements && (
                          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-xl">
                            <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Additional Requirements</h4>
                            <p className="text-gray-700 whitespace-pre-wrap text-xs sm:text-sm">{selectedDeal.requirements}</p>
                          </div>
                        )}

                        {/* Referred By */}
                        {selectedDeal.referredBy && (
                          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 rounded-xl">
                            <span className="text-[10px] sm:text-xs font-medium text-green-600">Referred By</span>
                            <p className="text-gray-900 font-medium text-sm sm:text-base">{selectedDeal.referredBy}</p>
                          </div>
                        )}

                        {/* Communication Log */}
                        {selectedDeal.notes?.length > 0 && (
                          <div className="mb-4 sm:mb-6">
                            <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Communication History</h4>
                            <div className="bg-gray-50 rounded-xl p-3 sm:p-4 max-h-48 overflow-y-auto space-y-2 sm:space-y-3">
                              {selectedDeal.notes
                                .slice()
                                .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
                                .slice(0, 5)
                                .map((note, index) => (
                                  <div key={index} className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="text-xs sm:text-sm font-medium text-gray-900">
                                        {note.addedBy?.name || 'Admin'}
                                      </span>
                                      <span className="text-[10px] sm:text-xs text-gray-500">
                                        {formatDateShort(note.addedAt)}
                                      </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600">{note.note}</p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Timeline */}
                        <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                          <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Timeline</h4>
                          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                            <div>
                              <span className="text-gray-500">Created:</span>
                              <p className="text-gray-900 font-medium">{formatDateShort(selectedDeal.createdAt)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Last Updated:</span>
                              <p className="text-gray-900 font-medium">{formatDateShort(selectedDeal.updatedAt)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Added By:</span>
                              <p className="text-gray-900 font-medium">{selectedDeal.addedBy?.name || 'System'}</p>
                            </div>
                            {selectedDeal.closedAt && (
                              <div>
                                <span className="text-gray-500">Closed At:</span>
                                <p className="text-gray-900 font-medium">{formatDateShort(selectedDeal.closedAt)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-wrap justify-end gap-2 sm:gap-3">
                        <button
                          onClick={() => setShowDetailsModal(false)}
                          className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-sm sm:text-base"
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
                              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg font-medium text-sm sm:text-base"
                            >
                              Edit Customer
                            </button>
                            <button
                              onClick={() => {
                                handleReopenDeal(selectedDeal._id);
                                setShowDetailsModal(false);
                              }}
                              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg font-medium text-sm sm:text-base"
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
