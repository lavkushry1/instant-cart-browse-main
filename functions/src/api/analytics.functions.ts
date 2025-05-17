// functions/src/api/analytics.functions.ts

import * as functions from 'firebase-functions/v1';
import { getDashboardDataBE } from '../services/analyticsServiceBE';
import type { TimePeriod } from '../services/analyticsServiceBE'; // Import type

// Helper to ensure the user is an admin
const ensureAdmin = (context: functions.https.CallableContext): string => {
  if (!context.auth || !context.auth.token.admin) { 
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin to perform this action.');
  }
  return context.auth.uid;
};

console.log("(Cloud Functions) analytics.functions.ts: Initializing...");

interface GetDashboardDataPayload {
    timePeriod: TimePeriod;
    customRange?: { startDate: string; endDate: string }; // Expect ISO date strings from client
}

export const getDashboardDataCF = functions.https.onCall(async (data: GetDashboardDataPayload, context) => {
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
    const dashboardData = await getDashboardDataBE(data.timePeriod, customRangeJS);
    return { success: true, data: dashboardData };
  } catch (error: unknown) {
    console.error("Error in getDashboardDataCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
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