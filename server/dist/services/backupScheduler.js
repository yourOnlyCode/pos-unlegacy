"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupScheduler = void 0;
// Auto-backup scheduler (runs daily)
class BackupScheduler {
    constructor() {
        this.intervalId = null;
    }
    static getInstance() {
        if (!BackupScheduler.instance) {
            BackupScheduler.instance = new BackupScheduler();
        }
        return BackupScheduler.instance;
    }
    start() {
        // Run daily at 2 AM
        const runDaily = () => {
            const now = new Date();
            const next2AM = new Date();
            next2AM.setHours(2, 0, 0, 0);
            if (next2AM <= now) {
                next2AM.setDate(next2AM.getDate() + 1);
            }
            const msUntil2AM = next2AM.getTime() - now.getTime();
            setTimeout(() => {
                this.performDailyBackup();
                // Set up next day's backup
                this.intervalId = setInterval(() => {
                    this.performDailyBackup();
                }, 24 * 60 * 60 * 1000); // 24 hours
            }, msUntil2AM);
        };
        runDaily();
        console.log('Backup scheduler started - daily backups at 2 AM');
    }
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    async performDailyBackup() {
        try {
            const { getAllTenants } = require('./tenantService');
            const businesses = getAllTenants();
            console.log(`Starting daily backup for ${businesses.length} businesses`);
            for (const business of businesses) {
                await this.backupBusiness(business.id);
            }
            console.log('Daily backup completed successfully');
        }
        catch (error) {
            console.error('Daily backup failed:', error);
        }
    }
    async backupBusiness(businessId) {
        try {
            // In production, save to cloud storage (AWS S3, Google Cloud, etc.)
            const backupData = {
                businessId,
                timestamp: new Date().toISOString(),
                // Include all business data here
            };
            // Mock storage - replace with actual cloud storage
            console.log(`Backup created for business: ${businessId}`);
            // Optional: Clean up old backups (keep last 30 days)
            await this.cleanupOldBackups(businessId);
        }
        catch (error) {
            console.error(`Backup failed for business ${businessId}:`, error);
        }
    }
    async cleanupOldBackups(businessId) {
        // Remove backups older than 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // In production, delete old files from cloud storage
        console.log(`Cleaned up old backups for ${businessId}`);
    }
}
exports.BackupScheduler = BackupScheduler;
//# sourceMappingURL=backupScheduler.js.map