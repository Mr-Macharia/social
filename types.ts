
export interface Scene {
  scene: number;
  description: string;
  imagePrompt: string;
  videoPrompt: string;
}

export interface Caption {
  startTime: number;
  endTime: number;
  text: string;
  narrationText: string;
}

export interface ViralVideoScript {
  title: string;
  hook: string;
  narrationScript: string;
  sceneBreakdown: Scene[];
  captions: Caption[];
}
