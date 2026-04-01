import { useLocalSearchParams } from "expo-router";
import React from "react";
import VideoCallScreen from "../../components/call/VideoCallScreen";

export default function CallRoomScreen() {
  const params = useLocalSearchParams<{
    roomId: string;
    initiator?: string;
    peerId?: string;
    peerName?: string;
    appointmentId?: string;
  }>();

  return (
    <VideoCallScreen
      roomId={String(params.roomId || "")}
      isInitiator={String(params.initiator || "false") === "true"}
      peerId={params.peerId ? String(params.peerId) : ""}
      peerName={params.peerName ? String(params.peerName) : "Participant"}
      appointmentId={params.appointmentId ? String(params.appointmentId) : ""}
    />
  );
}
