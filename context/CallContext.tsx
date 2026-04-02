import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Alert,
    Animated,
    Easing,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { io, Socket } from "socket.io-client";
import { getAuthToken, getMyProfile, getSocketBaseUrl } from "../services/api";

type IncomingCall = {
  roomId: string;
  callerId: string;
  callerName?: string;
  appointmentId?: string;
};

type OutgoingCall = {
  roomId: string;
  peerName?: string;
  status: "dialing" | "declined" | "timeout";
};

type InitiateCallPayload = {
  receiverId: string;
  peerName?: string;
  appointmentId?: string;
};

type CallContextType = {
  initiateVideoCall: (payload: InitiateCallPayload) => Promise<boolean>;
};

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [outgoingCall, setOutgoingCall] = useState<OutgoingCall | null>(null);
  const [myProfile, setMyProfile] = useState<any>(null);
  const myUserIdRef = useRef("");
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pendingOutgoingRef = useRef<{
    roomId: string;
    peerName?: string;
    receiverId: string;
    appointmentId?: string;
  } | null>(null);
  const initRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringtoneRef = useRef<Audio.Sound | null>(null);

  const ensureMyUserId = useCallback(async () => {
    if (myUserIdRef.current) return myUserIdRef.current;
    const profileRes = await getMyProfile();
    const user = profileRes.data?.user || profileRes.data || null;
    const resolvedId = String(user?._id || user?.id || "");
    if (resolvedId) {
      myUserIdRef.current = resolvedId;
      setMyProfile((prev: any) => prev || user);
    }
    return resolvedId;
  }, []);

  useEffect(() => {
    if (!incomingCall && !outgoingCall) return;

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 820,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 760,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 760,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();
    floatLoop.start();

    return () => {
      pulseLoop.stop();
      floatLoop.stop();
      pulseAnim.setValue(0);
      floatAnim.setValue(0);
    };
  }, [incomingCall, outgoingCall, pulseAnim, floatAnim]);

  useEffect(() => {
    const startRingtone = async () => {
      if (!incomingCall) return;

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });

        if (ringtoneRef.current) {
          await ringtoneRef.current.stopAsync();
          await ringtoneRef.current.unloadAsync();
          ringtoneRef.current = null;
        }

        const { sound } = await Audio.Sound.createAsync(
          require("../assets/audio/call-ringtone.wav"),
          {
            isLooping: true,
            shouldPlay: true,
            volume: 1,
          },
        );

        ringtoneRef.current = sound;
      } catch {
        // Ignore ringtone failures to avoid blocking call UX.
      }
    };

    const stopRingtone = async () => {
      if (!ringtoneRef.current) return;
      try {
        await ringtoneRef.current.stopAsync();
        await ringtoneRef.current.unloadAsync();
      } catch {
        // Ignore cleanup failures.
      } finally {
        ringtoneRef.current = null;
      }
    };

    if (incomingCall) {
      startRingtone();
    } else {
      stopRingtone();
    }

    return () => {
      stopRingtone();
    };
  }, [incomingCall]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (socketRef.current?.connected) return;

      const token = await getAuthToken();
      if (!token) {
        if (mounted) {
          initRetryRef.current = setTimeout(() => {
            init();
          }, 1500);
        }
        return;
      }

      const profileRes = await getMyProfile();
      const user = profileRes.data?.user || profileRes.data || null;
      if (mounted) {
        if (user) {
          setMyProfile(user);
          myUserIdRef.current = String(user?._id || user?.id || "");
        }
      }

      const socket = io(getSocketBaseUrl(), {
        transports: ["websocket"],
        auth: { token },
      });
      socketRef.current = socket;

      socket.on("connect_error", () => {
        if (!mounted) return;
        if (initRetryRef.current) clearTimeout(initRetryRef.current);
        initRetryRef.current = setTimeout(() => {
          if (!socketRef.current?.connected) {
            socketRef.current = null;
            init();
          }
        }, 1200);
      });

      socket.on("disconnect", () => {
        if (!mounted) return;
        if (initRetryRef.current) clearTimeout(initRetryRef.current);
        initRetryRef.current = setTimeout(() => {
          if (!socketRef.current?.connected) {
            socketRef.current = null;
            init();
          }
        }, 1200);
      });

      socket.on("call:incoming", (payload: any) => {
        const callerId = String(payload?.callerId || "");
        const selfId = String(myUserIdRef.current || "");
        const roomId = String(payload?.roomId || "");

        // Guard: ignore malformed/self incoming events so caller never sees
        // accept/decline modal for their own initiated call.
        if (!roomId || !callerId) return;
        if (selfId && callerId === selfId) return;
        if (
          pendingOutgoingRef.current &&
          String(pendingOutgoingRef.current.roomId) === roomId
        ) {
          return;
        }

        setIncomingCall({
          roomId,
          callerId,
          callerName: payload?.callerName
            ? String(payload.callerName)
            : "Incoming call",
          appointmentId: payload?.appointmentId
            ? String(payload.appointmentId)
            : undefined,
        });
      });

      socket.on("call:accept", (payload: any) => {
        const pending = pendingOutgoingRef.current;
        if (!pending) return;
        if (String(payload?.roomId || "") !== String(pending.roomId)) return;

        setOutgoingCall(null);
        pendingOutgoingRef.current = null;
        router.push({
          pathname: "/call/[roomId]",
          params: {
            roomId: pending.roomId,
            initiator: "true",
            peerId: pending.receiverId,
            peerName: pending.peerName || "Participant",
            appointmentId: pending.appointmentId || "",
          },
        });
      });

      socket.on("call:decline", (payload: any) => {
        const pending = pendingOutgoingRef.current;
        const declinedRoomId = String(payload?.roomId || "");

        if (pending && declinedRoomId === String(pending.roomId)) {
          setOutgoingCall((prev) => {
            if (!prev || String(prev.roomId) !== String(pending.roomId)) {
              return prev;
            }
            return { ...prev, status: "declined" };
          });
        }

        // Also close callee incoming modal when caller cancels/declines.
        setIncomingCall((prev) => {
          if (!prev || String(prev.roomId) !== declinedRoomId) return prev;
          return null;
        });
      });

      socket.on("call:timeout", (payload: any) => {
        const pending = pendingOutgoingRef.current;
        if (!pending) return;
        if (String(payload?.roomId || "") !== String(pending.roomId)) return;
        setOutgoingCall((prev) => {
          if (!prev || String(prev.roomId) !== String(pending.roomId)) {
            return prev;
          }
          return { ...prev, status: "timeout" };
        });
      });

      socket.on("call:end", (payload: any) => {
        const roomId = String(payload?.roomId || "");
        setOutgoingCall((prev) => {
          if (!prev || String(prev.roomId) !== roomId) return prev;
          return null;
        });
        setIncomingCall((prev) => {
          if (!prev || String(prev.roomId) !== roomId) return prev;
          return null;
        });
      });
    };

    init();

    return () => {
      mounted = false;
      if (initRetryRef.current) {
        clearTimeout(initRetryRef.current);
        initRetryRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [router]);

  const initiateVideoCall = useCallback(
    async (payload: InitiateCallPayload) => {
      let socket = socketRef.current;

      if (socket && !socket.connected) {
        try {
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
              socket?.off("connect", onConnect);
              socket?.off("connect_error", onError);
              reject(new Error("Socket connect timeout"));
            }, 1800);

            const onConnect = () => {
              clearTimeout(timer);
              socket?.off("connect_error", onError);
              resolve();
            };

            const onError = () => {
              clearTimeout(timer);
              socket?.off("connect", onConnect);
              reject(new Error("Socket connect error"));
            };

            socket?.once("connect", onConnect);
            socket?.once("connect_error", onError);
            socket?.connect();
          });
        } catch {
          // Fall through to shared unavailable alert below.
        }
      }

      socket = socketRef.current;
      if (!socket?.connected) {
        Alert.alert("Call unavailable", "Please try again in a moment.");
        return false;
      }

      const ensuredSelfId = await ensureMyUserId();

      const receiverId = String(payload.receiverId || "").trim();
      const selfId = String(ensuredSelfId || myUserIdRef.current || "");

      if (!receiverId) {
        Alert.alert("Call unavailable", "Receiver not found.");
        return false;
      }

      if (selfId && receiverId === selfId) {
        Alert.alert("Call unavailable", "You cannot call yourself.");
        return false;
      }

      return new Promise<boolean>((resolve) => {
        socket.emit(
          "call:initiate",
          {
            callerName: myProfile?.name || "Caller",
            receiverId,
            role: myProfile?.role,
            appointmentId: payload.appointmentId,
          },
          (ack: any) => {
            if (!ack?.ok || !ack?.roomId) {
              Alert.alert("Call failed", ack?.error || "Unable to start call");
              resolve(false);
              return;
            }

            pendingOutgoingRef.current = {
              roomId: String(ack.roomId),
              peerName: payload.peerName,
              receiverId,
              appointmentId:
                payload.appointmentId || String(ack.appointmentId || ""),
            };
            setOutgoingCall({
              roomId: String(ack.roomId),
              peerName: payload.peerName || "Participant",
              status: "dialing",
            });
            resolve(true);
          },
        );
      });
    },
    [ensureMyUserId, myProfile],
  );

  const onAcceptIncomingCall = useCallback(() => {
    const call = incomingCall;
    if (!call || !socketRef.current) return;

    socketRef.current.emit(
      "call:accept",
      { roomId: call.roomId },
      (ack: any) => {
        if (!ack?.ok) {
          Alert.alert("Call error", ack?.error || "Unable to accept call");
          return;
        }

        setIncomingCall(null);
        router.push({
          pathname: "/call/[roomId]",
          params: {
            roomId: call.roomId,
            initiator: "false",
            peerId: call.callerId,
            peerName: call.callerName || "Participant",
            appointmentId: call.appointmentId || "",
          },
        });
      },
    );
  }, [incomingCall, router]);

  const onDeclineIncomingCall = useCallback(() => {
    if (!incomingCall || !socketRef.current) return;
    socketRef.current.emit("call:decline", { roomId: incomingCall.roomId });
    setIncomingCall(null);
  }, [incomingCall]);

  const onCancelOutgoingCall = useCallback(() => {
    if (!outgoingCall || !socketRef.current) return;

    // While ringing (before accept), cancel should be treated as decline so
    // callee incoming modal closes immediately.
    socketRef.current.emit("call:decline", { roomId: outgoingCall.roomId });
    pendingOutgoingRef.current = null;
    setOutgoingCall(null);
  }, [outgoingCall]);

  const value = useMemo(
    () => ({
      initiateVideoCall,
    }),
    [initiateVideoCall],
  );

  return (
    <CallContext.Provider value={value}>
      {children}
      <Modal
        visible={Boolean(incomingCall)}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.ringerOverlay}>
          <Text style={styles.ringerLabel}>Incoming video call</Text>
          <Text style={styles.ringerName}>
            {incomingCall?.callerName || "Doctor"}
          </Text>

          <View style={styles.avatarZone}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.05],
                      }),
                    },
                  ],
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.34, 0],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.pulseRingSecondary,
                {
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.72],
                      }),
                    },
                  ],
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.28, 0],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.avatarCore,
                {
                  transform: [
                    {
                      translateY: floatAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -5],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.avatarInitial}>
                {String(incomingCall?.callerName || "D")
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </Animated.View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.circleAction, styles.declineCircle]}
              onPress={onDeclineIncomingCall}
            >
              <Text style={styles.circleText}>Decline</Text>
            </Pressable>
            <Pressable
              style={[styles.circleAction, styles.acceptCircle]}
              onPress={onAcceptIncomingCall}
            >
              <Text style={styles.circleText}>Accept</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(outgoingCall)}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.ringerOverlay}>
          <Text style={styles.ringerLabel}>Calling...</Text>
          <Text style={styles.ringerName}>
            {outgoingCall?.peerName || "Participant"}
          </Text>

          <View style={styles.avatarZone}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.05],
                      }),
                    },
                  ],
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.34, 0],
                  }),
                },
              ]}
            />
            <Animated.View style={styles.avatarCoreOutgoing}>
              <Text style={styles.avatarInitial}>
                {String(outgoingCall?.peerName || "P")
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </Animated.View>
          </View>

          <Text style={styles.subText}>
            {outgoingCall?.status === "dialing"
              ? "Ringing..."
              : outgoingCall?.status === "declined"
                ? "Call declined"
                : "No response"}
          </Text>

          <Pressable
            style={[styles.rectAction, styles.declineRect]}
            onPress={onCancelOutgoingCall}
          >
            <Text style={styles.btnText}>
              {outgoingCall?.status === "dialing" ? "Cancel Call" : "Close"}
            </Text>
          </Pressable>
        </View>
      </Modal>
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error("useCall must be used within CallProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  ringerOverlay: {
    flex: 1,
    backgroundColor: "#111B2E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  ringerLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B6CCE9",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  ringerName: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: "800",
    color: "#F8FAFC",
    textAlign: "center",
  },
  avatarZone: {
    marginTop: 30,
    width: 230,
    height: 230,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: "#5A86CE",
  },
  pulseRingSecondary: {
    position: "absolute",
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: "#7098D8",
  },
  avatarCore: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: "#4F7FC9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#D6E6FA",
  },
  avatarCoreOutgoing: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: "#3F67A8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#C0D9F8",
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
  },
  subText: {
    marginTop: 20,
    textAlign: "center",
    color: "#D6E2F2",
    fontSize: 14,
    fontWeight: "600",
  },
  actionsRow: {
    marginTop: 34,
    flexDirection: "row",
    gap: 22,
  },
  circleAction: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  rectAction: {
    marginTop: 28,
    minWidth: 180,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  acceptCircle: { backgroundColor: "#16A34A" },
  declineCircle: { backgroundColor: "#DC2626" },
  declineRect: { backgroundColor: "#DC2626" },
  btnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  circleText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
});
