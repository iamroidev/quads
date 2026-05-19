import Payout from '../models/Payout';
import payoutService from './payout.service';
import User from '../models/User';

class AutoPayoutService {
  private processing = false;

  /**
   * Automatically process all pending payouts that are eligible.
   * This runs as a cron job and processes payouts for sellers
   * who have completed their payout setup.
   * 
   * Returns a summary of results.
   */
  async processAllPendingPayouts(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    skipped: number;
    details: { payoutId: string; sellerName: string; status: string; reason?: string }[];
  }> {
    if (this.processing) {
      return { processed: 0, succeeded: 0, failed: 0, skipped: 0, details: [] };
    }

    this.processing = true;
    const details: { payoutId: string; sellerName: string; status: string; reason?: string }[] = [];
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    try {
      // Get all pending payouts with populated seller info
      // CRITICAL: Only process if the associated order is 'completed'
      const pendingPayouts = await Payout.find({ status: 'pending' })
        .populate({
          path: 'order',
          match: { status: 'completed' },
          select: 'status'
        })
        .populate('seller', 'name email sellerOnboarding');

      // Filter out payouts where the order wasn't completed (populate returns null for match failure)
      const eligiblePayouts = pendingPayouts.filter(p => p.order !== null);

      for (const payout of eligiblePayouts) {
        const seller = payout.seller as any;

        // Skip if seller hasn't completed payout setup
        if (!seller?.sellerOnboarding?.payoutSetupComplete) {
          skipped++;
          details.push({
            payoutId: payout._id.toString(),
            sellerName: seller?.name || 'Unknown',
            status: 'skipped',
            reason: 'Seller has not completed payout setup',
          });
          continue;
        }

        // Try to process the payout
        try {
          // We need an admin user reference for the audit trail.
          // Use a system admin placeholder ID or find an admin.
          // Since this is automated, find any admin user to use as "processedBy"
          const admin = await User.findOne({ roles: 'admin' }).select('_id');
          if (!admin) {
            console.error('[AutoPayout] No admin user found in system - cannot process payout', payout._id.toString());
            failed++;
            details.push({
              payoutId: payout._id.toString(),
              sellerName: seller?.name || 'Unknown',
              status: 'failed',
              reason: 'No admin user found in system',
            });
            continue;
          }

          const result = await payoutService.processPayout(
            payout._id.toString(),
            admin._id.toString()
          );

          if (result.status === 'completed' || result.status === 'processing') {
            succeeded++;
            details.push({
              payoutId: payout._id.toString(),
              sellerName: seller?.name || 'Unknown',
              status: result.status,
            });
          } else {
            failed++;
            details.push({
              payoutId: payout._id.toString(),
              sellerName: seller?.name || 'Unknown',
              status: 'failed',
              reason: 'Payout returned unexpected status',
            });
          }
        } catch (error: any) {
          failed++;
          details.push({
            payoutId: payout._id.toString(),
            sellerName: seller?.name || 'Unknown',
            status: 'failed',
            reason: error.message || 'Processing error',
          });
        }
      }

      return {
        processed: eligiblePayouts.length,
        succeeded,
        failed,
        skipped,
        details,
      };
    } finally {
      this.processing = false;
    }
  }

  /**
   * Verify all processing payouts to check if they've completed
   */
  async verifyProcessingPayouts(): Promise<{
    verified: number;
    completed: number;
    failed: number;
    details: { payoutId: string; status: string }[];
  }> {
    const processingPayouts = await Payout.find({ status: 'processing' });
    let completed = 0;
    let failed = 0;
    const details: { payoutId: string; status: string }[] = [];

    for (const payout of processingPayouts) {
      try {
        const result = await payoutService.verifyPayoutStatus(payout._id.toString());
        if (result.status === 'completed') {
          completed++;
          details.push({ payoutId: payout._id.toString(), status: 'completed' });
        } else if (result.status === 'failed') {
          failed++;
          details.push({ payoutId: payout._id.toString(), status: 'failed' });
        } else {
          details.push({ payoutId: payout._id.toString(), status: result.status });
        }
      } catch {
        details.push({ payoutId: payout._id.toString(), status: 'error' });
      }
    }

    return {
      verified: processingPayouts.length,
      completed,
      failed,
      details,
    };
  }
}

export default new AutoPayoutService();