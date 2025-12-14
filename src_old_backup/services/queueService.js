// Queue Booking Service
// TODO: Integrate with real queue management API
// For demo: returns mock available slots

const { Queue } = require("../models");

class QueueService {
  async findAvailableSlots(organization, department, userId, orgId = null) {
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
        date: date.toISOString().split("T")[0],
        time: `${9 + i}:00`,
        queueNumber: 10 + i,
        distance: `${i * 2} km`,
        rating: 4.5 - i * 0.1,
        available: true,
      });
    }

    return slots;
  }

  async bookQueue(userId, slot, orgId = null) {
    try {
      const queue = await Queue.create({
        userId,
        orgId: orgId || slot.orgId || null,
        organization: slot.organization,
        branch: slot.branch,
        department: slot.department,
        appointmentDate: new Date(`${slot.date}T${slot.time}:00`),
        queueNumber: slot.queueNumber,
        status: "scheduled",
        location: {
          address: slot.branch,
          distance: slot.distance,
        },
      });

      return queue;
    } catch (error) {
      console.error("Error booking queue:", error);
      throw error;
    }
  }

  async getUserQueues(userId, orgId = null) {
    try {
      const where = { userId };
      if (orgId) {
        where.orgId = orgId;
      }

      return await Queue.findAll({
        where,
        order: [["appointmentDate", "ASC"]],
      });
    } catch (error) {
      console.error("Error getting user queues:", error);
      return [];
    }
  }

  async getOrganizationQueues(orgId) {
    try {
      return await Queue.findAll({
        where: { orgId },
        order: [["appointmentDate", "ASC"]],
      });
    } catch (error) {
      console.error("Error getting organization queues:", error);
      return [];
    }
  }
}

module.exports = new QueueService();
