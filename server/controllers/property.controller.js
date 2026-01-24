import { validationResult } from 'express-validator';
import Property, { CODE_PREFIX, generatePropertyCode } from '../models/Property.model.js';
import Agent from '../models/Agent.model.js';
import User from '../models/User.model.js';
import { notifyPropertyAdded, notifyPropertySold, notifyPropertyAssigned } from '../utils/notificationService.js';

// @desc    Create new property
// @route   POST /api/properties
// @access  Admin/Super Admin
export const createProperty = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Set default image if no images provided
    const defaultImage = 'https://www.cgarchitect.com/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBaU9PIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--92fa0cb79901946f19fe52183638a75f9ed20653/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9VY21WemFYcGxYM1J2WDJ4cGJXbDBXd2RwQWxZRk1Eb0tjMkYyWlhKN0Jqb01jWFZoYkdsMGVXbGsiLCJleHAiOm51bGwsInB1ciI6InZhcmlhdGlvbiJ9fQ==--a140f81341e053a34b77dbf5e04e777cacb11aff/f2228016.jpg';
    
    // Handle uploaded files from multer
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/properties/${file.filename}`);
    } else if (req.body.images && req.body.images.length > 0) {
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    } else {
      images = [defaultImage];
    }

    // Parse location if it's a JSON string
    let locationData = req.body.location;
    if (typeof locationData === 'string') {
      try {
        locationData = JSON.parse(locationData);
      } catch (e) {
        locationData = {};
      }
    }

    // Parse features if it's a JSON string
    let features = req.body.features;
    if (typeof features === 'string') {
      try {
        features = JSON.parse(features);
      } catch (e) {
        features = [];
      }
    }

    // Extract location fields
    const propertyData = {
      ...req.body,
      images,
      features: features || [],
      zone: locationData?.zone || req.body.zone || '',
      thana: locationData?.thana || req.body.thana || '',
      area: locationData?.area || req.body.area || '',
      address: locationData?.address || req.body.address || '',
      location: locationData?.address || req.body.location || `${locationData?.area || ''}, ${locationData?.thana || ''}`,
      uploadedBy: req.user._id
    };

    // Remove the nested location field if it exists
    delete propertyData.location;
    // Set location as a string representation
    propertyData.location = `${propertyData.area}, ${propertyData.thana}`.trim().replace(/^,\s*|,\s*$/g, '');

    // Handle empty assignedAgent - remove if empty string
    if (!propertyData.assignedAgent || propertyData.assignedAgent === '') {
      delete propertyData.assignedAgent;
    }

    // Map frontend 'sale' value to backend 'sell' for state field
    if (propertyData.state === 'sale') {
      propertyData.state = 'sell';
    }

    const property = await Property.create(propertyData);

    // Notify all users (admin, super_admin, and agents) about new property
    try {
      const allUsers = await User.find({
        role: { $in: ['admin', 'super_admin', 'agent'] },
        isActive: true
      }).select('_id');
      
      if (allUsers.length > 0) {
        const userIds = allUsers.map(u => u._id);
        await notifyPropertyAdded(property, userIds);
      }
      
      // Notify agent if property is assigned during creation
      if (req.body.assignedAgent) {
        await notifyPropertyAssigned(property, req.body.assignedAgent);
      }
    } catch (notifError) {
      console.error('Notification error:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      property
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating property',
      error: error.message,
      details: error.stack
    });
  }
};

// @desc    Get all properties
// @route   GET /api/properties
// @access  Public
export const getAllProperties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      state,
      status,
      minPrice,
      maxPrice,
      location,
      search,
      propertyCode,
      zone,
      sort = '-createdAt'
    } = req.query;

    // Build query - show all properties to public
    const query = {};

    if (type) query.type = type;
    if (state) query.state = state;
    if (status) query.status = status;
    // Support zone filtering - check if zone matches exactly
    if (zone) query.zone = zone;
    if (propertyCode) query.propertyCode = new RegExp(propertyCode, 'i');
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (location) query.location = new RegExp(location, 'i');
    
    // Use regex search instead of $text for better compatibility
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { location: searchRegex },
        { description: searchRegex },
        { propertyCode: searchRegex }
      ];
    }

    // Execute query
    const properties = await Property.find(query)
      .populate('uploadedBy', 'name email')
      .populate('assignedAgent', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Property.countDocuments(query);

    res.json({
      success: true,
      properties,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('❌ Error in getAllProperties:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching properties',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get property by ID
// @route   GET /api/properties/:id
// @access  Public
export const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('assignedAgent', 'name email phone');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Increment view count
    property.viewCount += 1;
    await property.save();

    res.json({
      success: true,
      property
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching property',
      error: error.message
    });
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Admin/Super Admin
export const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Track if property status changed to sold
    const oldStatus = property.status;
    const newStatus = req.body.status;
    
    // Track if property is being assigned to an agent
    const oldAssignedAgent = property.assignedAgent?.toString();
    const newAssignedAgent = req.body.assignedAgent;

    // Generate property code if it doesn't exist and not provided in request
    if (!property.propertyCode && !req.body.propertyCode) {
      // Find the highest existing code number
      const regex = new RegExp(`^${CODE_PREFIX}-(\\d+)$`);
      const existingProperties = await Property.find({
        propertyCode: regex
      }).select('propertyCode');
      
      let maxNumber = 100; // Start from 101
      existingProperties.forEach(prop => {
        const match = prop.propertyCode.match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });
      
      const nextNumber = maxNumber + 1;
      req.body.propertyCode = `${CODE_PREFIX}-${nextNumber}`;
    }

    // Parse location if it's a JSON string
    let locationData = req.body.location;
    if (typeof locationData === 'string') {
      try {
        locationData = JSON.parse(locationData);
      } catch (e) {
        locationData = {};
      }
    }

    // Parse features if it's a JSON string
    let features = req.body.features;
    if (typeof features === 'string') {
      try {
        features = JSON.parse(features);
      } catch (e) {
        features = undefined; // Don't update if parsing fails
      }
    }

    // Handle uploaded files from multer
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map(file => `/uploads/properties/${file.filename}`);
    }

    // Extract location fields
    const updateData = {
      ...req.body
    };

    // Update images if new ones were uploaded
    if (newImages.length > 0) {
      updateData.images = [...(property.images || []), ...newImages];
    }

    // Update features if provided
    if (features !== undefined) {
      updateData.features = features;
    }

    // Handle empty assignedAgent - remove if empty string
    if (updateData.assignedAgent === '' || updateData.assignedAgent === null) {
      delete updateData.assignedAgent;
    }

    // Map frontend 'sale' value to backend 'sell' for state field
    if (updateData.state === 'sale') {
      updateData.state = 'sell';
    }

    // If location is provided as an object, extract the fields
    if (locationData && typeof locationData === 'object') {
      updateData.zone = locationData.zone || updateData.zone || property.zone;
      updateData.thana = locationData.thana || updateData.thana || property.thana;
      updateData.area = locationData.area || updateData.area || property.area;
      updateData.address = locationData.address || updateData.address || property.address;
      updateData.location = `${updateData.area}, ${updateData.thana}`.trim().replace(/^,\s*|,\s*$/g, '');
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Notify admins when property is sold
    if (oldStatus !== 'sold' && newStatus === 'sold') {
      try {
        await notifyPropertySold(updatedProperty);
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }
    }

    // Notify agent when property is assigned to them
    if (newAssignedAgent && newAssignedAgent !== oldAssignedAgent) {
      try {
        await notifyPropertyAssigned(updatedProperty, newAssignedAgent);
      } catch (notifError) {
        console.error('Notification error:', notifError);
      }
    }

    res.json({
      success: true,
      message: 'Property updated successfully',
      property: updatedProperty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating property',
      error: error.message
    });
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Super Admin
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    await property.deleteOne();

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting property',
      error: error.message
    });
  }
};

// @desc    Publish property to frontend
// @route   PATCH /api/properties/:id/publish
// @access  Super Admin
export const publishProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    property.publishedToFrontend = !property.publishedToFrontend;
    property.isPublished = property.publishedToFrontend;
    await property.save();

    res.json({
      success: true,
      message: `Property ${property.publishedToFrontend ? 'published' : 'unpublished'} successfully`,
      property
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error publishing property',
      error: error.message
    });
  }
};

// @desc    Assign agent to property
// @route   PATCH /api/properties/:id/assign-agent
// @access  Admin/Super Admin
export const assignAgent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { agentId } = req.body;

    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const agent = await Agent.findOne({ userId: agentId });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    property.assignedAgent = agentId;
    await property.save();

    // Add to agent's assigned properties
    if (!agent.assignedProperties.includes(property._id)) {
      agent.assignedProperties.push(property._id);
      await agent.save();
    }

    res.json({
      success: true,
      message: 'Agent assigned successfully',
      property
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning agent',
      error: error.message
    });
  }
};

// @desc    Get my assigned properties
// @route   GET /api/properties/my/properties
// @access  Agent/Admin/Super Admin
export const getMyProperties = async (req, res) => {
  try {
    let properties;

    if (req.user.role === 'agent') {
      // Agent sees only assigned properties
      properties = await Property.find({ assignedAgent: req.user._id })
        .populate('uploadedBy', 'name email')
        .sort('-createdAt');
    } else {
      // Admin/Super Admin see all properties
      properties = await Property.find()
        .populate('uploadedBy', 'name email')
        .populate('assignedAgent', 'name email')
        .sort('-createdAt');
    }

    res.json({
      success: true,
      properties,
      count: properties.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching properties',
      error: error.message
    });
  }
};
