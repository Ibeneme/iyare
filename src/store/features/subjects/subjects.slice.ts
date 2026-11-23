import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "../../../lib/axiosInstance";

export interface Teacher {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
}

export interface StudentDetail {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  subjects?: string[];
  subjectsCount?: number;
  isSubscribed?: boolean;
  gradeId?: string;
  gradeTitle?: string;
  createdAt?: string;
}

export interface ClassRecording {
  _id?: string;
  url: string;
  fileName?: string;
  mimeType?: string;
  durationSec?: number;
  recordedBy?: string;
  recordedAt?: string;
}

export interface GradeSummary {
  _id: string;
  title: string;
  description?: string;
}

export interface SubjectClassItem {
  _id: string;
  title?: string;
  name?: string;
  gradeLevel?: string;
  date?: string;
  time?: string;
  duration?: number;
  status?: string;
  schedules?: unknown[];
  studentIds?: Array<string | StudentDetail>;
  students?: Array<string | StudentDetail>;
  recordings?: ClassRecording[];
  assignedStudents?: StudentDetail[];
  teacherId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  };
}

export interface Subject {
  _id: string;
  name?: string;
  code?: string;
  description?: string;
  gradeLevel: string | GradeSummary[];
  grades?: GradeSummary[];
  isActive: boolean;
  teachers: Teacher[];
  children: StudentDetail[];
  students?: StudentDetail[];
  classes: SubjectClassItem[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
  gradeLevelTitle?: unknown;
  gradeLevelId?: unknown;
}

export interface SubjectMembersPayload {
  subjectId: string;
  teacherIds?: string[];
  studentIds?: string[];
  action?: "add" | "remove";
}

interface SubjectState {
  subjects: Subject[];
  currentSubject: Subject | null;
  loading: boolean;
  error: string | null;
}

const initialState: SubjectState = {
  subjects: [],
  currentSubject: null,
  loading: false,
  error: null,
};

const log = (
  type: "REQ" | "RES" | "ERR",
  action: string,
  data?: unknown,
) => {
  const now = new Date().toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
  const prefix = `[${now}] [NG] SUBJECT SLICE`;
  const color =
    type === "REQ" ? "\x1b[36m" : type === "RES" ? "\x1b[32m" : "\x1b[31m";
  const reset = "\x1b[0m";

  console.log(`${color}${prefix} [${type}] ${action}${reset}`, data || "");
};

export const fetchSubjects = createAsyncThunk<
  Subject[],
  void,
  { rejectValue: string }
>("subject/fetchAll", async (_, { rejectWithValue }) => {
  log("REQ", "Fetching all subjects");
  try {
    const response = await axiosInstance.get("/api/subject/token");
    const items: Subject[] = Array.isArray(response.data?.data)
      ? response.data.data
      : [];
    log("RES", "Fetched subjects", { count: items.length });
    return items;
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string }; status?: number }; message?: string };
    const msg = e.response?.data?.message || e.message || "Network error";
    log("ERR", "Failed to fetch subjects", {
      error: msg,
      status: e.response?.status,
    });
    return rejectWithValue(msg);
  }
});

export const fetchSubjectById = createAsyncThunk<
  Subject,
  string,
  { rejectValue: string }
>("subject/fetchById", async (id: string, { rejectWithValue }) => {
  log("REQ", `Fetching subject by ID: ${id}`);
  try {
    const response = await axiosInstance.get(`/api/subject/${id}`);
    const data: Subject = response.data.data;
    log("RES", `Fetched subject: ${data.name || data.code || id}`, { id });
    return data;
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string }; status?: number } };
    const msg = e.response?.data?.message || "Subject not found";
    log("ERR", "Failed to fetch subject", {
      id,
      error: msg,
      status: e.response?.status,
    });
    return rejectWithValue(msg);
  }
});

export const createSubject = createAsyncThunk<
  Subject,
  Partial<Subject>,
  { rejectValue: string }
>("subject/create", async (subjectData, { rejectWithValue }) => {
  log("REQ", "Creating subject", subjectData);
  try {
    const response = await axiosInstance.post("/api/subject", subjectData);
    const data: Subject = response.data.data;
    log("RES", "Subject created", { id: data._id, name: data.name });
    return data;
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string }; status?: number } };
    const msg = e.response?.data?.message || "Failed to create subject";
    log("ERR", "Create subject failed", {
      error: msg,
      status: e.response?.status,
    });
    return rejectWithValue(msg);
  }
});

export const updateSubject = createAsyncThunk<
  Subject,
  { id: string; data: Partial<Subject> },
  { rejectValue: string }
>("subject/update", async ({ id, data }, { rejectWithValue }) => {
  log("REQ", `Updating subject ID: ${id}`, data);
  try {
    const response = await axiosInstance.put(`/api/subject/${id}`, data);
    const updated: Subject = response.data.data;
    log("RES", "Subject updated", { id, name: updated.name });
    return updated;
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string }; status?: number } };
    const msg = e.response?.data?.message || "Failed to update subject";
    log("ERR", "Update failed", {
      id,
      error: msg,
      status: e.response?.status,
    });
    return rejectWithValue(msg);
  }
});

