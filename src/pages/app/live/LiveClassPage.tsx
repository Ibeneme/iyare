import { getCookie } from "../../../utils/cookies";
import React, { useEffect, useRef, useState, useCallback } from "react";
import ControlBar from "./ControlBar";
import ChatModal from "./ChatModal";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../../../contexts/SocketContext";
import { useConfirm } from "../../../contexts/ConfirmContext";
import {
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Captions,
  Disc,
  Square,
  Loader2,
} from "lucide-react";

// --- Interfaces ---
interface User {
  id: string;
  username: string;
}

type PeerConnectionMap = { [key: string]: RTCPeerConnection };
type PeerDataMap = { [key: string]: string };
type ActiveStreamMap = {
  [key: string]: { stream: MediaStream; username: string };
};

interface ChatMessage {
  id: string;
  username: string;
  message: string;
}

interface CaptionLine {
  id: string;
  senderId: string;
  username: string;
  text: string;
  isFinal: boolean;
  at: number;
}

interface PeerMediaStatus {
  mic: boolean;
  video: boolean;
}
type PeerMediaStatusMap = { [key: string]: PeerMediaStatus };

const iceConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// --- VideoTile Component ---
interface VideoTileProps {
  id: string;
  stream: MediaStream;
  username: string;
  isMuted: boolean;
  isScreenShare: boolean;
  isLocalUser: boolean;
  isVideoEnabled: boolean;
  isHandRaised: boolean;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  username,
  isMuted,
  isScreenShare,
  isLocalUser,
  isVideoEnabled,
  isHandRaised,
  isMaximized = false,
  onToggleMaximize,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.srcObject = stream;

    const playVideoSafely = async () => {
      try {
        if (videoEl.paused && (isVideoEnabled || isScreenShare)) {
          await videoEl.play();
        }
      } catch (err: any) {
        if (err.name !== "AbortError" && err.name !== "NotAllowedError") {
          console.warn("Video play failed:", err);
        }
      }
    };

    playVideoSafely();

    return () => {
      videoEl.srcObject = null;
    };
  }, [stream, isVideoEnabled, isScreenShare]);

  return (
    <div className="relative w-full h-full min-h-[180px] sm:min-h-[210px] rounded-2xl sm:rounded-3xl overflow-hidden bg-black/85 flex items-center justify-center border border-white/10 group">
      {isVideoEnabled || isScreenShare ? (
        <video
          ref={videoRef}
          className={`w-full h-full ${
            isScreenShare ? "object-contain bg-black" : "object-cover"
          }`}
          autoPlay
          playsInline
          muted={isMuted}
        />
      ) : (
        <div className="flex flex-col items-center p-3">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
            <span className="text-lg sm:text-2xl font-bold text-[#FFD000]">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <p className="mt-2 text-white/40 text-[11px] sm:text-xs font-semibold">
            Feed Off
          </p>
        </div>
      )}

      {onToggleMaximize && (
        <button
          type="button"
          onClick={onToggleMaximize}
          aria-label={isMaximized ? "Minimize video" : "Maximize video"}
          className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-20 p-2 rounded-full bg-black/70 text-white border border-white/10 hover:bg-black/90 active:scale-95 transition-all opacity-90 sm:opacity-80 sm:group-hover:opacity-100"
        >
          {isMaximized ? (
            <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FFD000]" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          )}
        </button>
      )}

      <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 max-w-[82%] bg-black/75 px-2.5 py-1 rounded-full border border-white/10">
        <span className="text-[11px] sm:text-xs text-white/90 font-bold tracking-tight truncate block">
          {username} {isLocalUser ? "(You)" : ""}{" "}
          {isScreenShare ? "• SCREEN" : ""}
        </span>
      </div>

      {isHandRaised && (
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full animate-bounce z-10">
          <span className="text-3xl sm:text-[48px]">✋</span>
        </div>
      )}
    </div>
  );
};

