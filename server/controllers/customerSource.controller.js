import CustomerSource from '../models/CustomerSource.model.js';

// Get all customer sources
export const getAllSources = async (req, res) => {
  try {
    const sources = await CustomerSource.find({ isActive: true }).sort({ isDefault: -1, name: 1 });
    res.json({ success: true, sources });
  } catch (error) {
    console.error('Error fetching customer sources:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all sources including inactive (admin view)
export const getAllSourcesAdmin = async (req, res) => {
  try {
    const sources = await CustomerSource.find().sort({ isDefault: -1, name: 1 }).populate('createdBy', 'name');
    res.json({ success: true, sources });
  } catch (error) {
    console.error('Error fetching customer sources:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create a new customer source (super_admin only)
export const createSource = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Source name is required' });
    }

    // Generate value from name (lowercase, replace spaces with underscore)
    const value = name.trim().toLowerCase().replace(/\s+/g, '_');

    // Check if source already exists
    const existingSource = await CustomerSource.findOne({ 
      $or: [
        { name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } },
        { value }
      ]
    });

    if (existingSource) {
      return res.status(400).json({ success: false, message: 'Source already exists' });
    }

    const newSource = new CustomerSource({
      name: name.trim(),
      value,
      createdBy: req.user._id,
      isDefault: false
    });

    await newSource.save();

    res.status(201).json({ 
      success: true, 
      message: 'Source created successfully', 
      source: newSource 
    });
  } catch (error) {
    console.error('Error creating customer source:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update a customer source (super_admin only)
export const updateSource = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const source = await CustomerSource.findById(id);
    if (!source) {
      return res.status(404).json({ success: false, message: 'Source not found' });
    }

    // Don't allow editing default sources
    if (source.isDefault && name && name !== source.name) {
      return res.status(400).json({ success: false, message: 'Cannot rename default sources' });
    }

    if (name) {
      source.name = name.trim();
      source.value = name.trim().toLowerCase().replace(/\s+/g, '_');
    }

    if (typeof isActive === 'boolean') {
      // Don't allow deactivating default sources
      if (source.isDefault && !isActive) {
        return res.status(400).json({ success: false, message: 'Cannot deactivate default sources' });
      }
      source.isActive = isActive;
    }

    await source.save();

    res.json({ success: true, message: 'Source updated successfully', source });
  } catch (error) {
    console.error('Error updating customer source:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a customer source (super_admin only)
export const deleteSource = async (req, res) => {
  try {
    const { id } = req.params;

    const source = await CustomerSource.findById(id);
    if (!source) {
      return res.status(404).json({ success: false, message: 'Source not found' });
    }

    // Don't allow deleting default sources
    if (source.isDefault) {
      return res.status(400).json({ success: false, message: 'Cannot delete default sources' });
    }

    await CustomerSource.findByIdAndDelete(id);

    res.json({ success: true, message: 'Source deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer source:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Seed default sources (run once)
export const seedDefaultSources = async () => {
  try {
    const defaultSources = [
      { name: 'Website', value: 'website', isDefault: true },
      { name: 'Referral', value: 'referral', isDefault: true },
      { name: 'Social Media', value: 'social_media', isDefault: true },
      { name: 'Walk In', value: 'walk_in', isDefault: true },
      { name: 'Call', value: 'call', isDefault: true },
      { name: 'Other', value: 'other', isDefault: true }
    ];

    for (const source of defaultSources) {
      const exists = await CustomerSource.findOne({ value: source.value });
      if (!exists) {
        await CustomerSource.create(source);
        console.log(`Created default source: ${source.name}`);
      }
    }

    console.log('Default customer sources seeded successfully');
  } catch (error) {
    console.error('Error seeding default sources:', error);
  }
};
