import { useRouter } from "expo-router";
import {
    Camera,
    CameraOff,
    Mic,
    MicOff,
    PhoneOff,
    Repeat,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    mediaDevices,
    RTCIceCandidate,
    RTCPeerConnection,
    RTCSessionDescription,
    RTCView,
} from "react-native-webrtc";
import { io, Socket } from "socket.io-client";
import { getAuthToken, getSocketBaseUrl } from "../../services/api";

type Props = {
  roomId: string;
  isInitiator: boolean;
  peerId: string;
  peerName: string;
  appointmentId?: string;
};

const ICE_SERVERS = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
};

export default function VideoCallScreen({
  roomId,
  isInitiator,
  peerName,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<any>(null);
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const offerSentRef = useRef(false);

  const sendOffer = useCallback(async () => {
    const pc = pcRef.current;
    const socket = socketRef.current;
    if (!pc || !socket?.connected || offerSentRef.current) return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("offer", { roomId, sdp: offer });
    offerSentRef.current = true;
  }, [roomId]);

  const cleanup = () => {
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track: any) => track.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const token = await getAuthToken();
      if (!token || !roomId) {
        Alert.alert("Call error", "Unable to connect call.");
        router.back();
        return;
      }

      const socket = io(getSocketBaseUrl(), {
        transports: ["websocket"],
        auth: { token },
      });
      socketRef.current = socket;

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "user" },
      });

      if (!mounted) return;

      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      stream.getTracks().forEach((track: any) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event: any) => {
        const [streamValue] = event.streams || [];
        if (streamValue) setRemoteStream(streamValue);
      };

      pc.onicecandidate = (event: any) => {
        if (!event.candidate) return;
        socket.emit("ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
      };

      socket.on("connect", () => {
        socket.emit("call:join-room", { roomId });
      });

      socket.on("call:peer-joined", async (payload: any) => {
        if (String(payload?.roomId || "") !== roomId) return;
        if (!isInitiator) return;
        await sendOffer();
      });

      socket.on("offer", async (payload: any) => {
        if (String(payload?.roomId || "") !== roomId) return;
        if (!pcRef.current) return;

        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(payload.sdp),
        );
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit("answer", { roomId, sdp: answer });
      });

      socket.on("answer", async (payload: any) => {
        if (String(payload?.roomId || "") !== roomId) return;
        if (!pcRef.current) return;
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(payload.sdp),
        );
      });

      socket.on("ice-candidate", async (payload: any) => {
        if (String(payload?.roomId || "") !== roomId) return;
        if (!pcRef.current || !payload?.candidate) return;
        try {
          await pcRef.current.addIceCandidate(
            new RTCIceCandidate(payload.candidate),
          );
        } catch {
          // Ignore stale ICE candidates.
        }
      });

      socket.on("call:end", (payload: any) => {
        if (String(payload?.roomId || "") !== roomId) return;
        Alert.alert("Call ended", "The call has ended.");
        cleanup();
        router.back();
      });

      if (socket.connected) {
        socket.emit("call:join-room", { roomId });
      }
    };

    init();

    return () => {
      mounted = false;
      offerSentRef.current = false;
      if (socketRef.current) {
        socketRef.current.emit("call:end", { roomId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      cleanup();
    };
  }, [isInitiator, roomId, router, sendOffer]);

  const onToggleMic = () => {
    if (!localStreamRef.current) return;
    const [audioTrack] = localStreamRef.current.getAudioTracks();
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setMicEnabled(audioTrack.enabled);
  };

  const onToggleCamera = () => {
    if (!localStreamRef.current) return;
    const [videoTrack] = localStreamRef.current.getVideoTracks();
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setCamEnabled(videoTrack.enabled);
  };

  const onSwitchCamera = () => {
    if (!localStreamRef.current) return;
    const [videoTrack] = localStreamRef.current.getVideoTracks();
    const trackAny = videoTrack as any;
    if (trackAny && typeof trackAny._switchCamera === "function") {
      trackAny._switchCamera();
    }
  };

  const onEndCall = () => {
    if (socketRef.current) {
      socketRef.current.emit("call:end", { roomId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    cleanup();
    router.back();
  };

  return (
    <View style={styles.container}>
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
        />
      ) : (
        <View style={styles.waitingWrap}>
          <Text style={styles.waitingText}>Connecting with {peerName}...</Text>
        </View>
      )}

      {localStream ? (
        <RTCView
          streamURL={localStream.toURL()}
          style={styles.localVideo}
          objectFit="cover"
        />
      ) : null}

      <View
        style={[styles.controls, { bottom: Math.max(insets.bottom, 16) + 12 }]}
      >
        <Pressable
          style={[styles.controlBtn, micEnabled && styles.controlBtnActive]}
          onPress={onToggleMic}
        >
          {micEnabled ? (
            <Mic color="#fff" size={20} />
          ) : (
            <MicOff color="#fff" size={20} />
          )}
        </Pressable>
        <Pressable
          style={[styles.controlBtn, camEnabled && styles.controlBtnActive]}
          onPress={onToggleCamera}
        >
          {camEnabled ? (
            <Camera color="#fff" size={20} />
          ) : (
            <CameraOff color="#fff" size={20} />
          )}
        </Pressable>
        <Pressable style={styles.controlBtn} onPress={onSwitchCamera}>
          <Repeat color="#fff" size={20} />
        </Pressable>
        <Pressable
          style={[styles.controlBtn, styles.endBtn]}
          onPress={onEndCall}
        >
          <PhoneOff color="#fff" size={20} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  remoteVideo: { flex: 1 },
  waitingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  waitingText: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "600",
  },
  localVideo: {
    position: "absolute",
    width: 120,
    height: 180,
    right: 16,
    top: 56,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#0F172A",
  },
  controls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnActive: {
    backgroundColor: "rgba(20, 184, 166, 0.2)",
    borderWidth: 1,
    borderColor: "#14B8A6",
    shadowColor: "#06B6D4",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  endBtn: {
    backgroundColor: "#DC2626",
  },
});
