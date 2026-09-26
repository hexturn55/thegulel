import { Platform } from 'react-native';
import Purchases, {
  INTRO_ELIGIBILITY_STATUS,
  PACKAGE_TYPE,
  PRODUCT_CATEGORY,
  type CustomerInfo,
  type PurchasesIntroPrice,
  type PurchasesPackage,
} from 'react-native-purchases';
import { config } from './config';

/**
 * In-app purchases via RevenueCat (native iOS/Android).
 *
 * Apple App Store and Google Play REQUIRE their native IAP for digital goods
 * (coins, VIP). Stripe/Razorpay (web) are not permitted in-app on iOS.
 * After a successful purchase, the RevenueCat server-to-server webhook
 * (/api/webhooks/revenuecat) credits coins / grants VIP; the app then refetches
 * /api/auth/me to reflect the new balance.
 *
 * Every export here is safe to call when RevenueCat is not configured (no SDK
 * key for this platform): nothing throws, and callers get an 'unconfigured'
 * status they can render as "temporarily unavailable".
 *
 * A `.web.ts` sibling provides no-op stubs so the web bundle never imports the
 * native module.
 */

/** RevenueCat entitlement identifier that represents VIP. */
const VIP_ENTITLEMENT = 'vip';
/** RevenueCat offering identifier that holds the VIP subscription plans. */
const VIP_OFFERING = 'vip';
/** Store product id prefix for VIP subscriptions. */
const VIP_PRODUCT_PREFIX = 'com.gulel.vip.';

export interface CoinOffering {
  id: string;
  title: string;
  description: string;
  /** Localized store price (StoreKit / Play Billing), e.g. "₹99.00". */
  priceString: string;
  pkg: PurchasesPackage;
}

export interface VipOffering {
  id: string;
  title: string;
  /** Localized store price (StoreKit / Play Billing) per period. */
  priceString: string;
  /** Human billing period: 'week', 'month', '3 months', 'year', … */
  periodLabel: string;
  /** Intro / free-trial description when one applies, else null. */
  introText: string | null;
  pkg: PurchasesPackage;
}

export type StoreOfferings = {
  status: 'ok' | 'unconfigured' | 'error';
  coins: CoinOffering[];
  vip: VipOffering[];
};

export interface PurchaseResult {
  /** false when the user cancelled the store sheet. */
  completed: boolean;
  customerInfo?: CustomerInfo;
}

function getApiKey(): string {
  return Platform.OS === 'ios' ? config.revenueCatIosKey : config.revenueCatAndroidKey;
}

/** Whether this build has a RevenueCat SDK key for the current platform. */
export function isPurchasesConfigurable(): boolean {
  return getApiKey() !== '';
}

// ---------------------------------------------------------------------------
// Configuration / identity (serialized so concurrent callers never race
// configure() against logIn()/logOut()).
// ---------------------------------------------------------------------------

let configured = false;
/** The app user id RevenueCat is currently identified as (null = anonymous). */
let currentUserId: string | null = null;
let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

let warnedNoKey = false;

/**
 * Make sure RevenueCat is configured and identified as `appUserId`.
 * Idempotent and cheap when already in that state. Never rejects; returns
 * false when purchases can't be used (no key, or configure/logIn failed).
 */
export function ensurePurchasesConfigured(appUserId: string): Promise<boolean> {
  return serialize(async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      if (!warnedNoKey) {
        warnedNoKey = true;
        console.warn('[purchases] RevenueCat key not configured; IAP unavailable.');
      }
      return false;
    }
    try {
      if (!configured) {
        Purchases.configure({ apiKey, appUserID: appUserId });
        configured = true;
        currentUserId = appUserId;
      } else if (currentUserId !== appUserId) {
        await Purchases.logIn(appUserId);
        currentUserId = appUserId;
      }
      return true;
    } catch (e) {
      console.warn('[purchases] configure/logIn failed', e);
      return false;
    }
  });
}

