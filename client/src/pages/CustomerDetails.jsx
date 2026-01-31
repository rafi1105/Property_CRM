import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { customerAPI, visitAPI } from '../utils/api';
import { formatDate, formatDateLong, formatDateWithWeekday, formatTime } from '../utils/dateFormat';
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
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Helper function to extract note text properly
const getNoteText = (noteObj) => {
  if (!noteObj) return '';
  
  // Get the note field from the note object
  const noteField = noteObj.note;
  
  // If noteField is a string, return it directly
  if (typeof noteField === 'string') return noteField;
  
  // If noteField is an object (due to double-wrapping bug)
  if (noteField && typeof noteField === 'object') {
    // Check for note.note.note (triple nested due to bug)
    if (noteField.note && typeof noteField.note === 'string') return noteField.note;
    // Check for text or content properties
    if (noteField.text && typeof noteField.text === 'string') return noteField.text;
    if (noteField.content && typeof noteField.content === 'string') return noteField.content;
  }
  
  // Fallback: check other common properties on the main object
  if (noteObj.text && typeof noteObj.text === 'string') return noteObj.text;
  if (noteObj.content && typeof noteObj.content === 'string') return noteObj.content;
  
  // Last resort
  return 'Note content unavailable';
};

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [noteFollowUpDate, setNoteFollowUpDate] = useState('');
  const [visits, setVisits] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [editNoteFollowUpDate, setEditNoteFollowUpDate] = useState('');

  useEffect(() => {
    fetchCustomer();
    // Fetch visits only for super_admin
    if (user?.role === 'super_admin') {
      fetchVisits();
    }
  }, [id, user]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getById(id);
      setCustomer(response.data.customer || response.data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Failed to load customer details');
      navigate('/dashboard/customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchVisits = async () => {
    try {
      const response = await visitAPI.getAll({ customerId: id });
      setVisits(response.data?.visits || response.data || []);
    } catch (error) {
      console.error('Error fetching visits:', error);
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

  const handleEditNote = async (noteId) => {
    if (!editNoteText.trim()) return;
    try {
      console.log('Editing note with ID:', noteId); // Debug log
      const noteData = { note: editNoteText };
      if (editNoteFollowUpDate) {
        noteData.nextFollowUpDate = editNoteFollowUpDate;
      }
      await customerAPI.editNote(customer._id, noteId, noteData);
      toast.success('Note updated successfully');
      setEditingNote(null);
      setEditNoteText('');
      setEditNoteFollowUpDate('');
      fetchCustomer();
    } catch (error) {
      console.error('Edit note error:', error); // Debug log
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      console.log('Deleting note with ID:', noteId); // Debug log
      await customerAPI.deleteNote(customer._id, noteId);
      toast.success('Note deleted successfully');
      fetchCustomer();
    } catch (error) {
      console.error('Delete note error:', error); // Debug log
      toast.error('Failed to delete note');
    }
  };

  const startEditNote = (note) => {
    console.log('Starting to edit note:', note); // Debug log
    setEditingNote(note._id);
    setEditNoteText(getNoteText(note));
    setEditNoteFollowUpDate(note.nextFollowUpDate ? new Date(note.nextFollowUpDate).toISOString().split('T')[0] : '');
  };

  const cancelEditNote = () => {
    setEditingNote(null);
    setEditNoteText('');
    setEditNoteFollowUpDate('');
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
            onClick={() => navigate('/dashboard/customers')}
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
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => navigate('/dashboard/customers')}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors mb-3 sm:mb-4 text-sm sm:text-base"
          >
            <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Back to Customers</span>
          </button>
          
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl sm:text-2xl">
                  {customer.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{customer.name}</h1>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                  <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${statusColors[customer.status]}`}>
                    {customer.status}
                  </span>
                  <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-xs sm:text-sm font-medium border ${priorityColors[customer.priority]}`}>
                    {customer.priority}
                  </span>
                  {customer.isFollowUpDue && (
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-orange-100 text-orange-700 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1">
                      <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Follow-up Due</span>
                      <span className="sm:hidden">Due</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {user?.role !== 'agent' && (
              <button
                onClick={() => navigate(`/dashboard/customers?edit=${customer._id}`)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm sm:text-base w-full sm:w-auto sm:self-start"
              >
                <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                Edit Customer
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-gray-900 font-medium text-sm sm:text-base">{customer.phone}</p>
                  </div>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <EnvelopeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-gray-900 font-medium truncate text-sm sm:text-base">{customer.email}</p>
                    </div>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl sm:col-span-2">
                    <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-gray-900 font-medium text-sm sm:text-base">{customer.address}</p>
                    </div>
                  </div>
                )}
                {(customer.customerZone || customer.customerThana) && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl sm:col-span-2">
                    <BuildingOfficeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Zone / Thana</p>
                      <p className="text-gray-900 font-medium text-sm sm:text-base">
                        {[customer.customerZone, customer.customerThana].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Requirements & Preferences */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <HomeModernIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                Requirements & Preferences
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-purple-50 rounded-xl">
                    <p className="text-[10px] sm:text-xs text-purple-600 font-medium mb-1">Budget Range</p>
                    <p className="text-sm sm:text-lg font-semibold text-gray-900">
                      ৳{customer.budget?.min?.toLocaleString() || 0} - ৳{customer.budget?.max?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="p-3 sm:p-4 bg-indigo-50 rounded-xl">
                    <p className="text-[10px] sm:text-xs text-indigo-600 font-medium mb-1">Source</p>
                    <p className="text-sm sm:text-lg font-semibold text-gray-900 capitalize">{customer.source || 'N/A'}</p>
                  </div>
                </div>

                {customer.preferredLocation?.length > 0 && (
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-2">Preferred Locations</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {(Array.isArray(customer.preferredLocation) ? customer.preferredLocation : [customer.preferredLocation]).map((loc, idx) => (
                        <span key={idx} className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white border border-gray-200 rounded-full text-xs sm:text-sm text-gray-700">
                          {loc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {customer.propertyType?.length > 0 && (
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-2">Property Types</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {customer.propertyType.map((type, idx) => (
                        <span key={idx} className="px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-100 text-purple-700 rounded-full text-xs sm:text-sm capitalize">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(customer.interestedProperties || customer.interestedPropertyCode) && (
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-2">Interested Properties</p>
                    <div className="flex flex-wrap items-start gap-2 sm:gap-3">
                      {customer.interestedPropertyCode && (
                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-100 text-purple-700 rounded-lg text-xs sm:text-sm font-medium">
                          Code: {customer.interestedPropertyCode}
                        </span>
                      )}
                      {customer.interestedProperties && (
                        <p className="text-gray-700 whitespace-pre-wrap flex-1 text-xs sm:text-sm">{customer.interestedProperties}</p>
                      )}
                    </div>
                  </div>
                )}

                {customer.requirements && (
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-2">Additional Requirements</p>
                    <p className="text-gray-700 whitespace-pre-wrap text-xs sm:text-sm">{customer.requirements}</p>
                  </div>
                )}

                {customer.referredBy && (
                  <div className="p-3 sm:p-4 bg-green-50 rounded-xl">
                    <p className="text-[10px] sm:text-xs text-green-600 font-medium mb-1">Referred By</p>
                    <p className="text-gray-900 font-medium text-sm sm:text-base">{customer.referredBy}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Communication Log */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                    <ChatBubbleLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    Communication Log
                  </h2>
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/20 text-white rounded-full text-xs sm:text-sm font-medium">
                    {customer.notes?.length || 0} entries
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {/* Add Note - Compact Modern Design */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex gap-2 sm:gap-3">
                    <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-2.5 sm:p-3 transition-all">
                        <textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Add a note..."
                          rows="2"
                          style={{ color: '#111827', backgroundColor: 'transparent' }}
                          className="w-full bg-transparent border-none outline-none resize-none text-xs sm:text-sm placeholder-gray-400 !text-gray-900"
                        />
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 border-t border-gray-200 mt-2 gap-2">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                            <input
                              type="date"
                              value={noteFollowUpDate}
                              onChange={(e) => setNoteFollowUpDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-gray-700"
                            />
                            <span className="text-xs text-gray-400 hidden sm:inline">Follow-up</span>
                          </div>
                          <button
                            onClick={handleAddNote}
                            disabled={!newNote.trim()}
                            className="px-3 sm:px-4 py-1 sm:py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto justify-center"
                          >
                            <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Post
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Timeline - Modern Chat Style */}
                <div className="space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-1 sm:pr-2 scrollbar-thin">
                  {customer.notes?.length > 0 ? (
                    customer.notes
                      .slice()
                      .sort((a, b) => new Date(b.addedAt || b.createdAt) - new Date(a.addedAt || a.createdAt))
                      .map((note, index) => {
                        const noteDate = new Date(note.addedAt || note.createdAt);
                        const isToday = noteDate.toDateString() === new Date().toDateString();
                        const isYesterday = new Date(noteDate.getTime() + 86400000).toDateString() === new Date().toDateString();
                        const timeAgo = isToday 
                          ? `Today at ${formatTime(noteDate)}`
                          : isYesterday 
                            ? `Yesterday at ${formatTime(noteDate)}`
                            : `${formatDate(noteDate)} at ${formatTime(noteDate)}`;
                        
                        return (
                          <div key={index} className="flex gap-2 sm:gap-3 group">
                            <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-sm">
                              {note.addedBy?.name?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                                <span className="font-semibold text-gray-900 text-xs sm:text-sm">{note.addedBy?.name || 'Admin'}</span>
                                <span className="text-[10px] sm:text-xs text-gray-400">{timeAgo}</span>
                                {index === 0 && (
                                  <span className="px-1.5 sm:px-2 py-0.5 bg-green-100 text-green-700 text-[10px] sm:text-xs rounded-full font-medium">New</span>
                                )}
                                {note.editedAt && (
                                  <span className="px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] sm:text-xs rounded-full font-medium">Edited</span>
                                )}
                              </div>
                              
                              {editingNote === note._id ? (
                                // Edit mode
                                <div className="bg-gray-50 rounded-2xl rounded-tl-md border border-gray-200 p-2.5 sm:p-3">
                                  <textarea
                                    value={editNoteText}
                                    onChange={(e) => setEditNoteText(e.target.value)}
                                    rows="3"
                                    className="w-full bg-transparent border-none outline-none resize-none text-xs sm:text-sm text-gray-800"
                                    style={{ color: '#1f2937' }}
                                  />
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 border-t border-gray-200 mt-2 gap-2">
                                    <div className="flex items-center gap-2">
                                      <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                                      <input
                                        type="date"
                                        value={editNoteFollowUpDate}
                                        onChange={(e) => setEditNoteFollowUpDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 text-gray-700"
                                      />
                                      <span className="text-xs text-gray-400 hidden sm:inline">Follow-up</span>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                      <button
                                        onClick={cancelEditNote}
                                        className="flex-1 sm:flex-none px-3 py-1 text-gray-600 hover:text-gray-800 text-xs rounded-lg"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleEditNote(note._id)}
                                        className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // View mode
                                <div className="bg-gray-50 rounded-2xl rounded-tl-md px-3 sm:px-4 py-2 sm:py-3 border border-gray-100 group-hover:border-gray-200 transition-colors">
                                  <p className="text-gray-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#1f2937' }}>
                                    {getNoteText(note)}
                                  </p>
                                  {note.nextFollowUpDate && (
                                    <div className="mt-2 sm:mt-3 flex items-center gap-2 text-xs">
                                      <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-orange-100 text-orange-700 rounded-lg font-medium text-[10px] sm:text-xs">
                                        <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        Follow-up: {formatDate(note.nextFollowUpDate)}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Edit/Delete buttons - show for note owner or admin+ */}
                                  {(note.addedBy?._id === user?._id || ['admin', 'super_admin'].includes(user?.role)) && (
                                    <div className="mt-2 flex items-center gap-1 sm:gap-2">
                                      <button
                                        onClick={() => startEditNote(note)}
                                        className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded text-[10px] sm:text-xs transition-colors"
                                      >
                                        <PencilIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteNote(note._id)}
                                        className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded text-[10px] sm:text-xs transition-colors"
                                      >
                                        <TrashIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <ChatBubbleLeftIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium text-sm sm:text-base">No communication yet</p>
                      <p className="text-gray-400 text-xs sm:text-sm mt-1">Start by adding your first note above</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Visit History - Super Admin Only */}
            {user?.role === 'super_admin' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                      <EyeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="hidden sm:inline">Visit History (Agent Records)</span>
                      <span className="sm:hidden">Visits</span>
                    </h2>
                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/20 text-white rounded-full text-xs sm:text-sm font-medium">
                      {visits.length} visits
                    </span>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  {visits.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4 max-h-[350px] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2">
                      {visits
                        .slice()
                        .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
                        .map((visit, index) => (
                          <div key={visit._id || index} className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                            <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                                  {visit.agent?.name?.charAt(0)?.toUpperCase() || 'A'}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{visit.agent?.name || 'Unknown Agent'}</p>
                                  <p className="text-[10px] sm:text-xs text-gray-500">
                                    {formatDateWithWeekday(visit.visitDate)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 flex-shrink-0">
                                <span className={`px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                                  visit.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  visit.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                  visit.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {visit.status}
                                </span>
                                {visit.customerInterest && (
                                  <span className={`px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium hidden sm:inline ${
                                    visit.customerInterest === 'very_interested' ? 'bg-purple-100 text-purple-700' :
                                    visit.customerInterest === 'interested' ? 'bg-blue-100 text-blue-700' :
                                    visit.customerInterest === 'not_interested' ? 'bg-gray-100 text-gray-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {visit.customerInterest.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {visit.property && (
                              <div className="mb-2 flex items-center gap-2 text-xs sm:text-sm">
                                <BuildingOfficeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-600 truncate">Property: {visit.property?.name || visit.property?.title || 'N/A'}</span>
                              </div>
                            )}
                            
                            {visit.notes && (
                              <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-200 mb-2">
                                <p className="text-[10px] sm:text-xs text-gray-500 mb-1 font-medium">Notes</p>
                                <p className="text-xs sm:text-sm text-gray-700">{visit.notes}</p>
                              </div>
                            )}
                            
                            {visit.feedback && (
                              <div className="bg-green-50 rounded-lg p-2 sm:p-3 border border-green-200 mb-2">
                                <p className="text-[10px] sm:text-xs text-green-600 mb-1 font-medium">Feedback</p>
                                <p className="text-xs sm:text-sm text-gray-700">{visit.feedback}</p>
                              </div>
                            )}
                            
                            {visit.nextFollowUp && (
                              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-orange-600 mt-2">
                                <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span>Follow-up: {formatDate(visit.nextFollowUp)}</span>
                              </div>
                            )}
                            
                            {visit.followUpAction && (
                              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Action: {visit.followUpAction}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <EyeIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium text-sm sm:text-base">No visits recorded</p>
                      <p className="text-gray-400 text-xs sm:text-sm mt-1">Agents can record visits from the dashboard</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Next Follow-up */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                Next Follow-up
              </h2>
              {customer.nextFollowUpDate ? (
                <div className={`p-3 sm:p-4 rounded-xl ${new Date(customer.nextFollowUpDate) <= new Date() ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
                  <p className={`text-sm sm:text-lg font-semibold ${new Date(customer.nextFollowUpDate) <= new Date() ? 'text-red-700' : 'text-orange-700'}`}>
                    {formatDateWithWeekday(customer.nextFollowUpDate)}
                  </p>
                  {new Date(customer.nextFollowUpDate) <= new Date() && (
                    <p className="text-xs sm:text-sm text-red-600 mt-1 font-medium">⚠️ Follow-up is overdue!</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-xs sm:text-sm">No follow-up scheduled</p>
              )}
            </div>

            {/* Assigned Agent */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Assigned Agent</h2>
              {customer.assignedAgent ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm sm:text-base">
                      {customer.assignedAgent.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{customer.assignedAgent.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{customer.assignedAgent.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-xs sm:text-sm">No agent assigned</p>
              )}
            </div>

            {/* Meta Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Additional Info</h2>
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-500">Added By</p>
                  <p className="text-xs sm:text-sm text-gray-900">{customer.addedBy?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-500">Created</p>
                  <p className="text-xs sm:text-sm text-gray-900">
                    {formatDateLong(customer.createdAt)}
                  </p>
                </div>
                {customer.lastContactDate && (
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">Last Contact</p>
                    <p className="text-xs sm:text-sm text-gray-900">
                      {formatDateLong(customer.lastContactDate)}
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
