/**
 * Unified Redis BullMQ Queue Interface
 * Delegates directly to canonical campaignQueue module to eliminate architectural drift.
 */
export {
  getCampaignQueue,
  enqueueCampaignJob,
  manageCampaignState,
  type EnqueueCampaignOptions,
} from './campaignQueue';
