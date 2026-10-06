/**
 * Safe monetary helpers for FleetTrack (Bangladeshi Taka - BDT / ৳)
 *
 * Money is stored internally in integer minor units (Paisa):
 * 1 BDT (৳) = 100 Paisa.
 * E.g. ৳200,000 is stored as BigInt(20000000) or number in minor units.
 */

export type BudgetStatusLevel =
  | "HEALTHY"
  | "MODERATE"
  | "APPROACHING_LIMIT"
  | "CRITICAL"
  | "EXCEEDED";

export interface BudgetMetrics {
  allocatedPaisa: bigint;
  spentPaisa: bigint;
  pendingPaisa: bigint;
  committedPaisa: bigint;
  availablePaisa: bigint;
  spentPercentage: number;
  committedPercentage: number;
  statusLevel: BudgetStatusLevel;
  statusLabel: string;
  isOverBudget: boolean;
}

/**
 * Format paisa (BigInt or number) into standard BDT currency string
 * e.g., 20000000n -> "৳200,000" or with decimals if any remainder
 */
export function formatBDT(
  amountInPaisa: bigint | number | null | undefined,
  options: { includeDecimals?: boolean; compact?: boolean } = {}
): string {
  if (amountInPaisa === null || amountInPaisa === undefined) {
    return "৳0";
  }

  const paisaBig = typeof amountInPaisa === "bigint" ? amountInPaisa : BigInt(Math.round(amountInPaisa));
  const isNegative = paisaBig < BigInt(0);
  const absPaisa = isNegative ? -paisaBig : paisaBig;

  const taka = Number(absPaisa / BigInt(100));
  const remainderPaisa = Number(absPaisa % BigInt(100));

  if (options.compact && taka >= 10000000) {
    // Crore formatting
    const crore = (taka / 10000000).toFixed(2);
    return `${isNegative ? "-" : ""}৳${crore} Cr`;
  } else if (options.compact && taka >= 100000) {
    // Lakh formatting
    const lakh = (taka / 100000).toFixed(1);
    return `${isNegative ? "-" : ""}৳${lakh} L`;
  }

  // International/Standard comma grouped formatting
  const formattedTaka = taka.toLocaleString("en-BD");

  if (options.includeDecimals && remainderPaisa > 0) {
    const decimalStr = remainderPaisa.toString().padStart(2, "0");
    return `${isNegative ? "-" : ""}৳${formattedTaka}.${decimalStr}`;
  }

  return `${isNegative ? "-" : ""}৳${formattedTaka}`;
}

/**
 * Convert BDT whole units (e.g., from an input box "250000") to Paisa (BigInt)
 */
export function bdtToPaisa(bdtAmount: number | string): bigint {
  const num = typeof bdtAmount === "string" ? parseFloat(bdtAmount) : bdtAmount;
  if (isNaN(num)) return BigInt(0);
  return BigInt(Math.round(num * 100));
}

/**
 * Convert Paisa (BigInt or number) to whole BDT number for charts/inputs
 */
export function paisaToBDT(paisa: bigint | number): number {
  if (typeof paisa === "bigint") {
    return Number(paisa) / 100;
  }
  return paisa / 100;
}

/**
 * Authoritative server-side budget metrics calculation
 */
export function calculateBudgetMetrics(
  allocatedPaisa: bigint | number,
  spentPaisa: bigint | number,
  pendingPaisa: bigint | number
): BudgetMetrics {
  const allocated = typeof allocatedPaisa === "bigint" ? allocatedPaisa : BigInt(allocatedPaisa);
  const spent = typeof spentPaisa === "bigint" ? spentPaisa : BigInt(spentPaisa);
  const pending = typeof pendingPaisa === "bigint" ? pendingPaisa : BigInt(pendingPaisa);

  const committed = spent + pending;
  const available = allocated - committed;
  const isOverBudget = committed > allocated;

  const allocatedNum = Number(allocated);
  const spentNum = Number(spent);
  const committedNum = Number(committed);

  let spentPercentage = 0;
  let committedPercentage = 0;

  if (allocatedNum > 0) {
    spentPercentage = Math.round((spentNum / allocatedNum) * 1000) / 10;
    committedPercentage = Math.round((committedNum / allocatedNum) * 1000) / 10;
  }

  let statusLevel: BudgetStatusLevel = "HEALTHY";
  let statusLabel = "Healthy (0-60%)";

  if (committedPercentage > 100) {
    statusLevel = "EXCEEDED";
    statusLabel = "Exceeded Limit (>100%)";
  } else if (committedPercentage >= 95) {
    statusLevel = "CRITICAL";
    statusLabel = "Critical (95-100%)";
  } else if (committedPercentage >= 80) {
    statusLevel = "APPROACHING_LIMIT";
    statusLabel = "Approaching Limit (80-95%)";
  } else if (committedPercentage >= 60) {
    statusLevel = "MODERATE";
    statusLabel = "Moderate (60-80%)";
  }

  return {
    allocatedPaisa: allocated,
    spentPaisa: spent,
    pendingPaisa: pending,
    committedPaisa: committed,
    availablePaisa: available,
    spentPercentage,
    committedPercentage,
    statusLevel,
    statusLabel,
    isOverBudget,
  };
}

export function getStatusTheme(statusLevel: BudgetStatusLevel) {
  switch (statusLevel) {
    case "HEALTHY":
      return {
        badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
        progressBar: "bg-emerald-500",
        ringColor: "#10b981",
        label: "Healthy",
      };
    case "MODERATE":
      return {
        badgeBg: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
        progressBar: "bg-blue-500",
        ringColor: "#3b82f6",
        label: "Moderate",
      };
    case "APPROACHING_LIMIT":
      return {
        badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
        progressBar: "bg-amber-500",
        ringColor: "#f59e0b",
        label: "Approaching Limit",
      };
    case "CRITICAL":
      return {
        badgeBg: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
        progressBar: "bg-orange-500",
        ringColor: "#f97316",
        label: "Critical",
      };
    case "EXCEEDED":
      return {
        badgeBg: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
        progressBar: "bg-rose-500",
        ringColor: "#ef4444",
        label: "Exceeded",
      };
  }
}
