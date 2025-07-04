
export interface Scene {
  scene: number;
  description: string;
  imagePrompt: string;
}

export interface Caption {
  startTime: number;
  endTime: number;
  text: string;
}

export interface ViralVideoScript {
  title: string;
  hook: string;
  narrationScript: string;
  sceneBreakdown: Scene[];
  captions: Caption[];
}
