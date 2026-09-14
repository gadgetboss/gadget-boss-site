/**
 * Browser IIFE entry — attaches API on window.GadgetBossSync
 * so the existing Babel POS and vanilla storefront can call it.
 */
import * as Sync from './index';

declare global {
  interface Window {
    GadgetBossSync: typeof Sync;
    __GADGETBOSS_ENV__?: Record<string, string>;
  }
}

if (typeof window !== 'undefined') {
  window.GadgetBossSync = Sync;
}

export default Sync;