export const deleteSubject = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("subject/delete", async (id: string, { rejectWithValue }) => {
  log("REQ", `Deleting subject ID: ${id}`);
  try {
    await axiosInstance.delete(`/api/subject/${id}`);
    log("RES", "Subject deleted", { id });
    return id;
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string }; status?: number } };
    const msg = e.response?.data?.message || "Failed to delete subject";
    log("ERR", "Delete failed", {
      id,
      error: msg,
      status: e.response?.status,
    });
    return rejectWithValue(msg);
  }
});

export const updateSubjectMembers = createAsyncThunk<
  Subject,
  SubjectMembersPayload,
  { rejectValue: string }
>(
  "subject/updateMembers",
  async (
    { subjectId, teacherIds = [], studentIds = [], action = "add" },
    { rejectWithValue },
  ) => {
    log(
      "REQ",
      `${action === "remove" ? "Removing" : "Adding"} subject members`,
      { subjectId, teacherIds, studentIds, action },
    );
    try {
      const response = await axiosInstance.post(
        `/api/subject/${subjectId}/members`,
        { teacherIds, studentIds, action },
      );
      const updated: Subject = response.data.data;
      log("RES", "Subject members updated", {
        id: updated?._id || subjectId,
        action,
      });
      return updated;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; status?: number } };
      const msg =
        e.response?.data?.message || "Failed to update subject members";
      log("ERR", "Update subject members failed", {
        subjectId,
        action,
        error: msg,
        status: e.response?.status,
      });
      return rejectWithValue(msg);
    }
  },
);

export const addSubjectMembers = createAsyncThunk<
  Subject,
  Omit<SubjectMembersPayload, "action">,
  { rejectValue: string }
>("subject/addMembers", async (payload, { dispatch, rejectWithValue }) => {
  const result = await dispatch(
    updateSubjectMembers({ ...payload, action: "add" }),
  );
  if (updateSubjectMembers.rejected.match(result)) {
    return rejectWithValue(result.payload || "Failed to add subject members");
  }
  return result.payload;
});

export const removeSubjectMembers = createAsyncThunk<
  Subject,
  Omit<SubjectMembersPayload, "action">,
  { rejectValue: string }
>("subject/removeMembers", async (payload, { dispatch, rejectWithValue }) => {
  const result = await dispatch(
    updateSubjectMembers({ ...payload, action: "remove" }),
  );
  if (updateSubjectMembers.rejected.match(result)) {
    return rejectWithValue(
      result.payload || "Failed to remove subject members",
    );
  }
  return result.payload;
});

const syncUpdatedSubjectInState = (
  state: SubjectState,
  updated: Subject | undefined,
) => {
  if (!updated?._id) return;
  const index = state.subjects.findIndex((s) => s._id === updated._id);
  if (index !== -1) state.subjects[index] = updated;
  if (state.currentSubject?._id === updated._id) {
    state.currentSubject = updated;
  }
};

const subjectSlice = createSlice({
  name: "subject",
  initialState,
  reducers: {
    clearCurrentSubject: (state) => {
      state.currentSubject = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSubjects.fulfilled,
        (state, action: PayloadAction<Subject[]>) => {
          state.loading = false;
          state.subjects = action.payload;
        },
      )
      .addCase(fetchSubjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch subjects";
      })
      .addCase(fetchSubjectById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSubjectById.fulfilled,
        (state, action: PayloadAction<Subject>) => {
          state.loading = false;
          state.currentSubject = action.payload;
        },
      )
      .addCase(fetchSubjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch subject";
      })
      .addCase(createSubject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createSubject.fulfilled,
        (state, action: PayloadAction<Subject>) => {
          state.loading = false;
          state.subjects.push(action.payload);
        },
      )
      .addCase(createSubject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to create subject";
      })
      .addCase(updateSubject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateSubject.fulfilled,
        (state, action: PayloadAction<Subject>) => {
          state.loading = false;
          syncUpdatedSubjectInState(state, action.payload);
        },
      )
      .addCase(updateSubject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to update subject";
      })
      .addCase(deleteSubject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteSubject.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.subjects = state.subjects.filter(
            (s) => s._id !== action.payload,
          );
          if (state.currentSubject?._id === action.payload) {
            state.currentSubject = null;
          }
        },
      )
      .addCase(deleteSubject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to delete subject";
      })
      .addCase(updateSubjectMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateSubjectMembers.fulfilled,
        (state, action: PayloadAction<Subject>) => {
          state.loading = false;
          syncUpdatedSubjectInState(state, action.payload);
        },
      )
      .addCase(updateSubjectMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to update subject members";
      })
      .addCase(addSubjectMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        addSubjectMembers.fulfilled,
        (state, action: PayloadAction<Subject>) => {
          state.loading = false;
          syncUpdatedSubjectInState(state, action.payload);
        },
      )
      .addCase(addSubjectMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to add subject members";
      })
      .addCase(removeSubjectMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        removeSubjectMembers.fulfilled,
        (state, action: PayloadAction<Subject>) => {
          state.loading = false;
          syncUpdatedSubjectInState(state, action.payload);
        },
      )
      .addCase(removeSubjectMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to remove subject members";
      });
  },
});

export const { clearCurrentSubject, clearError } = subjectSlice.actions;
export default subjectSlice.reducer;