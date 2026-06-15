import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1Hook } from './video_scenes/Scene1Hook';
import { Scene2Reveal } from './video_scenes/Scene2Reveal';
import { Scene3Features } from './video_scenes/Scene3Features';
import { Scene4Dashboard } from './video_scenes/Scene4Dashboard';
import { Scene5Outro } from './video_scenes/Scene5Outro';

export const SCENE_DURATIONS: Record<string, number> = {
  hook: 8000,
  reveal: 6000,
  features: 14000,
  dashboard: 10000,
  outro: 8000,
};

const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let cumulativeMs = 0;
  for (const [key, ms] of Object.entries(SCENE_DURATIONS)) {
    out[key] = cumulativeMs / 1000;
    cumulativeMs += ms;
  }
  return out;
})();

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  hook: Scene1Hook,
  reveal: Scene2Reveal,
  features: Scene3Features,
  dashboard: Scene4Dashboard,
  outro: Scene5Outro,
};

const AUDIO_SEEK_EPSILON_SEC = 0.18;

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentScene, currentSceneKey } = useVideoPlayer({ durations, loop });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    const targetTime = SCENE_START_SEC[baseSceneKey] ?? 0;
    if (Math.abs(audio.currentTime - targetTime) > AUDIO_SEEK_EPSILON_SEC) {
      audio.currentTime = targetTime;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey, muted]);

  return (
    <>
      <div className="relative w-full h-screen overflow-hidden bg-bg-dark text-text-primary font-body">
        {/* Persistent Background Layer */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <motion.div
            className="absolute w-[80vw] h-[80vw] rounded-full opacity-10 blur-[100px]"
            style={{ background: 'radial-gradient(circle, var(--color-accent), transparent)' }}
            animate={{
              x: sceneIndex % 2 === 0 ? '-20%' : '40%',
              y: sceneIndex % 3 === 0 ? '-10%' : '30%',
              scale: [1, 1.2, 0.9, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-[60vw] h-[60vw] rounded-full opacity-5 blur-[80px] right-0 bottom-0"
            style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }}
            animate={{
              x: sceneIndex % 2 === 0 ? '10%' : '-30%',
              y: sceneIndex % 2 === 0 ? '10%' : '-40%',
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <AnimatePresence mode="popLayout">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
      </div>
      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`}
        preload="auto"
        autoPlay
        muted={muted}
      />
    </>
  );
}
