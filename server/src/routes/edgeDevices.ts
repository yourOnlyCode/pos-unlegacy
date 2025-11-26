import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const CreateEdgeDeviceSchema = z.object({
  businessId: z.string(),
});

// Create edge device for business
router.post('/', async (req, res) => {
  try {
    const { businessId } = CreateEdgeDeviceSchema.parse(req.body);

    // Check if business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Check if edge device already exists
    const existingDevice = await prisma.edgeDevice.findUnique({
      where: { businessId },
    });

    if (existingDevice) {
      return res.status(400).json({ error: 'Edge device already exists for this business' });
    }

    // Create edge device
    const edgeDevice = await prisma.edgeDevice.create({
      data: {
        businessId,
        status: 'pending',
      },
    });

    // Update business deployment type
    await prisma.business.update({
      where: { id: businessId },
      data: {
        deploymentType: 'edge',
        edgeDeviceId: edgeDevice.id,
      },
    });

    res.json({
      id: edgeDevice.id,
      businessId: edgeDevice.businessId,
      status: edgeDevice.status,
      deviceKey: edgeDevice.deviceKey,
    });
  } catch (error) {
    console.error('Error creating edge device:', error);
    res.status(500).json({ error: 'Failed to create edge device' });
  }
});

// Get edge device status
router.get('/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;

    const edgeDevice = await prisma.edgeDevice.findUnique({
      where: { businessId },
    });

    if (!edgeDevice) {
      return res.status(404).json({ error: 'Edge device not found' });
    }

    res.json({
      id: edgeDevice.id,
      businessId: edgeDevice.businessId,
      status: edgeDevice.status,
      localIp: edgeDevice.localIp,
      lastSync: edgeDevice.lastSync,
    });
  } catch (error) {
    console.error('Error getting edge device:', error);
    res.status(500).json({ error: 'Failed to get edge device' });
  }
});

// Update edge device status (for device management)
router.patch('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { status, localIp } = req.body;

    const edgeDevice = await prisma.edgeDevice.update({
      where: { id: deviceId },
      data: {
        ...(status && { status }),
        ...(localIp && { localIp }),
        lastSync: new Date(),
      },
    });

    // Update business API endpoint if device is active
    if (status === 'active' && localIp) {
      await prisma.business.update({
        where: { id: edgeDevice.businessId },
        data: {
          edgeApiEndpoint: `https://${localIp}:3001`,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating edge device:', error);
    res.status(500).json({ error: 'Failed to update edge device' });
  }
});

export default router;