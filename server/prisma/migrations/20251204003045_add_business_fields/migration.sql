-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "inventory" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "posIntegration" JSONB NOT NULL DEFAULT '{"provider":"none","enabled":false}',
ADD COLUMN     "settings" JSONB NOT NULL DEFAULT '{"currency":"USD","timezone":"America/New_York","autoReply":true,"checkInEnabled":true,"checkInTimerMinutes":15}';
