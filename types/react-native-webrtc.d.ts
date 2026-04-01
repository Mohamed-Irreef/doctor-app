declare module "react-native-webrtc" {
  export class MediaStream {
    toURL(): string;
    getTracks(): any[];
    getAudioTracks(): any[];
    getVideoTracks(): any[];
  }

  export const mediaDevices: {
    getUserMedia(constraints: {
      audio: boolean;
      video: boolean | object;
    }): Promise<MediaStream>;
  };

  export class RTCPeerConnection {
    constructor(config: any);
    ontrack: ((event: any) => void) | null;
    onicecandidate: ((event: any) => void) | null;
    addTrack(track: any, stream: MediaStream): void;
    createOffer(): Promise<any>;
    createAnswer(): Promise<any>;
    setLocalDescription(desc: any): Promise<void>;
    setRemoteDescription(desc: any): Promise<void>;
    addIceCandidate(candidate: any): Promise<void>;
    close(): void;
  }

  export class RTCIceCandidate {
    constructor(candidate: any);
  }

  export class RTCSessionDescription {
    constructor(desc: any);
  }

  export const RTCView: any;
}