/**
 * Identify the signed-in user to RevenueCat so purchases attach to this
 * account. Called by lib/auth.tsx after loading the user. Never rejects.
 */
export async function initPurchases(appUserId?: string): Promise<void> {
  if (appUserId) await ensurePurchasesConfigured(appUserId);
}

/** Forget the RevenueCat identity on sign-out. Never rejects. */
export function logOutPurchases(): Promise<void> {
  return serialize(async () => {
    if (configured && currentUserId !== null) {
      try {
        await Purchases.logOut();
      } catch {
        // already anonymous / offline — nothing to undo
      }
    }
    currentUserId = null;
  });
}

// ---------------------------------------------------------------------------
// Offerings
// ---------------------------------------------------------------------------

const PERIOD_LABELS: Record<string, string> = {
  P1W: 'week',
  P7D: 'week',
  P1M: 'month',
  P2M: '2 months',
  P3M: '3 months',
  P6M: '6 months',
  P1Y: 'year',
  P12M: 'year',
};

const PACKAGE_TYPE_LABELS: Partial<Record<PACKAGE_TYPE, string>> = {
  [PACKAGE_TYPE.WEEKLY]: 'week',
  [PACKAGE_TYPE.MONTHLY]: 'month',
  [PACKAGE_TYPE.TWO_MONTH]: '2 months',
  [PACKAGE_TYPE.THREE_MONTH]: '3 months',
  [PACKAGE_TYPE.SIX_MONTH]: '6 months',
  [PACKAGE_TYPE.ANNUAL]: 'year',
  [PACKAGE_TYPE.LIFETIME]: 'lifetime',
};

const UNIT_NAMES: Record<string, string> = { D: 'day', W: 'week', M: 'month', Y: 'year' };

function plural(n: number, unit: string): string {
  return n === 1 ? unit : `${n} ${unit}s`;
}

/** 'P1M' -> 'month', 'P3M' -> '3 months', else derived from the package type. */
function periodLabelFor(pkg: PurchasesPackage): string {
  const iso = pkg.product.subscriptionPeriod;
  if (iso) {
    if (PERIOD_LABELS[iso]) return PERIOD_LABELS[iso];
    const m = /^P(\d+)([DWMY])$/.exec(iso);
    if (m) return plural(Number(m[1]), UNIT_NAMES[m[2]]);
  }
  return PACKAGE_TYPE_LABELS[pkg.packageType] ?? 'period';
}

function introTextFor(
  intro: PurchasesIntroPrice | null,
  priceString: string,
  periodLabel: string,
): string | null {
  if (!intro) return null;
  const unit = intro.periodUnit.toLowerCase();
  const cycles = Math.max(intro.cycles, 1);
  const then = `then ${priceString} / ${periodLabel}`;
  if (intro.price === 0) {
    return `Free for ${plural(intro.periodNumberOfUnits * cycles, unit)}, ${then}`;
  }
  if (cycles === 1) {
    return `${intro.priceString} for the first ${plural(intro.periodNumberOfUnits, unit)}, ${then}`;
  }
  return `${intro.priceString} / ${plural(intro.periodNumberOfUnits, unit)} for the first ${cycles} periods, ${then}`;
}

/** Play appends the app name to product titles ("100 Coins (Gulel)"); drop it. */
function cleanTitle(title: string): string {
  return Platform.OS === 'android' ? title.replace(/\s*\([^()]*\)\s*$/, '') : title;
}

function isVipPackage(p: PurchasesPackage): boolean {
  return (
    p.product.productCategory === PRODUCT_CATEGORY.SUBSCRIPTION ||
    p.product.identifier.startsWith(VIP_PRODUCT_PREFIX) ||
    p.identifier.startsWith(VIP_PRODUCT_PREFIX)
  );
}

/**
 * iOS only: product ids whose intro offer the user is NOT known to be eligible
 * for. Apple shows the full price to ineligible users, so advertising the
 * intro price to them would be misleading. (Play only returns offers the user
 * is eligible for, so Android needs no check.)
 */
