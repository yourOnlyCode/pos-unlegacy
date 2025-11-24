"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const payments_1 = __importDefault(require("./routes/payments"));
const sms_1 = __importDefault(require("./routes/sms"));
const admin_1 = __importDefault(require("./routes/admin"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const connect_1 = __importDefault(require("./routes/connect"));
const export_1 = __importDefault(require("./routes/export"));
const backupScheduler_1 = require("./services/backupScheduler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true })); // For Twilio webhooks
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'POS Server is running' });
});
app.use('/api/payments', payments_1.default);
app.use('/api/sms', sms_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/webhooks', webhooks_1.default);
app.use('/api/connect', connect_1.default);
app.use('/api/export', export_1.default);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Start automatic backup scheduler
    backupScheduler_1.BackupScheduler.getInstance().start();
});
//# sourceMappingURL=index.js.map