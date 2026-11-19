import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { useLocation } from "react-router-dom";
import { Disc, Square, Loader2 } from "lucide-react";
import { useSocket } from "./SocketContext";
import { useConfirm } from "./ConfirmContext";

export interface RecordingSessionMeta {
  classId: string;
  classTitle?: string;
  recordedBy: string;
  remoteStreams?: MediaStream[];
}

interface CallRecordingContextValue {
  isRecordingAudio: boolean;
  isUploadingRecording: boolean;
  recordingSeconds: number;
  activeSession: RecordingSessionMeta | null;
  startAudioRecording: (
    meta: RecordingSessionMeta,
    existingLocalStream?: MediaStream | null,
  ) => Promise<void>;
  stopAudioRecording: () => void;
  attachStreamToRecording: (stream: MediaStream) => Promise<void>;
  syncRemoteStreams: (streams: MediaStream[]) => Promise<void>;
}

const CallRecordingContext = createContext<CallRecordingContextValue | null>(
  null,
);

const formatDuration = (totalSec: number) => {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export const CallRecordingProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { socket } = useSocket();
  const { notify } = useConfirm();
  const location = useLocation();

  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activeSession, setActiveSession] =
    useState<RecordingSessionMeta | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mixedAudioTrackIdsRef = useRef<Set<string>>(new Set());
  const recordingStartRef = useRef<number>(0);
  const ownedMicStreamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<RecordingSessionMeta | null>(null);

  useEffect(() => {
    sessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    if (!isRecordingAudio) {
      setRecordingSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      if (recordingStartRef.current) {
        setRecordingSeconds(
          Math.max(0, Math.floor((Date.now() - recordingStartRef.current) / 1000)),
        );
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecordingAudio]);

  const attachStreamToRecording = useCallback(async (stream: MediaStream) => {
    const ctx = audioCtxRef.current;
    const dest = audioDestRef.current;
    if (!ctx || !dest || !stream) return;

    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        // ignore
      }
    }

    stream.getAudioTracks().forEach((track) => {
      if (track.readyState === "ended") return;
      if (mixedAudioTrackIdsRef.current.has(track.id)) return;
      try {
        const audioOnlyStream = new MediaStream([track]);
        const source = ctx.createMediaStreamSource(audioOnlyStream);
        source.connect(dest);
        mixedAudioTrackIdsRef.current.add(track.id);
      } catch (err) {
        console.warn("Could not attach audio track to recorder mixer:", err);
      }
    });
  }, []);

  const syncRemoteStreams = useCallback(
    async (streams: MediaStream[]) => {
      if (!isRecordingAudio) return;
      for (const s of streams) {
        if (s) await attachStreamToRecording(s);
      }
    },
    [isRecordingAudio, attachStreamToRecording],
  );

  const startAudioRecording = useCallback(
    async (
      meta: RecordingSessionMeta,
      existingLocalStream?: MediaStream | null,
    ) => {
      if (isRecordingAudio || isUploadingRecording) return;
      if (!meta?.classId) {
        notify({
          title: "Missing class",
          message: "Class ID is required to save a recording.",
        });
        return;
      }
      if (typeof MediaRecorder === "undefined") {
        notify({
          title: "Not supported",
          message: "Audio recording is not supported on this browser.",
        });
        return;
      }

      try {
        let micStream = existingLocalStream || null;
        if (!micStream || micStream.getAudioTracks().length === 0) {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
            video: false,
          });
          ownedMicStreamRef.current = micStream;
        }

        micStream.getAudioTracks().forEach((t) => {
          if (!t.enabled) t.enabled = true;
        });

        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        if (ctx.state === "suspended") {
          await ctx.resume();
        }
        const dest = ctx.createMediaStreamDestination();

        audioCtxRef.current = ctx;
        audioDestRef.current = dest;
        mixedAudioTrackIdsRef.current = new Set();
        audioChunksRef.current = [];
        setActiveSession(meta);

        await attachStreamToRecording(micStream);
        for (const s of meta.remoteStreams || []) {
          if (s) await attachStreamToRecording(s);
        }

        const recordStream =
          dest.stream.getAudioTracks().length > 0 ? dest.stream : micStream;

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : MediaRecorder.isTypeSupported("audio/mp4")
              ? "audio/mp4"
              : "";

        const recorder = mimeType
          ? new MediaRecorder(recordStream, { mimeType })
          : new MediaRecorder(recordStream);

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const currentMeta = sessionRef.current;
          const durationSec = Math.max(
            1,
            Math.round((Date.now() - recordingStartRef.current) / 1000),
          );
          const actualMime = recorder.mimeType || mimeType || "audio/webm";
          const extension = actualMime.includes("mp4")
            ? "m4a"
            : actualMime.includes("ogg")
              ? "ogg"
              : "webm";

          const blob = new Blob(audioChunksRef.current, { type: actualMime });
          audioChunksRef.current = [];

          try {
            await audioCtxRef.current?.close();
          } catch {
            // ignore
          }
          audioCtxRef.current = null;
          audioDestRef.current = null;
          mixedAudioTrackIdsRef.current.clear();

          if (ownedMicStreamRef.current) {
            ownedMicStreamRef.current.getTracks().forEach((t) => t.stop());
            ownedMicStreamRef.current = null;
          }

          setActiveSession(null);

          if (!blob.size || !socket || !currentMeta?.classId) {
            notify({
              title: "Empty recording",
              message:
                "No audio data was captured. Please check your microphone.",
            });
            return;
          }

          setIsUploadingRecording(true);
          try {
            const audioBase64 = await new Promise<string>(
              (resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(String(reader.result || ""));
                reader.onerror = () =>
                  reject(new Error("Failed to read audio recording"));
                reader.readAsDataURL(blob);
              },
            );

            socket.emit(
              "recording:save-audio",
              {
                classId: currentMeta.classId,
                recordedBy: currentMeta.recordedBy,
                audioBase64,
                mimeType: actualMime,
                durationSec,
                extension,
              },
              (res?: { ok?: boolean; url?: string; error?: string }) => {
                setIsUploadingRecording(false);
                if (res?.ok && res.url) {
                  notify({
                    title: "Recording saved",
                    message:
                      "Call audio was uploaded to Backblaze and saved to the class.",
                  });
                } else {
                  notify({
                    title: "Upload failed",
                    message: res?.error || "Could not save audio recording.",
                  });
                }
              },
            );
          } catch (err: any) {
            setIsUploadingRecording(false);
            notify({
              title: "Upload failed",
              message: err?.message || "Failed to upload audio recording.",
            });
          }
        };

        mediaRecorderRef.current = recorder;
        recordingStartRef.current = Date.now();
        recorder.start(500);
        setIsRecordingAudio(true);
      } catch (err: any) {
        setActiveSession(null);
        notify({
          title: "Recording failed",
          message: err?.message || "Could not start audio recording.",
        });
      }
    },
    [
      isRecordingAudio,
      isUploadingRecording,
      socket,
      attachStreamToRecording,
      notify,
    ],
  );

  const stopAudioRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    setIsRecordingAudio(false);
    mediaRecorderRef.current = null;
    try {
      if (recorder && recorder.state !== "inactive") {
        if (typeof recorder.requestData === "function") {
          recorder.requestData();
        }
        recorder.stop();
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    return () => {
      try {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // ignore
      }
      audioCtxRef.current?.close().catch(() => {});
      ownedMicStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Hide the top banner when already inside the VideoChat screen (which has its own button),
  // so it appears across all other pages while recording or saving.
  const isOnVideoChatRoute = location.pathname.includes("/video");
  const showTopBanner =
    !isOnVideoChatRoute && (isRecordingAudio || isUploadingRecording);

  return (
    <CallRecordingContext.Provider
      value={{
        isRecordingAudio,
        isUploadingRecording,
        recordingSeconds,
        activeSession,
        startAudioRecording,
        stopAudioRecording,
        attachStreamToRecording,
        syncRemoteStreams,
      }}
    >
      {showTopBanner && (
        <div className="sticky top-0 z-[100] w-full bg-neutral-950/95 border-b border-white/15 px-4 py-2 text-white backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {isUploadingRecording ? (
                <Loader2 className="w-4 h-4 text-[#FFD000] animate-spin shrink-0" />
              ) : (
                <span className="inline-flex items-center gap-1.5 text-red-400 font-semibold text-xs shrink-0">
                  <Disc className="w-4 h-4 animate-pulse" />
                  REC {formatDuration(recordingSeconds)}
                </span>
              )}
              <span className="text-xs text-white/75 truncate">
                {isUploadingRecording
                  ? "Uploading call recording…"
                  : activeSession?.classTitle ||
                    `Class ${activeSession?.classId || ""}`}
              </span>
            </div>

            {isRecordingAudio && (
              <button
                type="button"
                onClick={stopAudioRecording}
                className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full transition-colors shrink-0"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop & Save</span>
              </button>
            )}
          </div>
        </div>
      )}
      {children}
    </CallRecordingContext.Provider>
  );
};

export const useCallRecording = () => {
  const ctx = useContext(CallRecordingContext);
  if (!ctx) {
    throw new Error(
      "useCallRecording must be used within a CallRecordingProvider",
    );
  }
  return ctx;
};