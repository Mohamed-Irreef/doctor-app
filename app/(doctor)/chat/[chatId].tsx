import { useLocalSearchParams } from "expo-router";
import React from "react";
import RealtimeChatScreen from "../../../components/chat/RealtimeChatScreen";

export default function DoctorChatScreen() {
  const params = useLocalSearchParams<{
    chatId: string;
    patientName?: string;
    patientImage?: string;
    patientId?: string;
    isBlocked?: string;
    blockedBy?: string;
  }>();

  return (
    <RealtimeChatScreen
      chatId={String(params.chatId || "")}
      peerName={String(params.patientName || "Patient")}
      peerImage={params.patientImage ? String(params.patientImage) : ""}
      peerId={params.patientId ? String(params.patientId) : undefined}
      currentRole="doctor"
      initialBlocked={String(params.isBlocked || "false") === "true"}
      initialBlockedBy={params.blockedBy ? String(params.blockedBy) : null}
    />
  );
}
