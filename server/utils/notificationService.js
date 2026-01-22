import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';

// Create notification helper
export const createNotification = async ({
  recipientId,
  type,
  title,
  message,
  priority = 'medium',
  relatedEntity = {},
  actionUrl = null,
  metadata = {}
}) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      priority,
      relatedEntity,
      actionUrl,
      metadata
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Create notifications for multiple recipients
export const createBulkNotifications = async (recipients, notificationData) => {
  try {
    const notifications = recipients.map(recipientId => ({
      recipient: recipientId,
      ...notificationData
    }));
    
    return await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

// Notify all admins and super_admins
export const notifyAdmins = async (notificationData) => {
  try {
    const admins = await User.find({
      role: { $in: ['admin', 'super_admin'] },
      isActive: true
    }).select('_id');
    
    const adminIds = admins.map(admin => admin._id);
    return await createBulkNotifications(adminIds, notificationData);
  } catch (error) {
    console.error('Error notifying admins:', error);
    throw error;
  }
};

// Notify specific user
export const notifyUser = async (userId, notificationData) => {
  return await createNotification({
    recipientId: userId,
    ...notificationData
  });
};

// Important event notifications
export const notifyTaskAssigned = async (task, assignedUserId) => {
  return await notifyUser(assignedUserId, {
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: `You have been assigned a new task: "${task.title}"`,
    priority: task.priority === 'urgent' ? 'urgent' : 'medium',
    relatedEntity: {
      entityType: 'Task',
      entityId: task._id
    },
    actionUrl: `/dashboard/tasks/${task._id}`,
    metadata: {
      taskTitle: task.title,
      taskPriority: task.priority,
      dueDate: task.dueDate
    }
  });
};

export const notifyTaskCompleted = async (task, creatorId) => {
  if (creatorId.toString() === task.assignedTo.toString()) return; // Don't notify if same user
  
  return await notifyUser(creatorId, {
    type: 'task_completed',
    title: 'Task Completed',
    message: `Task "${task.title}" has been completed`,
    priority: 'medium',
    relatedEntity: {
      entityType: 'Task',
      entityId: task._id
    },
    actionUrl: `/dashboard/tasks/${task._id}`,
    metadata: {
      taskTitle: task.title,
      completedBy: task.assignedTo
    }
  });
};

export const notifyUrgentTask = async (task) => {
  const notifications = [];
  
  // Notify assigned user
  if (task.assignedTo) {
    notifications.push(
      notifyUser(task.assignedTo, {
        type: 'urgent_task',
        title: '🚨 Urgent Task',
        message: `URGENT: "${task.title}" requires immediate attention`,
        priority: 'urgent',
        relatedEntity: {
          entityType: 'Task',
          entityId: task._id
        },
        actionUrl: `/dashboard/tasks/${task._id}`,
        metadata: {
          taskTitle: task.title,
          dueDate: task.dueDate
        }
      })
    );
  }
  
  // Also notify admins about urgent tasks
  notifications.push(
    notifyAdmins({
      type: 'urgent_task',
      title: '🚨 Urgent Task Created',
      message: `An urgent task has been created: "${task.title}"`,
      priority: 'urgent',
      relatedEntity: {
        entityType: 'Task',
        entityId: task._id
      },
      actionUrl: `/dashboard/tasks/${task._id}`,
      metadata: {
        taskTitle: task.title,
        createdBy: task.createdBy,
        assignedTo: task.assignedTo
      }
    })
  );
  
  return await Promise.all(notifications);
};

export const notifyPropertyAdded = async (property, adminIds) => {
  return await createBulkNotifications(adminIds, {
    type: 'property_added',
    title: 'New Property Listed',
    message: `New property added: ${property.name} - ৳${property.price?.toLocaleString()}`,
    priority: 'medium',
    relatedEntity: {
      entityType: 'Property',
      entityId: property._id
    },
    actionUrl: `/dashboard/properties/${property._id}`,
    metadata: {
      propertyName: property.name,
      price: property.price,
      location: property.location
    }
  });
};

export const notifyPropertySold = async (property) => {
  return await notifyAdmins({
    type: 'property_sold',
    title: '🎉 Property Sold',
    message: `Property sold: ${property.name} - ৳${property.price?.toLocaleString()}`,
    priority: 'high',
    relatedEntity: {
      entityType: 'Property',
      entityId: property._id
    },
    actionUrl: `/dashboard/properties/${property._id}`,
    metadata: {
      propertyName: property.name,
      price: property.price,
      soldDate: new Date()
    }
  });
};

export const notifyHighValueLead = async (customer, agentId) => {
  const notifications = [];
  
  // Notify assigned agent
  if (agentId) {
    notifications.push(
      notifyUser(agentId, {
        type: 'high_value_lead',
        title: '💎 High Value Lead',
        message: `New high-value lead: ${customer.name} (Budget: ৳${customer.budget?.toLocaleString()})`,
        priority: 'high',
        relatedEntity: {
          entityType: 'Customer',
          entityId: customer._id
        },
        actionUrl: `/dashboard/customers/${customer._id}`,
        metadata: {
          customerName: customer.name,
          budget: customer.budget,
          leadStatus: customer.leadStatus
        }
      })
    );
  }
  
  // Notify admins
  notifications.push(
    notifyAdmins({
      type: 'high_value_lead',
      title: '💎 High Value Lead',
      message: `New high-value lead: ${customer.name} (Budget: $${customer.budget?.toLocaleString()})`,
      priority: 'high',
      relatedEntity: {
        entityType: 'Customer',
        entityId: customer._id
      },
      actionUrl: `/dashboard/customers/${customer._id}`,
      metadata: {
        customerName: customer.name,
        budget: customer.budget,
        assignedAgent: agentId
      }
    })
  );
  
  return await Promise.all(notifications);
};

export const notifyDealClosed = async (customer, agentId, dealAmount) => {
  const notifications = [];
  
  // Notify agent
  if (agentId) {
    notifications.push(
      notifyUser(agentId, {
        type: 'deal_closed',
        title: '🎉 Deal Closed!',
        message: `Congratulations! Deal closed with ${customer.name} - ৳${dealAmount?.toLocaleString()}`,
        priority: 'high',
        relatedEntity: {
          entityType: 'Customer',
          entityId: customer._id
        },
        actionUrl: `/dashboard/customers/${customer._id}`,
        metadata: {
          customerName: customer.name,
          dealAmount: dealAmount,
          closedDate: new Date()
        }
      })
    );
  }
  
  // Notify admins
  notifications.push(
    notifyAdmins({
      type: 'deal_closed',
      title: '🎉 Deal Closed',
      message: `Deal closed: ${customer.name} - ৳${dealAmount?.toLocaleString()}`,
      priority: 'high',
      relatedEntity: {
        entityType: 'Customer',
        entityId: customer._id
      },
      actionUrl: `/dashboard/customers/${customer._id}`,
      metadata: {
        customerName: customer.name,
        dealAmount: dealAmount,
        agentId: agentId
      }
    })
  );
  
  return await Promise.all(notifications);
};

export const notifyCustomerAssigned = async (customer, agentId) => {
  return await notifyUser(agentId, {
    type: 'customer_assigned',
    title: 'New Customer Assigned',
    message: `You have been assigned a new customer: ${customer.name}`,
    priority: 'medium',
    relatedEntity: {
      entityType: 'Customer',
      entityId: customer._id
    },
    actionUrl: `/dashboard/customers/${customer._id}`,
    metadata: {
      customerName: customer.name,
      leadStatus: customer.leadStatus,
      budget: customer.budget
    }
  });
};

export const notifyPropertyAssigned = async (property, agentId) => {
  return await notifyUser(agentId, {
    type: 'property_assigned',
    title: 'New Property Assigned',
    message: `You have been assigned a new property: ${property.name} - ৳${property.price?.toLocaleString()}`,
    priority: 'medium',
    relatedEntity: {
      entityType: 'Property',
      entityId: property._id
    },
    actionUrl: `/dashboard/properties/${property._id}`,
    metadata: {
      propertyName: property.name,
      price: property.price,
      location: property.location,
      type: property.type
    }
  });
};

// Notify admins when agent adds customer without assignment
export const notifyCustomerAdded = async (customer, addedByUserId) => {
  return await notifyAdmins({
    type: 'customer_added',
    title: 'New Customer Added',
    message: `New customer added by agent: ${customer.name}${customer.budget ? ` (Budget: ৳${customer.budget?.toLocaleString()})` : ''}`,
    priority: 'medium',
    relatedEntity: {
      entityType: 'Customer',
      entityId: customer._id
    },
    actionUrl: `/dashboard/customers/${customer._id}`,
    metadata: {
      customerName: customer.name,
      addedBy: addedByUserId,
      leadStatus: customer.leadStatus,
      budget: customer.budget
    }
  });
};

// Notify about customer communication log messages
export const notifyCustomerMessage = async (customer, messageText, senderName, recipientIds) => {
  const notifications = recipientIds.map(recipientId => 
    notifyUser(recipientId, {
      type: 'customer_message',
      title: 'New Communication Log Message',
      message: `${senderName} added a message for ${customer.name}: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`,
      priority: 'medium',
      relatedEntity: {
        entityType: 'Customer',
        entityId: customer._id
      },
      actionUrl: `/dashboard/customers/${customer._id}`,
      metadata: {
        customerName: customer.name,
        senderName: senderName,
        messagePreview: messageText.substring(0, 100)
      }
    })
  );
  
  return await Promise.all(notifications);
};

// Notify super admin when new agent is added
export const notifyAgentAdded = async (agent, userId) => {
  const superAdmins = await User.find({
    role: 'super_admin',
    isActive: true
  }).select('_id');
  
  const superAdminIds = superAdmins.map(admin => admin._id);
  
  return await createBulkNotifications(superAdminIds, {
    type: 'agent_added',
    title: 'New Agent Added',
    message: `New agent profile created for ${agent.userId?.name || 'user'}`,
    priority: 'medium',
    relatedEntity: {
      entityType: 'Agent',
      entityId: agent._id
    },
    actionUrl: `/dashboard/agents`,
    metadata: {
      agentId: agent._id,
      userId: userId,
      specialization: agent.specialization
    }
  });
};

