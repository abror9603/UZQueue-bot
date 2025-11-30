// Queue Booking Service
// TODO: Integrate with real queue management API
// For demo: returns mock available slots

const { Queue } = require('../models');

class QueueService {
  async findAvailableSlots(organization, department, userId) {
    // Simulate finding available slots
    // In production, this would call Queue API:
    // const response = await fetch('QUEUE_API_ENDPOINT', {
    //   method: 'POST',
    //   body: JSON.stringify({ organization, department, userId })
    // });

    // Generate mock available slots
    const slots = [];
    const today = new Date();
    
    for (let i = 1; i <= 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      slots.push({
        branch: `${organization} - Filial ${i}`,
        date: date.toISOString().split('T')[0],
        time: `${9 + i}:00`,
        queueNumber: 10 + i,
        distance: `${i * 2} km`,
        rating: 4.5 - (i * 0.1),
        available: true
      });
    }

    return slots;
  }

  async bookQueue(userId, slot) {
    try {
      const queue = await Queue.create({
        userId,
        organization: slot.organization,
        branch: slot.branch,
        department: slot.department,
        appointmentDate: new Date(`${slot.date}T${slot.time}:00`),
        queueNumber: slot.queueNumber,
        status: 'scheduled',
        location: {
          address: slot.branch,
          distance: slot.distance
        }
      });

      return queue;
    } catch (error) {
      console.error('Error booking queue:', error);
      throw error;
    }
  }

  async getUserQueues(userId) {
    try {
      return await Queue.findAll({
        where: { userId },
        order: [['appointmentDate', 'ASC']]
      });
    } catch (error) {
      console.error('Error getting user queues:', error);
      return [];
    }
  }
}

module.exports = new QueueService();

