/**
 * Feature switches (env-driven so they can be turned on without a code change).
 *
 * Hardware-store quote requests are OFF until real store email addresses are
 * loaded in Admin → Hardware Stores. Set NEXT_PUBLIC_HARDWARE_QUOTES_ENABLED=true
 * (and redeploy) to re-enable the "BOQ + Hardware Store Quotes" service.
 */
export const HARDWARE_QUOTES_ENABLED = process.env.NEXT_PUBLIC_HARDWARE_QUOTES_ENABLED === 'true'
