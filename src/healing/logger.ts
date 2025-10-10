import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logsDir = path.join(process.cwd(), 'healing-logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export interface HealingEvent {
  timestamp: string;
  originalStrategy: string;
  originalSelector: string;
  failureReason: string;
  healingAttempt: number;
  healingStrategy: string;
  healingSelector?: string;
  success: boolean;
  timeTakenMs: number;
  aiUsed: boolean;
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'healing-errors.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'healing-events.log'),
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export class HealingLogger {
  private static healingHistory: HealingEvent[] = [];

  static logHealingAttempt(event: HealingEvent): void {
    logger.info('Healing attempt', event);
    this.healingHistory.push(event);
  }

  static logHealingSuccess(event: HealingEvent): void {
    logger.info('✓ Healing successful', event);
  }

  static logHealingFailure(event: HealingEvent): void {
    logger.error('✗ Healing failed', event);
  }

  static getHealingHistory(): HealingEvent[] {
    return this.healingHistory;
  }

  static getSuccessRate(): number {
    if (this.healingHistory.length === 0) return 0;
    const successful = this.healingHistory.filter(e => e.success).length;
    return (successful / this.healingHistory.length) * 100;
  }

  static clearHistory(): void {
    this.healingHistory = [];
  }

  static generateReport(): string {
    const total = this.healingHistory.length;
    const successful = this.healingHistory.filter(e => e.success).length;
    const successRate = this.getSuccessRate();
    const avgTimeMs =
      this.healingHistory.reduce((acc, e) => acc + e.timeTakenMs, 0) / total || 0;
    const aiUsedCount = this.healingHistory.filter(e => e.aiUsed).length;

    return `
Healing Report:
===============
Total Healing Attempts: ${total}
Successful: ${successful}
Failed: ${total - successful}
Success Rate: ${successRate.toFixed(2)}%
Average Healing Time: ${avgTimeMs.toFixed(2)}ms
AI Assistance Used: ${aiUsedCount} times
`;
  }
}

export default logger;