async function ineligibleIntroProductIds(pkgs: PurchasesPackage[]): Promise<Set<string>> {
  const ids = pkgs.filter((p) => p.product.introPrice).map((p) => p.product.identifier);
  const hidden = new Set<string>();
  if (Platform.OS !== 'ios' || ids.length === 0) return hidden;
  try {
    const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility(ids);
    for (const id of ids) {
      if (
        eligibility[id]?.status !== INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE
      ) {
        hidden.add(id);
      }
    }
  } catch {
    ids.forEach((id) => hidden.add(id));
  }
  return hidden;
}

/**
 * Coin packs and VIP plans from RevenueCat with localized store prices.
 * Never rejects: 'unconfigured' when there is no SDK key, 'error' when the
 * store/RevenueCat could not be reached.
 */
export async function getStoreOfferings(appUserId: string): Promise<StoreOfferings> {
  if (!isPurchasesConfigurable()) return { status: 'unconfigured', coins: [], vip: [] };
  if (!(await ensurePurchasesConfigured(appUserId))) {
    return { status: 'error', coins: [], vip: [] };
  }
  try {
    const offerings = await Purchases.getOfferings();
    const currentPkgs = offerings.current?.availablePackages ?? [];

    const coins: CoinOffering[] = currentPkgs
      .filter((p) => !isVipPackage(p))
      .map((p) => ({
        id: p.identifier,
        title: cleanTitle(p.product.title),
        description: p.product.description,
        priceString: p.product.priceString,
        pkg: p,
      }));

    const vipOfferingPkgs = offerings.all[VIP_OFFERING]?.availablePackages ?? [];
    const vipPkgs =
      vipOfferingPkgs.length > 0 ? vipOfferingPkgs : currentPkgs.filter(isVipPackage);
    const noIntro = await ineligibleIntroProductIds(vipPkgs);

    const vip: VipOffering[] = vipPkgs.map((p) => {
      const periodLabel = periodLabelFor(p);
      return {
        id: p.identifier,
        title: cleanTitle(p.product.title),
        priceString: p.product.priceString,
        periodLabel,
        introText: noIntro.has(p.product.identifier)
          ? null
          : introTextFor(p.product.introPrice, p.product.priceString, periodLabel),
        pkg: p,
      };
    });

    return { status: 'ok', coins, vip };
  } catch (e) {
    console.warn('[purchases] getOfferings failed', e);
    return { status: 'error', coins: [], vip: [] };
  }
}

// ---------------------------------------------------------------------------
// Purchase / restore
// ---------------------------------------------------------------------------

/**
 * Run the native purchase flow for a coin pack or VIP plan. Resolves
 * `{completed: false}` if the user cancelled; rejects on real store errors.
 * (Coins are consumables and grant no entitlement, so success is keyed on
 * completion; VIP callers can inspect `customerInfo`.)
 */
export async function purchaseOffering(
  offering: CoinOffering | VipOffering,
): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(offering.pkg);
    return { completed: true, customerInfo };
  } catch (e) {
    if ((e as { userCancelled?: boolean | null }).userCancelled) return { completed: false };
    throw e;
  }
}

/** Whether the given customer info has an active VIP entitlement. */
export function hasActiveVip(customerInfo: CustomerInfo | null | undefined): boolean {
  return Boolean(customerInfo?.entitlements.active[VIP_ENTITLEMENT]);
}

/**
 * Restore previous store purchases (required by App Review). Resolves true
 * when VIP is active afterwards. Rejects if the store could not be reached or
 * purchases are unavailable in this build.
 */
export async function restorePurchases(): Promise<boolean> {
  await queue; // let any in-flight configure/logIn settle first
  if (!configured) throw new Error('Purchases are not available right now.');
  const customerInfo = await Purchases.restorePurchases();
  return hasActiveVip(customerInfo);
}
