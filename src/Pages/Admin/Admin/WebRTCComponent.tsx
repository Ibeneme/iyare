import { useRef, useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useToast } from "../../../Context/ToastProvider";
import "./WebRTCComponent.css";
import { FiMic, FiMicOff, FiVideo, FiVideoOff } from "react-icons/fi";
import { FaPhoneSlash, FaShareSquare } from "react-icons/fa";
import { BASE_URL } from "../../../Redux/baseurl";
import { useNavigate, useParams } from "react-router-dom";

const configuration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};

const socket = io(BASE_URL, { transports: ["websocket"] });

let localStream: MediaStream | null = null;
let currentRoomId: string | null = null;

const peerConnections: Record<string, RTCPeerConnection> = {};
let screenShareStream: MediaStream | null = null;

function WebRTCComponent() {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const hangupButtonRef = useRef<HTMLButtonElement | null>(null);
  const muteAudButtonRef = useRef<HTMLButtonElement | null>(null);
  const screenShareButtonRef = useRef<HTMLButtonElement | null>(null);
  const { addToast } = useToast();
  //const [showModal, setShowModal] = useState(true);
  const { classId, classTitle } = useParams<{
    classId: string;
    classTitle: string;
  }>();
  const [inputRoomId, setInputRoomId] = useState(classId);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeScreenSharer, setActiveScreenSharer] = useState<string | null>(
    null
  );
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});

  const createPeerConnection = useCallback((participantId: string) => {
    console.log(`[PC] Creating PeerConnection for ${participantId}`);
    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (e) => {
      if (e.candidate && currentRoomId) {
        console.log(`[ICE] Sending ICE candidate to ${participantId}`);
        socket.emit("message", {
          type: "candidate",
          candidate: e.candidate,
          room: currentRoomId,
          targetId: participantId,
          from: socket.id,
        });
      } else if (e.candidate === null) {
        console.log(`[ICE] ICE gathering complete for ${participantId}`);
      }
    };

    pc.ontrack = (e) => {
      console.log(
        `[Media] Received remote track (${e.track.kind}) from ${participantId}:`,
        e.track
      );
      setRemoteStreams((prev) => {
        let remoteStream = prev[participantId];
        if (!remoteStream) {
          remoteStream = new MediaStream();
        }
        remoteStream.addTrack(e.track);
        return {
          ...prev,
          [participantId]: remoteStream,
        };
      });
    };

    pc.onnegotiationneeded = async () => {
      console.log(`[Negotiation] onnegotiationneeded for ${participantId}`);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("message", {
          type: "offer",
          sdp: offer.sdp,
          room: currentRoomId,
          targetId: participantId,
          from: socket.id,
        });
        console.log(`[Negotiation] Sent offer to ${participantId}`);
      } catch (e) {
        console.error(`[Error] Error creating offer for ${participantId}:`, e);
      }
    };

    if (screenShareStream) {
      screenShareStream.getTracks().forEach((track) => {
        pc.addTrack(track, screenShareStream as any);
        console.log(
          `[Media] Added screen share track to PC for ${participantId}:`,
          track.kind,
          track.id
        );
      });
    } else if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream!);
        console.log(
          `[Media] Added local camera track to PC for ${participantId}:`,
          track.kind,
          track.id
        );
      });
    }

    return pc;
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    setIsScreenSharing(false);
    //screenShareStream.getTracks().forEach((t) => t.stop());
    // screenShareStream = null;

    socket.on("message", async (e: any) => {
      if (
        currentRoomId &&
        e.room &&
        e.room !== currentRoomId &&
        e.type !== "room_full"
      ) {
        console.warn(
          `[Socket] Ignoring message for another room (${e.room}). Current room: ${currentRoomId}`
        );
        return;
      }

      if (e.type === "room_full") {
        addToast("error", `Room ${e.room} is full. Please try another ID.`);
        hangupAll();
        return;
      }

      const sender = e.from;
      if (!sender) {
        console.error("[Socket] Received message without 'from' sender ID:", e);
        return;
      }

      // Handle screen share specific messages
      if (e.type === "screen_share_started") {
        console.log(`[Screen Share] User ${sender} started screen sharing.`);
        setActiveScreenSharer(sender);
        if (socket.id !== sender && isScreenSharing) {
          console.warn(
            "[Screen Share] Another user started sharing. Stopping our screen share."
          );
          stopScreenShare();
        }
        return;
      } else if (e.type === "screen_share_stopped") {
        console.log(`[Screen Share] User ${sender} stopped screen sharing.`);
        if (activeScreenSharer === sender) {
          setActiveScreenSharer(null);
        }
        return;
      } else if (e.type === "screen_share_denied") {
        console.warn(
          "[Screen Share] Screen share denied by server: " + e.reason
        );
        addToast("error", "Screen share denied: " + e.reason);
        stopScreenShare();
        return;
      }

      if (!peerConnections[sender]) {
        console.log(
          `[PC Mgmt] Creating new PeerConnection for ${sender} due to incoming message.`
        );
        peerConnections[sender] = createPeerConnection(sender);
      }

      const pc = peerConnections[sender];
      if (!pc) {
        console.error(
          `[Error] PeerConnection not found for sender: ${sender} after creation attempt. Message type: ${e.type}`
        );
        return;
      }

      try {
        if (e.type === "offer") {
          console.log(
            `[SDP] Received offer from ${sender}:`,
            e.sdp.substring(0, 50) + "..."
          );
          const isPolite = (socket.id as any) > sender;
          const isMakingOffer =
            pc.signalingState === "have-local-offer" ||
            pc.signalingState === "have-local-pranswer";

          if (isMakingOffer && !isPolite) {
            console.warn(
              `[Negotiation] Impolite peer (${socket.id}) ignoring concurrent offer from ${sender}.`
            );
            return;
          }

          try {
            if (isMakingOffer && isPolite) {
              console.warn(
                `[Negotiation] Polite peer (${socket.id}) rolling back and accepting offer from ${sender}.`
              );
              await pc.setLocalDescription({ type: "rollback" });
            }
            await pc.setRemoteDescription(
              new RTCSessionDescription({ type: "offer", sdp: e.sdp })
            );
            console.log(
              `[SDP] Set remote offer from ${sender}. Signaling state: ${pc.signalingState}`
            );

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("message", {
              type: "answer",
              sdp: answer.sdp,
              room: currentRoomId,
              targetId: sender,
              from: socket.id,
            });
            console.log(`[SDP] Sent answer to ${sender}.`);
          } catch (err) {
            console.error(
              `[Error] Error processing offer from ${sender}:`,
              err
            );
          }
        } else if (e.type === "answer") {
          console.log(
            `[SDP] Received answer from ${sender}:`,
            e.sdp.substring(0, 50) + "..."
          );
          if (pc.signalingState === "have-local-offer") {
            try {
              await pc.setRemoteDescription(
                new RTCSessionDescription({ type: "answer", sdp: e.sdp })
              );
              console.log(
                `[SDP] Successfully set remote answer for ${sender}.`
              );
            } catch (setRemoteErr: any) {
              console.error(
                `[Error] Error setting remote answer for ${sender}. ` +
                  `Signaling state: ${pc.signalingState}. Error: ${setRemoteErr.name}: ${setRemoteErr.message}`
              );
            }
          } else {
            console.warn(
              `[SDP] Ignoring answer from ${sender} because signaling state is ${pc.signalingState}, ` +
                `expected 'have-local-offer'. Current Remote Description Type: ${
                  pc.remoteDescription?.type || "none"
                }`
            );
          }
        } else if (e.type === "candidate" && e.candidate) {
          console.log(
            `[ICE] Received ICE candidate from ${sender}:`,
            e.candidate.candidate.substring(0, 50) + "..."
          );
          await pc.addIceCandidate(new RTCIceCandidate(e.candidate));
        } else if (e.type === "bye") {
          console.log(`[Peer] ${sender} sent 'bye' message.`);
          if (peerConnections[sender]) {
            peerConnections[sender].close();
            delete peerConnections[sender];
          }
          setRemoteStreams((prev) => {
            const copy = { ...prev };
            delete copy[sender];
            return copy;
          });
          if (activeScreenSharer === sender) {
            setActiveScreenSharer(null);
          }
        }
      } catch (err) {
        console.error(
          `[Error] Error processing message type ${e.type} from ${sender}:`,
          err
        );
      }
    });

    socket.on("room_joined", ({ roomId, existingParticipants }: any) => {
      console.log(
        `[Socket] Successfully joined room ${roomId}. Existing participants:`,
        existingParticipants
      );
      currentRoomId = roomId;

      existingParticipants.forEach((id: string) => {
        if (id === socket.id) return;
        console.log(
          `[Room Joined] Initiating PC for existing participant: ${id}`
        );
        const pc = createPeerConnection(id);
        peerConnections[id] = pc;
      });

      //setShowModal(false);
      if (hangupButtonRef.current) hangupButtonRef.current.disabled = false;
      if (muteAudButtonRef.current) muteAudButtonRef.current.disabled = false;
      if (screenShareButtonRef.current)
        screenShareButtonRef.current.disabled = false;
    });

    socket.on("new_participant", (id: string) => {
      if (id === socket.id) return;
      console.log(
        `[Socket] New participant ${id} joined the room. Initiating PC.`
      );
      const pc = createPeerConnection(id);
      peerConnections[id] = pc;
    });

    socket.on("participant_left", (id: string) => {
      console.log(`[Socket] Participant ${id} left the room.`);
      if (peerConnections[id]) {
        peerConnections[id].close();
        delete peerConnections[id];
      }
      setRemoteStreams((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      if (activeScreenSharer === id) {
        setActiveScreenSharer(null);
      }
    });

    socket.on(
      "screen_sharer_updated",
      ({ sharerId }: { sharerId: string | null }) => {
        console.log(
          `[Socket] Screen sharer updated to: ${sharerId ? sharerId : "none"}`
        );
        setActiveScreenSharer(sharerId);
        if (isScreenSharing && sharerId !== socket.id) {
          stopScreenShare();
        }
      }
    );

    return () => {
      socket.off("message");
      socket.off("room_joined");
      socket.off("new_participant");
      socket.off("participant_left");
      socket.off("screen_sharer_updated");
    };
  }, [createPeerConnection, isScreenSharing, activeScreenSharer]);

  useEffect(() => {
    if (hangupButtonRef.current) hangupButtonRef.current.disabled = true;
    if (muteAudButtonRef.current) muteAudButtonRef.current.disabled = true;
    if (screenShareButtonRef.current)
      screenShareButtonRef.current.disabled = true;
  }, []);

  useEffect(() => {
    if (classId) {
      setInputRoomId(classId);
    }
  }, [classId]);

  useEffect(() => {
    if (inputRoomId) {
      joinCall();
    }
  }, [inputRoomId]);

  const joinCall = async () => {
    if (!inputRoomId?.trim()) {
      addToast("error", "Please enter a Room ID to join.");
      return;
    }

    try {
      if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: { echoCancellation: true },
        });
        console.log("[Media] Local stream obtained.", localStream);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current
          .play()
          .catch((e) => console.error("Error playing local video:", e));
        console.log("[Media] Local stream set to local video element.");
      }
      setVideoEnabled(true);
      setAudioEnabled(true);

      socket.emit("join_room", inputRoomId.trim());
      console.log(`[Socket] Attempting to join room: ${inputRoomId.trim()}`);
    } catch (err) {
      console.error("[Error] Error getting user media:", err);
      addToast(
        "error",
        "Could not access camera or microphone. Please ensure permissions are granted and no other app is using them."
      );
    }
  };

  const hangupAll = useCallback(() => {
    Object.values(peerConnections).forEach((pc) => {
      if (pc.iceConnectionState !== "closed") {
        pc.close();
      }
    });
    for (const key in peerConnections) {
      if (peerConnections.hasOwnProperty(key)) {
        delete peerConnections[key];
      }
    }
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      localStream = null;
    }
    if (screenShareStream) {
      screenShareStream.getTracks().forEach((t) => t.stop());
      screenShareStream = null;
    }

    setRemoteStreams({});
    currentRoomId = null;
    //setShowModal(true);
    navigate(-1);

    setInputRoomId("");
    setIsScreenSharing(false);
    setActiveScreenSharer(null);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    console.log("[UI] Call hung up. UI reset.");
  }, []);

  const hangB = () => {
    if (currentRoomId) {
      if (isScreenSharing) {
        stopScreenShare();
      }
      socket.emit("message", {
        type: "bye",
        room: currentRoomId,
        from: socket.id,
        targetId: "all_peers_in_room",
      });
    }
    hangupAll();
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        console.log(`[Media] Audio enabled state: ${audioTrack.enabled}`);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
        console.log(`[Media] Video enabled state: ${videoTrack.enabled}`);
      }
    }
  };

  const startScreenShare = async () => {
    if (isScreenSharing) {
      console.warn("[Screen Share] Already sharing screen.");
      return;
    }
    if (activeScreenSharer && activeScreenSharer !== socket.id) {
      window.alert(
        "Someone else is already sharing their screen. Please wait for them to stop."
      );
      return;
    }

    try {
      console.log("[Screen Share] Requesting display media...");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      screenShareStream = stream;

      screenShareStream.getVideoTracks()[0].onended = () => {
        console.log("[Screen Share] Screen share stopped by user.");
        stopScreenShare();
      };

      Object.values(peerConnections).forEach((pc) => {
        const videoSenders = pc
          .getSenders()
          .filter((sender) => sender.track && sender.track.kind === "video");
        if (videoSenders.length > 0) {
          console.log(
            "[Screen Share] Replacing video track with screen share track."
          );
          videoSenders[0].replaceTrack(screenShareStream!.getVideoTracks()[0]);
          const audioTrack = screenShareStream!.getAudioTracks()[0];
          if (audioTrack) {
            const audioSenders = pc
              .getSenders()
              .filter(
                (sender) => sender.track && sender.track.kind === "audio"
              );
            if (audioSenders.length > 0) {
              audioSenders[0].replaceTrack(audioTrack);
            } else {
              pc.addTrack(audioTrack, screenShareStream!);
            }
          }
        } else {
          console.log("[Screen Share] Adding screen share video track.");
          pc.addTrack(
            screenShareStream!.getVideoTracks()[0],
            screenShareStream!
          );
          const audioTrack = screenShareStream!.getAudioTracks()[0];
          if (audioTrack) {
            pc.addTrack(audioTrack, screenShareStream!);
          }
        }
      });

      if (localStream) {
        localStream
          .getVideoTracks()
          .forEach((track) => (track.enabled = false));
        setVideoEnabled(false);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenShareStream;
        localVideoRef.current
          .play()
          .catch((e) =>
            console.error("Error playing local screen share video:", e)
          );
      }

      setIsScreenSharing(true);
      socket.emit("screen_share_status", {
        sharing: true,
        room: currentRoomId,
      });
      console.log("[Screen Share] Started sharing screen.");
    } catch (err) {
      console.error("[Error] Error starting screen share:", err);
      setIsScreenSharing(false);
      screenShareStream = null;

      if (err instanceof DOMException && err.name === "NotAllowedError") {
        addToast(
          "error",
          "Screen share permission denied. Please allow screen sharing to proceed."
        );
      } else {
        addToast("error", "Could not start screen sharing.");
      }

      if (localStream && localStream.getVideoTracks().length > 0) {
        localStream.getVideoTracks()[0].enabled = true;
        setVideoEnabled(true);
        if (
          localVideoRef.current &&
          localVideoRef.current.srcObject !== localStream
        ) {
          localVideoRef.current.srcObject = localStream;
          localVideoRef.current
            .play()
            .catch((e) =>
              console.error(
                "Error playing local video after screen share fail:",
                e
              )
            );
        }
      }
    }
  };

  const stopScreenShare = () => {
    if (!isScreenSharing) {
      console.warn("[Screen Share] Not currently sharing screen.");
      return;
    }

    if (screenShareStream) {
      screenShareStream.getTracks().forEach((track) => track.stop());
      screenShareStream = null;
      console.log("[Screen Share] Stopped screen share stream.");
    }

    if (localStream) {
      localStream.getVideoTracks().forEach((track) => (track.enabled = true));
      setVideoEnabled(true);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current
          .play()
          .catch((e) => console.error("Error playing local camera video:", e));
      }

      Object.values(peerConnections).forEach((pc) => {
        const videoSenders = pc
          .getSenders()
          .filter((sender) => sender.track && sender.track.kind === "video");
        if (
          videoSenders.length > 0 &&
          localStream!.getVideoTracks().length > 0
        ) {
          console.log(
            "[Screen Share] Replacing screen share track with camera track."
          );
          videoSenders[0].replaceTrack(localStream!.getVideoTracks()[0]);
        }
        const audioTrack = localStream!.getAudioTracks()[0];
        if (audioTrack) {
          const audioSenders = pc
            .getSenders()
            .filter((sender) => sender.track && sender.track.kind === "audio");
          if (audioSenders.length > 0) {
            audioSenders[0].replaceTrack(audioTrack);
          }
        }
      });
    } else {
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
    }

    setIsScreenSharing(false);
    socket.emit("screen_share_status", { sharing: false, room: currentRoomId });
    console.log("[Screen Share] Screen sharing stopped.");
  };

  const toggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  // Combine local and remote participant IDs for dynamic grid
  const allParticipantIds = [
    ...(localStream && (!activeScreenSharer || activeScreenSharer !== socket.id)
      ? [socket.id]
      : []),
    ...Object.keys(remoteStreams).filter((id) => id !== activeScreenSharer),
  ];

  const totalParticipants = allParticipantIds.length;

  // Dynamically determine grid columns based on number of participants
  const getGridColumns = (count: number) => {
    if (count <= 1) return "1";
    if (count <= 4) return "2";
    if (count <= 9) return "3";
    // Add more cases for larger meetings if needed
    return "4"; // Max 4 columns for very large meetings
  };

  const gridColumns = getGridColumns(totalParticipants);

  return (
    <div className="webrtc-webrtc">
      {/* {showModal && (
        <div className="webrtc-modal-overlay">
          <div className="webrtc-modal-content">
            <h2>Join a Call</h2>
            <input
              placeholder="Room ID"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && joinCall()}
            />
            <button onClick={joinCall}>Join Call</button>
            <p>* Enter any ID to start a new call or join an existing one.</p>
            <p>* All participants in the same room will see each other.</p>
          </div>
        </div>
      )} */}
      <div className="webrtc-app-container">
        <h3
          style={{
            color: `var(--yellow)`,
            textAlign: "center",
            padding: 24,
            marginTop: 48,
          }}
        >
          {classTitle ? decodeURIComponent(classTitle) : ""} Class
        </h3>
        <div
          className={`webrtc-video-layout-container ${
            activeScreenSharer ? "screen-sharing" : ""
          }`}
        >
          {activeScreenSharer ? (
            <>
              {/* Main content area for screen share */}
              <div className="webrtc-main-content-area">
                <video
                  className="webrtc-screen-share-video"
                  autoPlay
                  playsInline
                  muted={activeScreenSharer === socket.id} // Mute if it's our own screen share
                  ref={(el) => {
                    if (el) {
                      const streamToDisplay =
                        activeScreenSharer === socket.id
                          ? screenShareStream // Display our own screen share
                          : remoteStreams[activeScreenSharer]; // Display remote screen share

                      if (el.srcObject !== streamToDisplay) {
                        el.srcObject = streamToDisplay;
                      }
                      if (el.paused) {
                        el.play().catch((e) =>
                          console.error(
                            `[Error] Error playing main screen share video for ${activeScreenSharer}:`,
                            e
                          )
                        );
                      }
                    }
                  }}
                />
                <div className="webrtc-participant-label">
                  {activeScreenSharer === socket.id
                    ? "Your screen"
                    : `Screen share by: ${activeScreenSharer.slice(0, 4)}...`}
                </div>
              </div>

              {/* Sidebar for other participants */}
              <div className="webrtc-sidebar-participants">
                {/* Local Video Stream (if not screen sharing self, or if localStream exists) */}
                {localStream &&
                  (!isScreenSharing || activeScreenSharer !== socket.id) && (
                    <div
                      className="webrtc-participant-video-wrapper webrtc-local-video-wrapper"
                      tabIndex={0}
                    >
                      <video
                        ref={localVideoRef}
                        className="webrtc-participant-video"
                        autoPlay
                        playsInline
                        muted
                      />
                      <div className="webrtc-participant-label">You</div>
                    </div>
                  )}
                {/* Remote Video Streams (filter out the active screen sharer) */}
                {Object.entries(remoteStreams)
                  .filter(([id]) => id !== activeScreenSharer)
                  .map(([id, stream]) => (
                    <div
                      key={id}
                      className="webrtc-participant-video-wrapper"
                      tabIndex={0}
                    >
                      <video
                        className="webrtc-participant-video"
                        autoPlay
                        playsInline
                        ref={(el) => {
                          if (el) {
                            if (el.srcObject !== stream) {
                              el.srcObject = stream;
                            }
                            if (el.paused) {
                              el.play().catch((e) =>
                                console.error(
                                  `[Error] Error playing remote video for ${id}:`,
                                  e
                                )
                              );
                            }
                          }
                        }}
                      />
                      <div className="webrtc-participant-label">{`Participant ${id.slice(
                        0,
                        4
                      )}...`}</div>
                    </div>
                  ))}
              </div>
            </>
          ) : (
            // Default grid layout when no screen share
            <div
              className="webrtc-participants-grid"
              style={{ "--grid-cols": gridColumns } as React.CSSProperties}
            >
              {/* Local Video Stream */}
              {localStream && (
                <div
                  className="webrtc-participant-video-wrapper webrtc-local-video-wrapper"
                  tabIndex={0}
                >
                  <video
                    ref={localVideoRef}
                    className="webrtc-participant-video"
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="webrtc-participant-label">You</div>
                </div>
              )}
              {/* Remote Video Streams */}
              {Object.entries(remoteStreams).map(([id, stream]) => (
                <div
                  key={id}
                  className="webrtc-participant-video-wrapper"
                  tabIndex={0}
                >
                  <video
                    className="webrtc-participant-video"
                    autoPlay
                    playsInline
                    ref={(el) => {
                      if (el) {
                        if (el.srcObject !== stream) {
                          el.srcObject = stream;
                        }
                        if (el.paused) {
                          el.play().catch((e) =>
                            console.error(
                              `[Error] Error playing remote video for ${id}:`,
                              e
                            )
                          );
                        }
                      }
                    }}
                  />
                  <div className="webrtc-participant-label">{`Participant ${id.slice(
                    0,
                    4
                  )}...`}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Control Bar */}
        <div className="webrtc-control-bar">
          <button
            className={`webrtc-control-btn ${!audioEnabled ? "red-bg" : ""}`}
            ref={muteAudButtonRef}
            onClick={toggleAudio}
            disabled={!localStream}
          >
            {audioEnabled ? <FiMic /> : <FiMicOff />}
          </button>

          <button
            className={`webrtc-control-btn ${!videoEnabled ? "red-bg" : ""}`}
            onClick={toggleVideo}
            disabled={!localStream || isScreenSharing}
          >
            {videoEnabled ? <FiVideo /> : <FiVideoOff />}
          </button>

          <button
            className={`webrtc-control-btn ${
              isScreenSharing ? "screen-share-active" : ""
            }`}
            ref={screenShareButtonRef}
            onClick={toggleScreenShare}
            // disabled={
            //   showModal || (!isScreenSharing && activeScreenSharer !== null)
            // }
          >
            <FaShareSquare />
          </button>

          <button
            className="webrtc-control-btn red-bg"
            ref={hangupButtonRef}
            onClick={hangB}
            //disabled={showModal}
          >
            <FaPhoneSlash />
          </button>
        </div>
      </div>
    </div>
  );
}

export default WebRTCComponent;
