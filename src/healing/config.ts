export enum HealingMode {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive',
  DISABLED = 'disabled',
}

export interface HealingConfig {
  mode: HealingMode;
  maxRetries: number;
  retryDelayMs: number;
  useExponentialBackoff: boolean;
  enableAIFallback: boolean;
  enableVisualMatching: boolean;
  logHealingAttempts: boolean;
  autoUpdateLocators: boolean;
}

export const DEFAULT_HEALING_CONFIGS: Record<HealingMode, HealingConfig> = {
  [HealingMode.CONSERVATIVE]: {
    mode: HealingMode.CONSERVATIVE,
    maxRetries: 2,
    retryDelayMs: 1000,
    useExponentialBackoff: true,
    enableAIFallback: false,
    enableVisualMatching: false,
    logHealingAttempts: true,
    autoUpdateLocators: false,
  },
  [HealingMode.MODERATE]: {
    mode: HealingMode.MODERATE,
    maxRetries: 3,
    retryDelayMs: 1000,
    useExponentialBackoff: true,
    enableAIFallback: true,
    enableVisualMatching: false,
    logHealingAttempts: true,
    autoUpdateLocators: false,
  },
  [HealingMode.AGGRESSIVE]: {
    mode: HealingMode.AGGRESSIVE,
    maxRetries: 5,
    retryDelayMs: 500,
    useExponentialBackoff: true,
    enableAIFallback: true,
    enableVisualMatching: true,
    logHealingAttempts: true,
    autoUpdateLocators: true,
  },
  [HealingMode.DISABLED]: {
    mode: HealingMode.DISABLED,
    maxRetries: 0,
    retryDelayMs: 0,
    useExponentialBackoff: false,
    enableAIFallback: false,
    enableVisualMatching: false,
    logHealingAttempts: false,
    autoUpdateLocators: false,
  },
};

let currentConfig: HealingConfig = DEFAULT_HEALING_CONFIGS[HealingMode.MODERATE];

export function setHealingConfig(mode: HealingMode): void {
  currentConfig = DEFAULT_HEALING_CONFIGS[mode];
}

export function getHealingConfig(): HealingConfig {
  return currentConfig;
}

export function setCustomHealingConfig(config: Partial<HealingConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}
