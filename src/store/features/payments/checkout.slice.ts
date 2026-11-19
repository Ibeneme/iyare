import { createSlice } from "@reduxjs/toolkit";
import { apiThunk, idle, trackStatus, type AsyncSlice } from "../../api";
import type { CheckoutRequest, CheckoutResponse, LessonFee } from "../../models";

export interface CheckoutPayload extends CheckoutRequest {
  pricingId?: string;
  planKey?: string;
  planId?: string;
}

/** POST /api/payment/yare/pay/pay-lesson-fee: the server prices the basket from the Pricing table. */
export const startCheckout = apiThunk<CheckoutResponse, CheckoutPayload>(
  "checkout/start",
  async (b, api) => {
    const resolvedPlanId = b.pricingId || b.planId;
    return (
      await api.post("/api/payment/yare/pay/pay-lesson-fee", {
        ...b,
        ...(resolvedPlanId && {
          pricingId: resolvedPlanId,
          planId: resolvedPlanId,
        }),
        ...(b.planKey && { planKey: b.planKey }),
      })
    ).data;
  }
);

/** GET .../verify-lesson-fee/:reference: server re-checks with Paystack (the webhook does the same). */
export const verifyCheckout = apiThunk<{ payments: LessonFee[] }, string>(
  "checkout/verify",
  async (ref, api) =>
    (
      await api.get(
        `/api/payment/yare/pay/verify-lesson-fee/${encodeURIComponent(ref)}`
      )
    ).data
);

interface State extends AsyncSlice {
  current: CheckoutResponse | null;
  verified: LessonFee[];
}

const slice = createSlice({
  name: "checkout",
  initialState: { ...idle, current: null, verified: [] } as State,
  reducers: {
    resetCheckout: () => ({ ...idle, current: null, verified: [] }),
  },
  extraReducers: (b) => {
    b.addCase(startCheckout.fulfilled, (s, a) => {
      s.current = a.payload;
    });
    b.addCase(verifyCheckout.fulfilled, (s, a) => {
      s.verified = a.payload.payments;
    });
    trackStatus(b, [startCheckout, verifyCheckout]);
  },
});

export const { resetCheckout } = slice.actions;
export default slice.reducer;