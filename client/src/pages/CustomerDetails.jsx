import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { customerAPI } from '../utils/api';
import { toast } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import {
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  TagIcon,
  HomeModernIcon,
  ChatBubbleLeftIcon,
  PencilIcon,
  ClockIcon,
  CurrencyBangladeshiIcon,
  BuildingOfficeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [noteFollowUpDate, setNoteFollowUpDate] = useState('');

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getById(id);
      setCustomer(response.data.customer || response.data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Failed to load customer details');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const noteData = { note: newNote };
      if (noteFollowUpDate) {
        noteData.nextFollowUpDate = noteFollowUpDate;
      }
      await customerAPI.addNote(customer._id, noteData);
      toast.success('Note added successfully');
      setNewNote('');
      setNoteFollowUpDate('');
      fetchCustomer();
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const statusColors = {
    'new': 'bg-blue-100 text-blue-700',
    'interested': 'bg-green-100 text-green-700',
    'visit-possible': 'bg-yellow-100 text-yellow-700',
    'visit-done': 'bg-purple-100 text-purple-700',
    'sellable': 'bg-emerald-100 text-emerald-700',
    'short-process': 'bg-orange-100 text-orange-700',
    'long-process': 'bg-indigo-100 text-indigo-700',
    'closed': 'bg-gray-100 text-gray-700'
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200'
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Customer not found</p>
          <button
            onClick={() => navigate('/customers')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Customers
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/customers')}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Customers</span>
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {customer.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[customer.status]}`}>
                    {customer.status}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${priorityColors[customer.priority]}`}>
                    {customer.priority} priority
                  </span>
                  {customer.isFollowUpDue && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      Follow-up Due
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {user?.role !== 'agent' && (
              <button
                onClick={() => navigate(`/customers?edit=${customer._id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                <PencilIcon className="w-5 h-5" />
                Edit Customer
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCircleIcon className="w-6 h-6 text-purple-600" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <PhoneIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-gray-900 font-medium">{customer.phone}</p>
                  </div>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-gray-900 font-medium truncate">{customer.email}</p>
                    </div>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl md:col-span-2">
                    <MapPinIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-gray-900 font-medium">{customer.address}</p>
                    </div>
                  </div>
                )}
                {(customer.customerZone || customer.customerThana) && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl md:col-span-2">
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Zone / Thana</p>
                      <p className="text-gray-900 font-medium">
                        {[customer.customerZone, customer.customerThana].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Requirements & Preferences */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HomeModernIcon className="w-6 h-6 text-purple-600" />
                Requirements & Preferences
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <p className="text-xs text-purple-600 font-medium mb-1">Budget Range</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ৳{customer.budget?.min?.toLocaleString() || 0} - ৳{customer.budget?.max?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-xl">
                    <p className="text-xs text-indigo-600 font-medium mb-1">Source</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{customer.source || 'N/A'}</p>
                  </div>
                </div>

                {customer.preferredLocation?.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-medium mb-2">Preferred Locations</p>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(customer.preferredLocation) ? customer.preferredLocation : [customer.preferredLocation]).map((loc, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700">
                          {loc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {customer.propertyType?.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-medium mb-2">Property Types</p>
                    <div className="flex flex-wrap gap-2">
                      {customer.propertyType.map((type, idx) => (
                        <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm capitalize">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {customer.interestedProperties && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-medium mb-2">Interested Properties</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{customer.interestedProperties}</p>
                  </div>
                )}

                {customer.requirements && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-medium mb-2">Additional Requirements</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{customer.requirements}</p>
                  </div>
                )}

                {customer.referredBy && (
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-xs text-green-600 font-medium mb-1">Referred By</p>
                    <p className="text-gray-900 font-medium">{customer.referredBy}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Communication Log */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ChatBubbleLeftIcon className="w-6 h-6 text-purple-600" />
                  Communication Log
                </h2>
                <span className="text-sm text-gray-500">
                  {customer.notes?.length || 0} entries
                </span>
              </div>

              {/* Add Note */}
              <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Add New Entry</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record a call, meeting, email, or any customer interaction..."
                  rows="3"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 resize-none mb-2"
                />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 font-medium">Next Follow-up:</label>
                    <input
                      type="date"
                      value={noteFollowUpDate}
                      onChange={(e) => setNoteFollowUpDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Entry
                  </button>
                </div>
              </div>

              {/* Notes Timeline */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {customer.notes?.length > 0 ? (
                  customer.notes
                    .slice()
                    .sort((a, b) => new Date(b.addedAt || b.createdAt) - new Date(a.addedAt || a.createdAt))
                    .map((note, index) => {
                      const noteDate = new Date(note.addedAt || note.createdAt);
                      const isToday = noteDate.toDateString() === new Date().toDateString();
                      
                      return (
                        <div key={index} className="relative">
                          {index < customer.notes.length - 1 && (
                            <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-purple-200"></div>
                          )}
                          <div className="flex gap-3">
                            <div className="shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm z-10">
                              {note.addedBy?.name?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{note.addedBy?.name || 'Admin'}</p>
                                  <p className="text-xs text-gray-500">
                                    {isToday ? 'Today' : noteDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    {' • '}
                                    {noteDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                  </p>
                                </div>
                                {index === 0 && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Latest</span>
                                )}
                              </div>
                              <p className="text-gray-700 whitespace-pre-wrap">{note.note || note.content}</p>
                              {note.nextFollowUpDate && (
                                <div className="mt-2 flex items-center gap-2 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-lg w-fit">
                                  <CalendarIcon className="w-3 h-3" />
                                  <span>Follow-up: {new Date(note.nextFollowUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-8">
                    <ChatBubbleLeftIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No communication history yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar Info */}
          <div className="space-y-6">
            {/* Next Follow-up */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarDaysIcon className="w-6 h-6 text-orange-500" />
                Next Follow-up
              </h2>
              {customer.nextFollowUpDate ? (
                <div className={`p-4 rounded-xl ${new Date(customer.nextFollowUpDate) <= new Date() ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
                  <p className={`text-lg font-semibold ${new Date(customer.nextFollowUpDate) <= new Date() ? 'text-red-700' : 'text-orange-700'}`}>
                    {new Date(customer.nextFollowUpDate).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                  {new Date(customer.nextFollowUpDate) <= new Date() && (
                    <p className="text-sm text-red-600 mt-1 font-medium">⚠️ Follow-up is overdue!</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No follow-up scheduled</p>
              )}
            </div>

            {/* Assigned Agent */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Agent</h2>
              {customer.assignedAgent ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {customer.assignedAgent.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{customer.assignedAgent.name}</p>
                    <p className="text-sm text-gray-500">{customer.assignedAgent.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No agent assigned</p>
              )}
            </div>

            {/* Meta Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Info</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Added By</p>
                  <p className="text-sm text-gray-900">{customer.addedBy?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm text-gray-900">
                    {new Date(customer.createdAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                {customer.lastContactDate && (
                  <div>
                    <p className="text-xs text-gray-500">Last Contact</p>
                    <p className="text-sm text-gray-900">
                      {new Date(customer.lastContactDate).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDetails;
