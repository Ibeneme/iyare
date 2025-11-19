// src/components/WebRTCGroupCall.tsx
import { useRef, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useToast } from "../../../Context/ToastProvider";
import { BASE_URL } from "../../../Redux/baseurl";
import { useNavigate, useParams } from "react-router-dom";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  MonitorDown,
  Users,
  Grid,
  Layout,
  User as UserIcon,
} from "lucide-react";

/* --------------------------------------------------------------- */
/*                        WebRTC configuration                     */
/* --------------------------------------------------------------- */
const configuration = {
  iceServers: [
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

interface Peer {
  id: string;
  stream: MediaStream;
  pc: RTCPeerConnection;
  displayName: string;
  isMuted: boolean;
  isVideoOff: boolean;
}

/* --------------------------------------------------------------- */
/*                           Component                             */
/* --------------------------------------------------------------- */
const WebRTCGroupCall: React.FC = () => {
  const { classId, classTitle } = useParams<{
    classId: string;
    classTitle: string;
  }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  /* --------------------------- Refs --------------------------- */
  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<Map<string, Peer>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  /* --------------------------- UI state ---------------------- */
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "speaker">("grid");
  const [, forceUpdate] = useState({});

  const myDisplayName = "You"; // replace with auth later

  /* ---------------------- Helper: initials ------------------- */
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  /* ---------------------- Socket & join ---------------------- */
  useEffect(() => {
    if (!classId) return;

    socketRef.current = io(BASE_URL, {
      transports: ["websocket"],
      query: { roomId: classId, displayName: myDisplayName },
    });

    const socket = socketRef.current!;

    socket.on("connect", () => {
      addToast(
        "success",
        `Joined ${decodeURIComponent(classTitle ?? "Class")}`
      );
    });

    /* ---- New user joins ---- */
    socket.on(
      "user-joined",
      ({ userId, displayName }: { userId: string; displayName: string }) => {
        addToast("info", `${displayName} joined`);
        setParticipants((p) => [...p, userId]);
        createPeerConnection(userId, displayName, true);
      }
    );

    /* ---- User leaves ---- */
    socket.on("user-left", (userId: string) => {
      const peer = peersRef.current.get(userId);
      addToast("info", `${peer?.displayName || userId} left`);
      removePeer(userId);
      setParticipants((p) => p.filter((id) => id !== userId));
    });

    /* ---- Signaling ---- */
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    /* ---- Track mute/unmute from others ---- */
    socket.on(
      "track-toggled",
      ({
        userId,
        kind,
        enabled,
      }: {
        userId: string;
        kind: "audio" | "video";
        enabled: boolean;
      }) => {
        const peer = peersRef.current.get(userId);
        if (!peer) return;
        if (kind === "audio") peer.isMuted = !enabled;
        if (kind === "video") peer.isVideoOff = !enabled;
        forceUpdate({});
      }
    );

    return () => {
      socket.disconnect();
      stopAllStreams();
    };
  }, []);

  /* ---------------------- Get local media ------------------- */
  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      socketRef.current?.emit("ready");
    } catch {
      addToast("error", "Camera / Mic access denied");
    }
  };

  useEffect(() => {
    getUserMedia();
  }, []);

  /* ------------------- Peer connection helpers -------------- */
  const createPeerConnection = (
    peerId: string,
    displayName: string,
    initiator: boolean
  ) => {
    const pc = new RTCPeerConnection(configuration);
    const peer: Peer = {
      id: peerId,
      stream: new MediaStream(),
      pc,
      displayName,
      isMuted: false,
      isVideoOff: false,
    };
    peersRef.current.set(peerId, peer);

    // Add local tracks
    localStreamRef.current
      ?.getTracks()
      .forEach((t) => pc.addTrack(t, localStreamRef.current!));

    // Receive remote tracks
    pc.ontrack = (e) => {
      e.streams[0].getTracks().forEach((t) => peer.stream.addTrack(t));
      renderRemoteVideo(peerId, peer.stream);
    };

    // ICE
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit("ice-candidate", {
          candidate: e.candidate,
          to: peerId,
        });
      }
    };

    // Detect remote mute / video-off
    pc.ontrack = (e) => {
      const track = e.track;
      const update = () => {
        peer.isMuted = !track.enabled && track.kind === "audio";
        peer.isVideoOff = !track.enabled && track.kind === "video";
        forceUpdate({});
      };
      track.onmute = update;
      track.onunmute = update;
      e.streams[0].getTracks().forEach((t) => peer.stream.addTrack(t));
      renderRemoteVideo(peerId, peer.stream);
    };

    if (initiator) createAndSendOffer(pc, peerId);
  };

  const createAndSendOffer = async (pc: RTCPeerConnection, peerId: string) => {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit("offer", { offer, to: peerId });
  };

  const handleOffer = async ({
    offer,
    from,
  }: {
    offer: RTCSessionDescriptionInit;
    from: string;
  }) => {
    let pc = peersRef.current.get(from)?.pc;
    if (!pc) {
      // New peer – we don’t know name yet, fallback to id
      createPeerConnection(from, from, false);
      pc = peersRef.current.get(from)!.pc;
    }
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketRef.current?.emit("answer", { answer, to: from });
  };

  const handleAnswer = async ({
    answer,
    from,
  }: {
    answer: RTCSessionDescriptionInit;
    from: string;
  }) => {
    const pc = peersRef.current.get(from)?.pc;
    if (pc) await pc.setRemoteDescription(answer);
  };

  const handleIceCandidate = async ({
    candidate,
    from,
  }: {
    candidate: RTCIceCandidateInit;
    from: string;
  }) => {
    const pc = peersRef.current.get(from)?.pc;
    if (pc) await pc.addIceCandidate(candidate);
  };

  const renderRemoteVideo = (peerId: string, stream: MediaStream) => {
    const el = document.getElementById(`video-${peerId}`) as HTMLVideoElement;
    if (el) el.srcObject = stream;
  };

  const removePeer = (peerId: string) => {
    const p = peersRef.current.get(peerId);
    if (p) {
      p.pc.close();
      peersRef.current.delete(peerId);
      const el = document.getElementById(`video-${peerId}`);
      if (el) el.srcObject = null;
    }
  };

  const stopAllStreams = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    peersRef.current.clear();
  };

  /* -------------------------- Controls ----------------------- */
  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
      socketRef.current?.emit("track-toggled", {
        kind: "audio",
        enabled: track.enabled,
      });
    }
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoOff(!track.enabled);
      socketRef.current?.emit("track-toggled", {
        kind: "video",
        enabled: track.enabled,
      });
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      setIsScreenSharing(false);
      if (screenShareVideoRef.current)
        screenShareVideoRef.current.srcObject = null;
      socketRef.current?.emit("screen-share-stop");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      if (screenShareVideoRef.current)
        screenShareVideoRef.current.srcObject = stream;

      const newTrack = stream.getVideoTracks()[0];
      peersRef.current.forEach((p) => {
        const sender = p.pc.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(newTrack);
      });

      socketRef.current?.emit("screen-share-start");

      newTrack.onended = toggleScreenShare;
    } catch {
      addToast("error", "Screen share denied");
    }
  };

  const leaveCall = () => {
    socketRef.current?.emit("leave");
    stopAllStreams();
    navigate(-1);
  };

  /* ----------------------------------------------------------- */
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold truncate max-w-[220px]">
            {decodeURIComponent(classTitle ?? "Class")}
          </h1>
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span>{participants.length + 1}</span>
          </div>
        </div>

        <button
          onClick={() =>
            setViewMode((m) => (m === "grid" ? "speaker" : "grid"))
          }
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
        >
          {viewMode === "grid" ? (
            <Grid className="w-5 h-5" />
          ) : (
            <Layout className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div
          className={`grid gap-4 ${
            viewMode === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          }`}
        >
          {/* Local video */}
          <div className="relative bg-black rounded-xl overflow-hidden group">
            {isVideoOff ? (
              <div className="flex flex-col items-center justify-center h-full bg-gray-800">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                  {getInitials(myDisplayName)}
                </div>
                <p className="mt-2 text-sm text-gray-300">{myDisplayName}</p>
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black bg-opacity-60 px-2 py-1 rounded text-xs">
              <span>{myDisplayName}</span>
              {isMuted && <MicOff className="w-3 h-3 text-red-500" />}
              {isVideoOff && <VideoOff className="w-3 h-3 text-red-500" />}
            </div>
            {isScreenSharing && (
              <div className="absolute top-2 right-2 bg-green-600 text-xs px-2 py-1 rounded">
                Presenting
              </div>
            )}
          </div>

          {/* Screen share (any user) */}
          {isScreenSharing && (
            <div className="relative bg-black rounded-xl overflow-hidden">
              <video
                ref={screenShareVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-gray-900"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-xs">
                Your Screen
              </div>
            </div>
          )}

          {/* Remote peers */}
          {Array.from(peersRef.current.entries()).map(([id, peer]) => {
            const hasVideo = peer.stream
              .getVideoTracks()
              .some((t) => t.enabled);
            const hasAudio = peer.stream
              .getAudioTracks()
              .some((t) => t.enabled);

            return (
              <div
                key={id}
                className="relative bg-black rounded-xl overflow-hidden group"
              >
                {peer.isVideoOff || !hasVideo ? (
                  <div className="flex flex-col items-center justify-center h-full bg-gray-800">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                      {getInitials(peer.displayName)}
                    </div>
                    <p className="mt-2 text-sm text-gray-300">
                      {peer.displayName}
                    </p>
                  </div>
                ) : (
                  <video
                    id={`video-${id}`}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black bg-opacity-60 px-2 py-1 rounded text-xs">
                  <span>{peer.displayName}</span>
                  {(peer.isMuted || !hasAudio) && (
                    <MicOff className="w-3 h-3 text-red-500" />
                  )}
                  {(peer.isVideoOff || !hasVideo) && (
                    <VideoOff className="w-3 h-3 text-red-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-4 bg-gray-800 border-t border-gray-700">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition ${
            isMuted
              ? "bg-red-600 hover:bg-red-700"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          {isMuted ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition ${
            isVideoOff
              ? "bg-red-600 hover:bg-red-700"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          {isVideoOff ? (
            <VideoOff className="w-6 h-6" />
          ) : (
            <Video className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-4 rounded-full transition ${
            isScreenSharing
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          {isScreenSharing ? (
            <MonitorDown className="w-6 h-6" />
          ) : (
            <MonitorUp className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={leaveCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default WebRTCGroupCall;
