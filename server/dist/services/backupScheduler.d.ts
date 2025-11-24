export declare class BackupScheduler {
    private static instance;
    private intervalId;
    static getInstance(): BackupScheduler;
    start(): void;
    stop(): void;
    private performDailyBackup;
    private backupBusiness;
    private cleanupOldBackups;
}
//# sourceMappingURL=backupScheduler.d.ts.map