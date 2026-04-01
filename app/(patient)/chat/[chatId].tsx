import { useLocalSearchParams } from "expo-router";
import React from "react";
import RealtimeChatScreen from "../../../components/chat/RealtimeChatScreen";

export default function PatientChatScreen() {
  const params = useLocalSearchParams<{
    chatId: string;
    doctorName?: string;
    doctorImage?: string;
    doctorId?: string;
    isBlocked?: string;
    blockedBy?: string;
  }>();

  return (
    <RealtimeChatScreen
      chatId={String(params.chatId || "")}
      peerName={String(params.doctorName || "Doctor")}
      peerImage={params.doctorImage ? String(params.doctorImage) : ""}
      peerId={params.doctorId ? String(params.doctorId) : undefined}
      currentRole="patient"
      initialBlocked={String(params.isBlocked || "false") === "true"}
      initialBlockedBy={params.blockedBy ? String(params.blockedBy) : null}
    />
  );
}
