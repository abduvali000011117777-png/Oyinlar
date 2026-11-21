import { useEffect, useMemo, useState } from 'react';
import DashboardPortal from './components/DashboardPortal';
import GamePlayModal from './components/GamePlayModal';
import OnboardingFlow from './components/OnboardingFlow';
import { getGamesByAgeGroup } from './data/gamesCatalog';
import { generateAiRecommendation } from './services/aiRecommender';
import { audioService } from './services/audioService';
import {
  clearUserProfile,
  createDefaultProfile,
  loadUserProfile,
  recordGameCompletion,
  saveUserProfile,
  updateAudioSettings,
} from './services/storageService';
import {
  AgeGroupId,
  GameDefinition,
  GameSessionResult,
  UserProfile,
} from './types/platform';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(() => loadUserProfile());
  const [activeGame, setActiveGame] = useState<GameDefinition | null>(null);

  useEffect(() => {
    if (profile) {
      audioService.configure(profile.audio);
    }
  }, [profile]);

  const aiRecommendation = useMemo(
    () => (profile ? generateAiRecommendation(profile) : null),
    [profile]
  );

  const handleOnboardingComplete = (name: string, ageGroup: AgeGroupId) => {
    const newProfile = createDefaultProfile(name, ageGroup);
    saveUserProfile(newProfile);
    setProfile(newProfile);
  };

  const handleUpdateProfile = (next: UserProfile) => {
    saveUserProfile(next);
    setProfile(next);
  };

  const handleResetProfile = () => {
    audioService.stopBackgroundMusic();
    clearUserProfile();
    setActiveGame(null);
    setProfile(null);
  };

  const handleGameFinished = (session: GameSessionResult) => {
    if (!profile) {
      throw new Error('Profil topilmadi');
    }
    const { updatedProfile, summary } = recordGameCompletion(profile, session);
    setProfile(updatedProfile);
    return summary;
  };

  const handleNextGame = () => {
    if (!profile || !activeGame) return;
    const ageGames = getGamesByAgeGroup(profile.ageGroup);
    const idx = ageGames.findIndex((g) => g.id === activeGame.id);
    const next = ageGames[(idx + 1) % ageGames.length];
    if (next) setActiveGame(next);
  };

  if (!profile) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      <DashboardPortal
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        onLaunchGame={(game) => {
          audioService.playClick();
          setActiveGame(game);
        }}
        onResetProfile={handleResetProfile}
      />

      {activeGame && (
        <GamePlayModal
          game={activeGame}
          initialDifficulty={aiRecommendation?.suggestedDifficulty ?? activeGame.difficulty}
          soundEnabled={profile.audio.soundEnabled}
          onToggleSound={() => {
            const next = updateAudioSettings(profile, {
              soundEnabled: !profile.audio.soundEnabled,
            });
            setProfile(next);
          }}
          onGameFinished={handleGameFinished}
          onNextGame={handleNextGame}
          onClose={() => setActiveGame(null)}
        />
      )}
    </>
  );
}
