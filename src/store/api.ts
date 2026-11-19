import { createAsyncThunk, isAnyOf, type AsyncThunkPayloadCreator } from "@reduxjs/toolkit";
import axiosInstance from "../lib/axiosInstance";
import type { ApiErrorBody } from "./models";

/** Pulls the server's message out of any axios error. */
export const errorMessage = (e: unknown, fallback = "Something went wrong"): string => {
  const body = (e as any)?.response?.data as ApiErrorBody | undefined;
  const extracted = body?.message || body?.error || (e as any)?.message || fallback;
  console.log("[errorMessage] Extracted:", { body, fallback, extracted });
  return extracted;
};

/** createAsyncThunk where failures always become a string payload (`rejectValue`). */
export const apiThunk = <Returned, Arg = void>(
  type: string,
  run: (arg: Arg, api: typeof axiosInstance) => Promise<Returned>
) =>
  createAsyncThunk<Returned, Arg, { rejectValue: string }>(type, async (arg, { rejectWithValue }) => {
    console.log(`[apiThunk:${type}] Start with arg:`, arg);
    try {
      const result = await run(arg, axiosInstance);
      console.log(`[apiThunk:${type}] Fulfilled result:`, result);
      return result;
    } catch (e) {
      const msg = errorMessage(e);
      console.error(`[apiThunk:${type}] Rejected with:`, msg, e);
      return rejectWithValue(msg);
    }
  });

/** Standard async status for a slice. */
export type Status = "idle" | "loading" | "succeeded" | "failed";

export interface AsyncSlice {
  status: Status;
  error: string | null;
}
export const idle: AsyncSlice = { status: "idle", error: null };

export type { AsyncThunkPayloadCreator };

/**
 * Marks a slice loading/failed/succeeded for a set of thunks (keeps slices short).
 * Uses matchers, so it must be the LAST call in `extraReducers` (RTK requires addCase before addMatcher).
 */
export const trackStatus = (builder: any, thunks: any[]) => {
  builder.addMatcher(isAnyOf(...thunks.map((t) => t.pending)), (s: any, a: any) => {
    console.log("[trackStatus] Pending:", a.type);
    s.status = "loading";
    s.error = null;
  });
  builder.addMatcher(isAnyOf(...thunks.map((t) => t.fulfilled)), (s: any, a: any) => {
    console.log("[trackStatus] Fulfilled:", a.type);
    s.status = "succeeded";
  });
  builder.addMatcher(isAnyOf(...thunks.map((t) => t.rejected)), (s: any, a: any) => {
    console.error("[trackStatus] Rejected:", a.type, "payload:", a.payload);
    s.status = "failed";
    s.error = a.payload ?? a.error?.message ?? "Request failed";
  });
};