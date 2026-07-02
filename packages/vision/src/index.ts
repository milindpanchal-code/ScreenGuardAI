export type PostureState = "unknown" | "healthy" | "leaning" | "too-close";

export type PostureEstimate = {
  state: PostureState;
  confidence: number;
};

export interface MonitoringEngine {
  estimate(frame: VideoFrame | HTMLVideoElement): Promise<PostureEstimate>;
}

export class PlaceholderMonitoringEngine implements MonitoringEngine {
  async estimate(): Promise<PostureEstimate> {
    return {
      state: "unknown",
      confidence: 0
    };
  }
}
