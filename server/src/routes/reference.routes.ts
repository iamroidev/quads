import { Router } from 'express';
import {
  UMaTPrograms,
  AcademicLevels,
  UMaTHalls,
  PickupSpots,
} from '../seed-data/programs';

const router = Router();

// All reference data in one endpoint
router.get('/programs', (_req, res) => {
  res.json({ success: true, data: UMaTPrograms });
});

router.get('/levels', (_req, res) => {
  res.json({ success: true, data: AcademicLevels });
});

router.get('/halls', (_req, res) => {
  res.json({ success: true, data: UMaTHalls });
});

router.get('/pickup-spots', (_req, res) => {
  res.json({ success: true, data: PickupSpots });
});

router.get('/all', (_req, res) => {
  res.json({
    success: true,
    data: {
      programs: UMaTPrograms,
      levels: AcademicLevels,
      halls: UMaTHalls,
      pickupSpots: PickupSpots,
    },
  });
});

export default router;