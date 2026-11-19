import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { apiThunk, idle, trackStatus, type AsyncSlice } from "../../api";
import type { Id, Task, TaskBoard, TaskPriority, TaskStatus } from "../../models";

export interface TaskInput { title: string; description?: string; priority?: TaskPriority; dueDate?: string; labels?: string[] }
export interface AssignInput extends TaskInput { assigneeId: Id; assigneeType?: "teacher" | "admin" }
export interface TrackerQuery { assigneeId?: Id; status?: TaskStatus; priority?: TaskPriority; overdue?: boolean }

export const fetchMyBoard = apiThunk<TaskBoard>("tasks/mine", async (_, api) => (await api.get("/api/tasks/mine")).data.data);
export const createOwnTask = apiThunk<Task, TaskInput>("tasks/create", async (b, api) => (await api.post("/api/tasks", b)).data.data);
export const assignTask = apiThunk<Task, AssignInput>("tasks/assign", async (b, api) => (await api.post("/api/tasks/assign", b)).data.data);
export const fetchTracker = apiThunk<{ data: Task[]; perAssignee: Record<Id, Record<TaskStatus, number>> }, TrackerQuery | void>("tasks/tracker", async (q, api) => {
  const r = (await api.get("/api/tasks", { params: q || {} })).data;
  return { data: r.data, perAssignee: r.perAssignee };
});
export const updateTask = apiThunk<Task, { id: Id; changes: Partial<TaskInput> & { status?: TaskStatus } }>("tasks/update", async ({ id, changes }, api) => (await api.patch(`/api/tasks/${id}`, changes)).data.data);
export const deleteTask = apiThunk<Id, Id>("tasks/delete", async (id, api) => {
  await api.delete(`/api/tasks/${id}`);
  return id;
});

interface State extends AsyncSlice { board: TaskBoard; tracker: Task[]; perAssignee: Record<Id, Record<TaskStatus, number>> }
const empty = (): TaskBoard => ({ todo: [], in_progress: [], done: [] });
const initialState: State = { ...idle, board: empty(), tracker: [], perAssignee: {} };

const place = (board: TaskBoard, t: Task) => {
  (Object.keys(board) as TaskStatus[]).forEach((k) => (board[k] = board[k].filter((x) => x._id !== t._id)));
  board[t.status].unshift(t);
};

const slice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    /** Optimistic drag between columns; reverted by the rejected handler if the server says no. */
    moveLocal: (s, a: PayloadAction<{ id: Id; to: TaskStatus }>) => {
      const found = (Object.values(s.board).flat() as Task[]).find((t) => t._id === a.payload.id);
      if (found) place(s.board, { ...found, status: a.payload.to });
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMyBoard.fulfilled, (s, a) => void (s.board = a.payload));
    b.addCase(createOwnTask.fulfilled, (s, a) => place(s.board, a.payload));
    b.addCase(assignTask.fulfilled, (s, a) => void s.tracker.unshift(a.payload));
    b.addCase(fetchTracker.fulfilled, (s, a) => {
      s.tracker = a.payload.data;
      s.perAssignee = a.payload.perAssignee;
    });
    b.addCase(updateTask.fulfilled, (s, a) => {
      place(s.board, a.payload);
      s.tracker = s.tracker.map((t) => (t._id === a.payload._id ? a.payload : t));
    });
    b.addCase(deleteTask.fulfilled, (s, a) => {
      (Object.keys(s.board) as TaskStatus[]).forEach((k) => (s.board[k] = s.board[k].filter((t) => t._id !== a.payload)));
      s.tracker = s.tracker.filter((t) => t._id !== a.payload);
    });
    trackStatus(b, [fetchMyBoard, createOwnTask, assignTask, fetchTracker, updateTask, deleteTask]);
  },
});
export const { moveLocal } = slice.actions;
export default slice.reducer;