// --- Main VideoChat Component ---
const VideoChat: React.FC = () => {
  const { socket } = useSocket();
  const peerConnectionsRef = useRef<PeerConnectionMap>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pendingScreenSyncRef = useRef<Set<string>>(new Set());
  const screenShareBusyRef = useRef(false);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Audio-only call recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mixedAudioTrackIdsRef = useRef<Set<string>>(new Set());
  const recordingStartRef = useRef<number>(0);

  // Speech recognition refs for per-user captions
  const recognitionRef = useRef<any>(null);
  const captionsEnabledRef = useRef(false);
  const activeUtteranceIdRef = useRef<string>(`utt-${Date.now()}`);

  const { classId, classTitle, subject } = useParams<{
    classId: string;
    classTitle?: string;
    subject?: any;
  }>();

  const navigate = useNavigate();
  const storedUser = JSON.parse(getCookie("user") || "{}");
  const userEmail = storedUser?.email || "unknown@email.com";
  const userType = getCookie("userType");
  const usernameJoined = `${userEmail}-${userType}`;

  const { notify } = useConfirm();
  const [activeStreams, setActiveStreams] = useState<ActiveStreamMap>({});
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [peerData, setPeerData] = useState<PeerDataMap>({});
  const [isConnected, setIsConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenSharingPeer, setScreenSharingPeer] = useState<string | null>(
    null,
  );
  const [focusTarget, setFocusTarget] = useState<"screen" | "people">("screen");
  const [peerMediaStatus, setPeerMediaStatus] = useState<PeerMediaStatusMap>(
    {},
  );
  const [isForceMutedByHost, setIsForceMutedByHost] = useState(false);
  const [maximizedTileId, setMaximizedTileId] = useState<string | null>(null);

  // Audio recording state
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);

  // Per-user captions state
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [activeCaptions, setActiveCaptions] = useState<
    Record<string, CaptionLine>
  >({});
  const [captionNotice, setCaptionNotice] = useState<string | null>(null);

  // Pre-join states
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [mediaPermissionGranted, setMediaPermissionGranted] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

  const screenSharingPeerRef = useRef<string | null>(null);
  useEffect(() => {
    screenSharingPeerRef.current = screenSharingPeer;
  }, [screenSharingPeer]);

  useEffect(() => {
    captionsEnabledRef.current = captionsEnabled;
  }, [captionsEnabled]);

  const displayClassTitle = classTitle
    ? decodeURIComponent(classTitle)
    : "Greenroom Session";
  console.log(peerData);

  // --- Audio-only Call Recording Helpers ---
  const attachStreamAudioToMixer = useCallback(async (stream: MediaStream) => {
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
        // Ensure track is enabled for recording even if muted locally, or keep user's mic state
        const audioOnlyStream = new MediaStream([track]);
        const source = ctx.createMediaStreamSource(audioOnlyStream);
        source.connect(dest);
        mixedAudioTrackIdsRef.current.add(track.id);
      } catch (err) {
        console.warn("Could not attach audio track to recorder mixer:", err);
      }
    });
  }, []);

  useEffect(() => {
    if (!isRecordingAudio) return;
    if (localStreamRef.current) {
      attachStreamAudioToMixer(localStreamRef.current);
    }
    Object.entries(activeStreams).forEach(([id, entry]) => {
      if (id !== socket?.id && entry?.stream) {
        attachStreamAudioToMixer(entry.stream);
      }
    });
  }, [isRecordingAudio, activeStreams, socket?.id, attachStreamAudioToMixer]);

  const startAudioRecording = useCallback(async () => {
    if (isRecordingAudio || isUploadingRecording) return;
    if (!classId) {
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
      // Ensure local mic stream exists and is unmuted so voice is captured
      let micStream = localStreamRef.current;
      if (!micStream || micStream.getAudioTracks().length === 0) {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: false,
        });
        localStreamRef.current = micStream;
      }

      micStream.getAudioTracks().forEach((t) => {
        if (!t.enabled) t.enabled = true;
      });
      if (!micEnabled) {
        setMicEnabled(true);
        socket?.emit("media-toggle", { mic: true, video: videoEnabled });
      }

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

      await attachStreamAudioToMixer(micStream);

      for (const [id, entry] of Object.entries(activeStreams)) {
        if (id !== socket?.id && entry?.stream) {
          await attachStreamAudioToMixer(entry.stream);
        }
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

        if (!blob.size || !socket) {
          notify({
            title: "Empty recording",
            message:
              "No audio data was captured. Please check your microphone.",
          });
          return;
        }

        setIsUploadingRecording(true);
        try {
          const audioBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || ""));
            reader.onerror = () =>
              reject(new Error("Failed to read audio recording"));
            reader.readAsDataURL(blob);
          });

          socket.emit(
            "recording:save-audio",
            {
              classId,
              recordedBy: usernameJoined,
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
      notify({
        title: "Recording failed",
        message: err?.message || "Could not start audio recording.",
      });
    }
  }, [
    isRecordingAudio,
    isUploadingRecording,
    classId,
    micEnabled,
    videoEnabled,
    activeStreams,
    socket,
    usernameJoined,
    attachStreamAudioToMixer,
    notify,
  ]);

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

  // --- Request media + notification permissions on mount ---
  useEffect(() => {
    let mounted = true;

    const requestPermissions = async () => {
      setIsRequestingPermissions(true);
      setPermissionError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setPreviewStream(stream);
        setMediaPermissionGranted(true);

        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error("Media permission denied:", err);
        setMediaPermissionGranted(false);
        setPermissionError(
          "Camera and microphone access is required to join the call.\n\n" +
            "How to allow:\n" +
            "1. Tap or click the lock / site settings icon next to the URL\n" +
            "2. Set Camera and Microphone to Allow\n" +
            "3. Refresh this page",
        );
      }

      if ("Notification" in window) {
        try {
          const perm = await Notification.requestPermission();
          if (mounted) setNotificationPermission(perm);
        } catch (e) {
          console.warn("Notification permission request failed", e);
        }
      }

      if (mounted) setIsRequestingPermissions(false);
    };

    requestPermissions();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (previewVideoRef.current && previewStream) {
      previewVideoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  const togglePreviewMic = () => {
    if (!localStreamRef.current) return;
    const next = !micEnabled;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicEnabled(next);
  };

  const togglePreviewVideo = () => {
    if (!localStreamRef.current) return;
    const next = !videoEnabled;
    localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = next));
    setVideoEnabled(next);
  };

  const updateActiveStream = useCallback(
    (socketId: string, stream: MediaStream, username: string) => {
      setActiveStreams((prev) => ({
        ...prev,
        [socketId]: { stream, username },
      }));
    },
    [],
  );

  const removeActiveStream = useCallback((socketId: string) => {
    setActiveStreams((prev) => {
      const { [socketId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const handleToggleMaximize = (id: string) => {
    setMaximizedTileId((prev) => (prev === id ? null : id));
  };

  // --- Per-user live captions toggle & speech recognition ---
  const stopSpeechRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore if already stopped
    }
    recognitionRef.current = null;
  }, []);

  const handleToggleCaptions = useCallback(() => {
    setCaptionsEnabled((prev) => {
      const next = !prev;
      setCaptionNotice(null);

      if (!next) {
        stopSpeechRecognition();
        setActiveCaptions({});
      } else {
        const SpeechRecognitionCtor =
          typeof window !== "undefined"
            ? (window as any).SpeechRecognition ||
              (window as any).webkitSpeechRecognition
            : null;
        if (!SpeechRecognitionCtor) {
          setCaptionNotice(
            "Captions enabled for viewing; live speech-to-text isn't supported on this browser.",
          );
        }
      }

      socket?.emit("captions:toggle", { enabled: next });
      return next;
    });
  }, [socket, stopSpeechRecognition]);

  useEffect(() => {
    const canTranscribe =
      captionsEnabled && isConnected && micEnabled && !isForceMutedByHost;

    if (!canTranscribe) {
      stopSpeechRecognition();
      return;
    }

    const SpeechRecognitionCtor =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionCtor) return;

    let cancelled = false;

    const startRec = () => {
      if (cancelled || !captionsEnabledRef.current) return;
      stopSpeechRecognition();

      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-US";

      recognition.onresult = (event: any) => {
        if (!socket?.id || !captionsEnabledRef.current) return;

        let interim = "";
        let finalText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const transcript = res[0]?.transcript || "";
          if (res.isFinal) {
            finalText += transcript;
          } else {
            interim += transcript;
          }
        }

        const text = (finalText || interim).trim();
        if (!text) return;

        const isFinal = Boolean(finalText.trim());
        const line: CaptionLine = {
          id: activeUtteranceIdRef.current,
          senderId: socket.id,
          username: usernameJoined,
          text,
          isFinal,
          at: Date.now(),
        };

        socket.emit("caption", line);
        setActiveCaptions((prev) => ({ ...prev, [socket.id!]: line }));

        if (isFinal) {
          activeUtteranceIdRef.current = `utt-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 6)}`;
        }
      };

      recognition.onerror = (event: any) => {
        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          setCaptionNotice(
            "Speech recognition permission blocked; captions remain visible.",
          );
          stopSpeechRecognition();
        }
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        if (
          !cancelled &&
          captionsEnabledRef.current &&
          micEnabled &&
          !isForceMutedByHost
        ) {
          try {
            recognition.start();
            recognitionRef.current = recognition;
          } catch {
            // ignore restart race
          }
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        // ignore start error
      }
    };

    startRec();

    return () => {
      cancelled = true;
      stopSpeechRecognition();
    };
  }, [
    captionsEnabled,
    isConnected,
    micEnabled,
    isForceMutedByHost,
    socket,
    usernameJoined,
    stopSpeechRecognition,
  ]);

  // Listen for incoming captions only when this user has captions enabled
  useEffect(() => {
    if (!socket || !captionsEnabled) return;

    const handleCaption = (data: CaptionLine) => {
      if (!data?.senderId || !data?.text) return;
      setActiveCaptions((prev) => ({
        ...prev,
        [data.senderId]: { ...data, at: Date.now() },
      }));
    };

    socket.on("caption", handleCaption);
    return () => {
      socket.off("caption", handleCaption);
    };
  }, [socket, captionsEnabled]);

  // Expire stale captions every second
  useEffect(() => {
    if (!captionsEnabled) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setActiveCaptions((prev) => {
        let changed = false;
        const next: Record<string, CaptionLine> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (now - v.at < 4000) {
            next[k] = v;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [captionsEnabled]);

  const negotiate = useCallback(
    async (pc: RTCPeerConnection, remoteId: string) => {
      try {
        if (pc.signalingState !== "stable") return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket?.emit("session-description", pc.localDescription, remoteId);
      } catch (error) {
        console.error("Negotiation failed:", error);
      }
    },
    [socket],
  );

  const createPeerConnection = useCallback(
    (remoteSocketId: string, isInitiator: boolean) => {
      const pc = new RTCPeerConnection(iceConfiguration);
      peerConnectionsRef.current[remoteSocketId] = pc;

      const streamToShare = screenStreamRef.current || localStreamRef.current;
      if (streamToShare) {
        streamToShare
          .getTracks()
          .forEach((track) => pc.addTrack(track, streamToShare));
      }

      pc.ontrack = (event) => {
        setPeerData((prev) => {
          const name = prev[remoteSocketId] || "User";
          updateActiveStream(remoteSocketId, event.streams[0], name);
          return prev;
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate)
          socket?.emit("ice-candidate", event.candidate, remoteSocketId);
      };

      if (isInitiator)
        pc.onnegotiationneeded = () => negotiate(pc, remoteSocketId);
      return pc;
    },
    [socket, negotiate, updateActiveStream],
  );

  const syncScreenShareToPeer = useCallback(
    (peerId: string) => {
      if (!screenStreamRef.current) return;
      const pc = peerConnectionsRef.current[peerId];
      const screenTrack = screenStreamRef.current.getVideoTracks()[0];
      if (!pc || !screenTrack) return;

      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) {
        if (sender.track !== screenTrack) sender.replaceTrack(screenTrack);
      } else {
        pc.addTrack(screenTrack, screenStreamRef.current);
      }
      negotiate(pc, peerId);
    },
    [negotiate],
  );

  // --- Socket Listeners ---
  useEffect(() => {
    if (!socket) return;

    socket.on("new-user-joined", (newUser: User) => {
      setPeerData((prev) => ({ ...prev, [newUser.id]: newUser.username }));
      createPeerConnection(newUser.id, true);

      if (pendingScreenSyncRef.current.has(newUser.id)) {
        pendingScreenSyncRef.current.delete(newUser.id);
        syncScreenShareToPeer(newUser.id);
      }
    });

    socket.on(
      "existing-users",
      (existingUsers: User[], currentScreenSharerId: string | null) => {
        existingUsers.forEach((user) => {
          setPeerData((prev) => ({ ...prev, [user.id]: user.username }));
          createPeerConnection(user.id, false);
        });
        if (currentScreenSharerId) {
          setScreenSharingPeer(currentScreenSharerId);
          setFocusTarget("screen");
        }
      },
    );

    socket.on(
      "session-description",
      async (senderId: string, sdp: RTCSessionDescriptionInit) => {
        let pc =
          peerConnectionsRef.current[senderId] ||
          createPeerConnection(senderId, false);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        if (sdp.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("session-description", pc.localDescription, senderId);
        }
      },
    );

    socket.on(
      "ice-candidate",
      async (senderId: string, candidate: RTCIceCandidateInit) => {
        const pc = peerConnectionsRef.current[senderId];
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      },
    );

    socket.on("user-left", (id: string) => {
      removeActiveStream(id);
      peerConnectionsRef.current[id]?.close();
      delete peerConnectionsRef.current[id];
      pendingScreenSyncRef.current.delete(id);
      if (screenSharingPeerRef.current === id) setScreenSharingPeer(null);
      if (maximizedTileId === id) setMaximizedTileId(null);
    });

    socket.on("chat-message", (msg: ChatMessage) =>
      setChatMessages((prev) => [...prev, msg]),
    );

    socket.on("media-toggle", ({ senderId, mediaStatus }) => {
      setPeerMediaStatus((prev) => ({ ...prev, [senderId]: mediaStatus }));
    });

    socket.on("start-screen-share", (id: string) => {
      setScreenSharingPeer(id);
      setFocusTarget("screen");
    });

    socket.on("stop-screen-share", () => setScreenSharingPeer(null));

    socket.on("raise-hand", (id: string) =>
      setRaisedHands((prev) => new Set(prev).add(id)),
    );
    socket.on("lower-hand", (id: string) =>
      setRaisedHands((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      }),
    );

    socket.on("force-mute", () => {
      localStreamRef.current
        ?.getAudioTracks()
        .forEach((t) => (t.enabled = false));
      setMicEnabled(false);
      setIsForceMutedByHost(true);
    });

    socket.on("force-unmute", () => {
      localStreamRef.current
        ?.getAudioTracks()
        .forEach((t) => (t.enabled = true));
      setMicEnabled(true);
      setIsForceMutedByHost(false);
    });

    socket.on("prepare-late-joiner-screen", (lateJoinerId: string) => {
      if (peerConnectionsRef.current[lateJoinerId]) {
        syncScreenShareToPeer(lateJoinerId);
      } else {
        pendingScreenSyncRef.current.add(lateJoinerId);
      }
    });

    socket.on("join-denied", (info?: { reason?: string }) => {
      setIsConnected(false);
      notify({
        title: "Can't join",
        message: info?.reason || "You can't join this session right now.",
      });
      handleLeave();
    });
    socket.on("force-leave-room", () => handleLeave());
    socket.on("room-ended", () => handleLeave());

    return () => {
      socket.off("new-user-joined");
      socket.off("existing-users");
      socket.off("session-description");
      socket.off("ice-candidate");
      socket.off("user-left");
      socket.off("chat-message");
      socket.off("media-toggle");
      socket.off("start-screen-share");
      socket.off("stop-screen-share");
      socket.off("raise-hand");
      socket.off("lower-hand");
      socket.off("force-mute");
      socket.off("force-unmute");
      socket.off("prepare-late-joiner-screen");
      socket.off("join-denied");
      socket.off("force-leave-room");
      socket.off("room-ended");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    socket,
    createPeerConnection,
    removeActiveStream,
    syncScreenShareToPeer,
    maximizedTileId,
  ]);

  const handleJoinRoom = async () => {
    if (!classId || !socket) return;

    if (!mediaPermissionGranted || !localStreamRef.current) {
      setPermissionError(
        "Camera and microphone access is required. Please allow access and try again.",
      );
      return;
    }

    try {
      updateActiveStream(socket.id!, localStreamRef.current, usernameJoined);
      socket.emit("join", classId, usernameJoined, socket.id);
      socket.emit("media-toggle", { mic: micEnabled, video: videoEnabled });
      socket.emit("captions:toggle", { enabled: captionsEnabled });
      setIsConnected(true);
    } catch (err) {
      notify({ title: "Join failed", message: "Failed to join the room." });
    }
  };

  const toggleMic = () => {
    const next = !micEnabled;
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicEnabled(next);
    socket?.emit("media-toggle", { mic: next, video: videoEnabled });
  };

  const toggleVideo = () => {
    if (isScreenSharing) {
      console.warn("Camera toggle disabled during screen sharing");
      return;
    }

    const next = !videoEnabled;
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
    setVideoEnabled(next);
    socket?.emit("media-toggle", { mic: micEnabled, video: next });
  };

  const startScreenShare = async () => {
    if (isScreenSharing || screenShareBusyRef.current) return;
    if (!(navigator.mediaDevices as any)?.getDisplayMedia) {
      notify({
        title: "Not supported",
        message: "Screen sharing is not supported on this device/browser.",
      });
      return;
    }
    screenShareBusyRef.current = true;

    try {
      if (!videoEnabled && localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => {
          t.enabled = true;
        });
        setVideoEnabled(true);
        socket?.emit("media-toggle", {
          mic: micEnabled,
          video: true,
        });
      }

      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { cursor: "always" },
      });

      const screenTrack: MediaStreamTrack = stream.getVideoTracks()[0];
      if (!screenTrack) throw new Error("No screen video track");

      screenStreamRef.current = stream;
      setIsScreenSharing(true);

      if (localStreamRef.current && socket?.id) {
        updateActiveStream(socket.id, localStreamRef.current, usernameJoined);
      }

      const localScreenId = `${socket?.id || "local"}-screen`;
      setMaximizedTileId(localScreenId);

      Object.entries(peerConnectionsRef.current).forEach(([id, pc]) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(screenTrack).catch(console.error);
        } else if (screenStreamRef.current) {
          pc.addTrack(screenTrack, screenStreamRef.current);
        }
        negotiate(pc, id);
      });

      socket?.emit("start-screen-share");

      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.warn("Screen share failed:", err);
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    } finally {
      screenShareBusyRef.current = false;
    }
  };

  const stopScreenShare = () => {
    if (!screenStreamRef.current || screenShareBusyRef.current) return;
    screenShareBusyRef.current = true;

    try {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      setMaximizedTileId(null);

      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (localStreamRef.current && socket?.id) {
        updateActiveStream(socket.id, localStreamRef.current, usernameJoined);
      }

      Object.entries(peerConnectionsRef.current).forEach(([id, pc]) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (camTrack) {
          if (sender) {
            sender.replaceTrack(camTrack);
          } else if (localStreamRef.current) {
            pc.addTrack(camTrack, localStreamRef.current);
          }
        }
        negotiate(pc, id);
      });

      socket?.emit("stop-screen-share");
    } finally {
      screenShareBusyRef.current = false;
    }
  };

  const handleLeave = useCallback(() => {
    stopAudioRecording();
    stopSpeechRecognition();
    setCaptionsEnabled(false);
    setActiveCaptions({});

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      socket?.emit("stop-screen-share");
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    Object.values(peerConnectionsRef.current).forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track) sender.track.stop();
      });
      pc.close();
    });
    peerConnectionsRef.current = {};

    setActiveStreams({});
    setScreenSharingPeer(null);
    setMaximizedTileId(null);
    setIsScreenSharing(false);
    setIsConnected(false);
    setRaisedHands(new Set());
    setPeerData({});
    setPeerMediaStatus({});
    setChatMessages([]);
    setPreviewStream(null);

    socket?.emit("leave-room");
    navigate(-1);
  }, [navigate, socket, stopAudioRecording, stopSpeechRecognition]);

  useEffect(() => {
    return () => {
      stopAudioRecording();
      stopSpeechRecognition();
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        pc.getSenders().forEach((s) => s.track?.stop());
        pc.close();
      });
      peerConnectionsRef.current = {};
      socket?.emit("leave-room");
    };
  }, [socket, stopAudioRecording, stopSpeechRecognition]);

  const streamsArray = Object.entries(activeStreams).filter(
    ([id]) => id !== screenSharingPeer,
  );
  const presenterData = screenSharingPeer
    ? activeStreams[screenSharingPeer]
    : null;
  const userCount = streamsArray.length + (isScreenSharing ? 1 : 0);
  const visibleCaptions = Object.values(activeCaptions).slice(-2);

  const getGridCols = () => {
    if (screenSharingPeer && screenSharingPeer !== socket?.id)
      return "opacity-10 scale-95 blur-md pointer-events-none";

    switch (userCount) {
      case 1:
        return "grid-cols-1 max-w-4xl mx-auto";
      case 2:
        return "grid-cols-1 sm:grid-cols-2 max-w-5xl mx-auto";
      case 3:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto";
      case 4:
        return "grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 max-w-6xl mx-auto";
      case 5:
      case 6:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto";
      default:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-8xl mx-auto";
    }
  };

  const localScreenId = `${socket?.id || "local"}-screen`;

  const canJoin =
    mediaPermissionGranted &&
    !!localStreamRef.current &&
    !isRequestingPermissions;

  return (
    <div
      className={`bg-neutral-950 text-white h-dvh max-h-dvh flex flex-col relative font-sans ${
        isConnected ? "overflow-hidden" : "overflow-y-auto"
      }`}
    >
      {!isConnected ? (
        /* ===================== PRE-JOIN SCREEN ===================== */
        <div className="flex-1 flex items-center justify-center p-3 sm:p-6 min-h-full">
          <div className="w-full max-w-md space-y-4 sm:space-y-5 py-3 sm:py-6">
            {/* Header */}
            <div className="text-center space-y-1 px-2">
              <h1 className="text-xl sm:text-3xl font-semibold text-[#FFD000] tracking-tight break-words">
                {displayClassTitle}
              </h1>
              <p className="text-white/40 text-[11px] sm:text-xs font-semibold tracking-[0.25em] sm:tracking-[0.35em] uppercase">
                {subject || "Classroom"} Session
              </p>
            </div>

            {/* Live Preview */}
            <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-black/60 border border-white/10">
              {previewStream && videoEnabled ? (
                <video
                  ref={previewVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                    <span className="text-xl sm:text-2xl font-bold text-[#FFD000]">
                      {usernameJoined.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs font-semibold">
                    {videoEnabled ? "Starting camera…" : "Camera Off"}
                  </p>
                </div>
              )}

              {/* Mic / Video toggles */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2.5">
                <button
                  type="button"
                  onClick={togglePreviewMic}
                  aria-label={
                    micEnabled ? "Mute microphone" : "Unmute microphone"
                  }
                  className={`p-3 sm:p-2.5 rounded-full border transition-all active:scale-95 ${
                    micEnabled
                      ? "bg-black/70 border-white/20 text-white"
                      : "bg-red-600/90 border-red-500 text-white"
                  }`}
                >
                  {micEnabled ? (
                    <Mic className="w-4 h-4" />
                  ) : (
                    <MicOff className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={togglePreviewVideo}
                  aria-label={
                    videoEnabled ? "Turn camera off" : "Turn camera on"
                  }
                  className={`p-3 sm:p-2.5 rounded-full border transition-all active:scale-95 ${
                    videoEnabled
                      ? "bg-black/70 border-white/20 text-white"
                      : "bg-red-600/90 border-red-500 text-white"
                  }`}
                >
                  {videoEnabled ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <VideoOff className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Permission Alerts */}
            <div className="space-y-2.5">
              {/* Camera & Mic Alert */}
              <div
                className={`flex items-start gap-3 px-3.5 sm:px-4 py-3 rounded-2xl border ${
                  mediaPermissionGranted
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-red-500/10 border-red-500/20"
                }`}
              >
                {mediaPermissionGranted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Camera & Microphone</p>
                  <p className="text-xs text-white/60 mt-0.5">
                    {mediaPermissionGranted
                      ? "Access granted. You can join the call."
                      : "Required for the video call. Please allow access."}
                  </p>

                  {!mediaPermissionGranted && (
                    <button
                      type="button"
                      onClick={async () => {
                        setIsRequestingPermissions(true);
                        setPermissionError(null);
                        try {
                          const stream =
                            await navigator.mediaDevices.getUserMedia({
                              video: { facingMode: "user" },
                              audio: {
                                echoCancellation: true,
                                noiseSuppression: true,
                              },
                            });
                          localStreamRef.current = stream;
                          setPreviewStream(stream);
                          setMediaPermissionGranted(true);
                          if (previewVideoRef.current) {
                            previewVideoRef.current.srcObject = stream;
                          }
                        } catch (err) {
                          setMediaPermissionGranted(false);
                          setPermissionError(
                            "Camera and microphone access is required to join the call.\n\n" +
                              "How to allow:\n" +
                              "1. Tap or click the lock / site settings icon next to the URL\n" +
                              "2. Set Camera and Microphone to Allow\n" +
                              "3. Refresh this page",
                          );
                        } finally {
                          setIsRequestingPermissions(false);
                        }
                      }}
                      className="mt-2 text-xs font-semibold text-[#FFD000] hover:opacity-80 underline"
                    >
                      Allow Camera & Mic
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications Alert */}
              <div
                className={`flex items-start gap-3 px-3.5 sm:px-4 py-3 rounded-2xl border ${
                  notificationPermission === "granted"
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : notificationPermission === "denied"
                      ? "bg-red-500/10 border-red-500/20"
                      : "bg-[#FFD000]/10 border-[#FFD000]/20"
                }`}
              >
                {notificationPermission === "granted" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                ) : notificationPermission === "denied" ? (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[#FFD000] shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Notifications</p>
                  <p className="text-xs text-white/60 mt-0.5">
                    {notificationPermission === "granted"
                      ? "Enabled. You will receive class alerts."
                      : notificationPermission === "denied"
                        ? "Blocked. You must enable them manually in browser settings."
                        : "Recommended so you don’t miss important class alerts."}
                  </p>

                  {notificationPermission !== "granted" && (
                    <button
                      type="button"
                      onClick={async () => {
                        const perm = await Notification.requestPermission();
                        setNotificationPermission(perm);

                        if (perm === "denied") {
                          setPermissionError(
                            "Notifications are blocked. To enable them:\n\n" +
                              "1. Tap or click the lock / info icon next to the URL\n" +
                              "2. Find Notifications and set to Allow\n" +
                              "3. Refresh this page",
                          );
                        }
                      }}
                      className="mt-2 text-xs font-semibold text-[#FFD000] hover:opacity-80 underline"
                    >
                      Allow Notifications
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Error message */}
            {permissionError && (
              <div className="flex items-start gap-3 px-3.5 sm:px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/10">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-red-300 whitespace-pre-line">
                  {permissionError}
                </p>
              </div>
            )}

            {isRequestingPermissions && (
              <p className="text-center text-white/50 text-sm">
                Requesting permissions…
              </p>
            )}

            {/* Join Button */}
            <button
              type="button"
              className={`w-full font-semibold py-3.5 sm:py-4 rounded-full transition-all text-sm ${
                canJoin
                  ? "bg-[#FFD000] text-neutral-900 hover:brightness-95 active:scale-[0.98]"
                  : "bg-white/10 text-white/40 cursor-not-allowed"
              }`}
              onClick={handleJoinRoom}
              disabled={!canJoin}
            >
              {canJoin ? "JOIN NOW" : "ALLOW CAMERA & MIC TO JOIN"}
            </button>

            <p className="text-center text-white/30 text-[11px] leading-relaxed px-2 pb-2">
              Camera and microphone are required to join. Notifications are
              optional but help you stay updated.
            </p>
          </div>
        </div>
      ) : (
        /* ===================== IN-CALL UI ===================== */
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-2 px-3 sm:px-6 pt-3 sm:pt-5 pb-2 z-[60] shrink-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleLeave}
                className="bg-white/10 border border-white/10 px-3 sm:px-4 py-2 rounded-full text-xs font-semibold hover:bg-white/15 active:scale-95 transition-all"
              >
                Leave
              </button>
              {(userType === "teacher" || userType === "admin") && (
                <button
                  type="button"
                  onClick={() => socket?.emit("remove-all-users")}
                  className="bg-red-600/85 px-3 sm:px-4 py-2 rounded-full text-xs font-semibold hover:bg-red-600 active:scale-95 transition-all"
                >
                  End Class
                </button>
              )}
              <button
                type="button"
                onClick={handleToggleCaptions}
                aria-pressed={captionsEnabled}
                className={`px-3 sm:px-3.5 py-2 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 active:scale-95 transition-all ${
                  captionsEnabled
                    ? "bg-[#FFD000] text-neutral-950 border-[#FFD000]"
                    : "bg-white/10 text-white border-white/10 hover:bg-white/15"
                }`}
              >
                <Captions className="w-3.5 h-3.5" />
                <span>{captionsEnabled ? "CC On" : "CC Off"}</span>
              </button>

              <button
                type="button"
                onClick={
                  isRecordingAudio ? stopAudioRecording : startAudioRecording
                }
                disabled={isUploadingRecording}
                aria-pressed={isRecordingAudio}
                className={`px-3 sm:px-3.5 py-2 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-60 ${
                  isRecordingAudio
                    ? "bg-red-600 text-white border-red-500 animate-pulse"
                    : "bg-white/10 text-white border-white/10 hover:bg-white/15"
                }`}
              >
                {isUploadingRecording ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : isRecordingAudio ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Audio</span>
                  </>
                ) : (
                  <>
                    <Disc className="w-3.5 h-3.5 text-red-400" />
                    <span>Rec Audio</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-white/40 text-[11px] sm:text-xs font-semibold tracking-wider sm:tracking-[0.25em] truncate text-right">
              {displayClassTitle}
            </p>
          </div>

          {/* Main Video Grid Area */}
          <div className="flex-1 flex flex-col justify-center min-h-0 px-3 sm:px-6 md:px-8 pb-28 sm:pb-32 overflow-y-auto">
            <div
              className={`w-full grid gap-3 sm:gap-5 md:gap-6 transition-all duration-300 ${getGridCols()}`}
            >
              {isScreenSharing && screenStreamRef.current && (
                <div
                  key={localScreenId}
                  className="w-full aspect-video max-h-[38vh] sm:max-h-[58vh]"
                >
                  <VideoTile
                    id={localScreenId}
                    stream={screenStreamRef.current}
                    username={`${usernameJoined} (Screen)`}
                    isMuted={true}
                    isScreenShare={true}
                    isLocalUser={true}
                    isVideoEnabled={true}
                    isHandRaised={false}
                    isMaximized={maximizedTileId === localScreenId}
                    onToggleMaximize={() => handleToggleMaximize(localScreenId)}
                  />
                </div>
              )}

              {streamsArray.map(([id, data]) => (
                <div
                  key={id}
                  className="w-full aspect-video max-h-[38vh] sm:max-h-[58vh]"
                >
                  <VideoTile
                    id={id}
                    stream={data.stream}
                    username={data.username}
                    isMuted={id === socket?.id}
                    isScreenShare={false}
                    isLocalUser={id === socket?.id}
                    isVideoEnabled={
                      id === socket?.id
                        ? videoEnabled
                        : (peerMediaStatus[id]?.video ?? true)
                    }
                    isHandRaised={raisedHands.has(id)}
                    isMaximized={maximizedTileId === id}
                    onToggleMaximize={() => handleToggleMaximize(id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Per-user Live Captions Overlay */}
          {captionsEnabled && (visibleCaptions.length > 0 || captionNotice) && (
            <div className="fixed bottom-20 sm:bottom-24 inset-x-0 z-40 flex justify-center px-3 pointer-events-none">
              <div className="max-w-xl w-full bg-black/85 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-center shadow-xl space-y-1">
                {captionNotice && (
                  <p className="text-[11px] text-[#FFD000]/90">
                    {captionNotice}
                  </p>
                )}
                {visibleCaptions.map((line) => (
                  <p
                    key={line.id}
                    className="text-xs sm:text-sm text-white leading-snug break-words"
                  >
                    <span className="font-semibold text-[#FFD000] mr-1.5">
                      {line.username.split("-")[0]}:
                    </span>
                    <span
                      className={
                        line.isFinal ? "text-white" : "text-white/75 italic"
                      }
                    >
                      {line.text}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Fullscreen Overlay */}
          {maximizedTileId && (
            <div className="fixed inset-0 z-[70] bg-black/95 p-3 sm:p-6 md:p-8 flex items-center justify-center">
              <div className="w-full h-full max-w-7xl max-h-[88dvh] relative flex items-center justify-center">
                {maximizedTileId === localScreenId &&
                screenStreamRef.current ? (
                  <VideoTile
                    id={localScreenId}
                    stream={screenStreamRef.current}
                    username={`${usernameJoined} (Screen)`}
                    isMuted={true}
                    isScreenShare={true}
                    isLocalUser={true}
                    isVideoEnabled={true}
                    isHandRaised={false}
                    isMaximized={true}
                    onToggleMaximize={() => setMaximizedTileId(null)}
                  />
                ) : activeStreams[maximizedTileId] ? (
                  <VideoTile
                    id={maximizedTileId}
                    stream={activeStreams[maximizedTileId].stream}
                    username={activeStreams[maximizedTileId].username}
                    isMuted={maximizedTileId === socket?.id}
                    isScreenShare={false}
                    isLocalUser={maximizedTileId === socket?.id}
                    isVideoEnabled={
                      maximizedTileId === socket?.id
                        ? videoEnabled
                        : (peerMediaStatus[maximizedTileId]?.video ?? true)
                    }
                    isHandRaised={raisedHands.has(maximizedTileId)}
                    isMaximized={true}
                    onToggleMaximize={() => setMaximizedTileId(null)}
                  />
                ) : null}
              </div>
            </div>
          )}

          {/* Remote Screen Share Overlay */}
          {screenSharingPeer &&
            screenSharingPeer !== socket?.id &&
            presenterData && (
              <div className="fixed inset-0 z-40 p-2.5 sm:p-6 md:p-10 pb-24 sm:pb-28 flex items-center justify-center bg-black/70">
                <div className="w-full h-full max-h-[82dvh] bg-neutral-950/95 rounded-2xl sm:rounded-3xl border border-white/10 flex flex-col overflow-hidden">
                  <div className="px-3.5 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/60">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#FFD000] animate-pulse" />
                      <span className="text-xs font-semibold text-[#FFD000]">
                        Stage Focus
                      </span>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                      <button
                        type="button"
                        onClick={() => setFocusTarget("screen")}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                          focusTarget === "screen"
                            ? "bg-[#FFD000] text-black"
                            : "text-white/50 hover:text-white"
                        }`}
                      >
                        Screen
                      </button>
                      <button
                        type="button"
                        onClick={() => setFocusTarget("people")}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                          focusTarget === "people"
                            ? "bg-[#FFD000] text-black"
                            : "text-white/50 hover:text-white"
                        }`}
                      >
                        People
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-2.5 sm:p-5 min-h-0 overflow-hidden flex items-center justify-center">
                    {focusTarget === "screen" ? (
                      <VideoTile
                        id={screenSharingPeer}
                        stream={presenterData.stream}
                        username={presenterData.username}
                        isMuted={true}
                        isScreenShare={true}
                        isLocalUser={screenSharingPeer === socket?.id}
                        isVideoEnabled={true}
                        isHandRaised={false}
                        isMaximized={maximizedTileId === screenSharingPeer}
                        onToggleMaximize={() =>
                          handleToggleMaximize(screenSharingPeer)
                        }
                      />
                    ) : (
                      <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 overflow-y-auto p-1">
                        {Object.entries(activeStreams).map(([id, data]) => (
                          <div key={id} className="w-full aspect-video">
                            <VideoTile
                              id={id}
                              stream={data.stream}
                              username={data.username}
                              isMuted={id === socket?.id}
                              isScreenShare={false}
                              isLocalUser={id === socket?.id}
                              isVideoEnabled={
                                id === socket?.id
                                  ? videoEnabled
                                  : (peerMediaStatus[id]?.video ?? true)
                              }
                              isHandRaised={raisedHands.has(id)}
                              isMaximized={maximizedTileId === id}
                              onToggleMaximize={() => handleToggleMaximize(id)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          <ControlBar
            socket={socket}
            micEnabled={micEnabled}
            videoEnabled={videoEnabled}
            toggleMic={toggleMic}
            toggleVideo={toggleVideo}
            startScreenShare={startScreenShare}
            stopScreenShare={stopScreenShare}
            isScreenSharing={isScreenSharing}
            raisedHands={raisedHands}
            userId={socket?.id || ""}
            raiseHand={() => socket?.emit("raise-hand")}
            lowerHand={() => socket?.emit("lower-hand")}
            muteAll={() => socket?.emit("mute-all")}
            unmuteAll={() => socket?.emit("unmute-all")}
            username={usernameJoined}
            roomId={classId || ""}
            isForceMutedByHost={isForceMutedByHost}
            userType={userType}
          />

          <ChatModal
            username={usernameJoined}
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendChatMessage={() => {
              if (!chatInput.trim()) return;
              const msg = {
                id: Date.now().toString(),
                username: usernameJoined,
                message: chatInput,
              };
              socket?.emit("chat-message", msg);
              setChatMessages((prev) => [...prev, msg]);
              setChatInput("");
            }}
          />
        </div>
      )}
    </div>
  );
};

export default VideoChat;
