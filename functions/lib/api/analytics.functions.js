"use strict";
// functions/src/api/analytics.functions.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardDataCF = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const analyticsServiceBE_1 = require("../services/analyticsServiceBE");
// Helper to ensure the user is an admin
const ensureAdmin = (context) => {
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'User must be an admin to perform this action.');
    }
    return context.auth.uid;
};
console.log("(Cloud Functions) analytics.functions.ts: Initializing...");
exports.getDashboardDataCF = functions.https.onCall(async (data, context) => {
    ensureAdmin(context);
    console.log("(Cloud Function) getDashboardDataCF called with period:", data.timePeriod, "customRange:", data.customRange);
    try {
        let customRangeJS;
        if (data.customRange && data.customRange.startDate && data.customRange.endDate) {
            customRangeJS = {
                startDate: new Date(data.customRange.startDate),
                endDate: new Date(data.customRange.endDate)
            };
        }
        const dashboardData = await (0, analyticsServiceBE_1.getDashboardDataBE)(data.timePeriod, customRangeJS);
        return { success: true, data: dashboardData };
    }
    catch (error) {
        console.error("Error in getDashboardDataCF:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'Failed to get dashboard data.';
        throw new functions.https.HttpsError('internal', message, error instanceof Error ? error.stack : undefined);
    }
});
/* TODO: Implement getDashboardDataCF
export const getDashboardDataCF = functions.https.onCall(async (data: { timePeriod: TimePeriod, customRange?: DateRange }, context) => {
  ensureAdmin(context);
  console.log("(Cloud Function) getDashboardDataCF called with period:", data.timePeriod, "customRange:", data.customRange);
  try {
    // const dashboardData = await getDashboardDataBE(data.timePeriod, data.customRange);
    // return { success: true, data: dashboardData };
    return { success: true, data: { message: "TODO: Implement analytics-getDashboardDataCF" } }; // Placeholder
  } catch (error: unknown) {
    console.error("Error in getDashboardDataCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to get dashboard data.';
    throw new functions.https.HttpsError('internal', message);
  }
});
*/ 
//# sourceMappingURL=analytics.functions.js.map