import autoPayoutService from './autoPayout.service';

let intervalHandle: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * Start the auto-payout scheduler that runs every N minutes.
 * @param intervalMinutes - How often to check and process pending payouts (default: 15)
 */
export function startPayoutScheduler(intervalMinutes: number = 15): void {
  if (isRunning) return;
  isRunning = true;

  console.log(`[PayoutScheduler] Started — running every ${intervalMinutes} minutes`);

  // Run immediately on start
  runPayoutCycle();

  // Then run on interval
  intervalHandle = setInterval(runPayoutCycle, intervalMinutes * 60 * 1000);
}

/**
 * Stop the scheduler
 */
export function stopPayoutScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  isRunning = false;
  console.log('[PayoutScheduler] Stopped');
}

/**
 * Run one full payout cycle: process pending + verify processing
 */
async function runPayoutCycle(): Promise<void> {
  try {
    console.log('[PayoutScheduler] Running payout cycle...');

    // Step 1: Process pending payouts
    const processResult = await autoPayoutService.processAllPendingPayouts();
    if (processResult.processed > 0) {
      console.log(
        `[PayoutScheduler] Processed ${processResult.processed} payouts: ` +
        `${processResult.succeeded} succeeded, ${processResult.failed} failed, ${processResult.skipped} skipped`
      );
    }

    // Step 2: Verify processing payouts
    const verifyResult = await autoPayoutService.verifyProcessingPayouts();
    if (verifyResult.verified > 0) {
      console.log(
        `[PayoutScheduler] Verified ${verifyResult.verified} payouts: ` +
        `${verifyResult.completed} completed, ${verifyResult.failed} failed`
      );
    }
  } catch (error) {
    console.error('[PayoutScheduler] Error during payout cycle:', error);
  }
}