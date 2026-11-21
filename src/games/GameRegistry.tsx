import { ComponentType } from 'react';
import { GameEngineProps } from '../types/platform';
import {
  AnimalsSoundGame,
  BigOrSmallGame,
  ColorPuzzleGame,
  ColorsGame,
  FindPairsGame,
  FruitsSortGame,
  LittleMathCountingGame,
  MemoryCardsGame,
  ShadowMatchGame,
  ShapesGame,
} from './EarlyChildhoodGames';
import {
  CodingAdventureGame,
  LogicMazeGame,
  MathAdventureGame,
  SequenceFinderGame,
  ShapeConstructorGame,
  SimonChampionGame,
  SpaceMissionGame,
  SpeedMathGame,
  SpotDifferenceGame,
  WordMasterGame,
} from './AdventureGames';
import {
  CipherBreakerGame,
  CodeMasterGame,
  DetectiveSecretsGame,
  Geometric3DWorldGame,
  IqBattleGame,
  MathArenaGame,
  MemoryMasterGame,
  PhysicsLabGame,
  RapidThinkingGame,
  StrategyKingdomGame,
} from './TeenObservatoryGames';
import {
  BusinessSimulatorGame,
  CryptoMasterGame,
  CyberDetectiveGame,
  GrandmasterLogicGame,
  IqChallengeProGame,
  MathGeniusGame,
  MindHackerGame,
  NeuralMemoryGame,
  QuantumLabGame,
  StrategicEmpireGame,
} from './GrandmasterGames';

export const GAME_COMPONENTS: Record<string, ComponentType<GameEngineProps>> = {
  // 3-5 yosh (10 ta)
  'age1-colors': ColorsGame,
  'age1-shapes': ShapesGame,
  'age1-animals': AnimalsSoundGame,
  'age1-fruits': FruitsSortGame,
  'age1-counting': LittleMathCountingGame,
  'age1-shadows': ShadowMatchGame,
  'age1-pairs': FindPairsGame,
  'age1-puzzle': ColorPuzzleGame,
  'age1-sizes': BigOrSmallGame,
  'age1-memory': MemoryCardsGame,

  // 6-9 yosh (10 ta)
  'age2-math-adv': MathAdventureGame,
  'age2-maze': LogicMazeGame,
  'age2-simon': SimonChampionGame,
  'age2-words': WordMasterGame,
  'age2-speed-math': SpeedMathGame,
  'age2-spot-diff': SpotDifferenceGame,
  'age2-tangram': ShapeConstructorGame,
  'age2-coding': CodingAdventureGame,
  'age2-sequence': SequenceFinderGame,
  'age2-space': SpaceMissionGame,

  // 10-15 yosh (10 ta)
  'age3-iq-battle': IqBattleGame,
  'age3-math-arena': MathArenaGame,
  'age3-detective': DetectiveSecretsGame,
  'age3-code-master': CodeMasterGame,
  'age3-physics': PhysicsLabGame,
  'age3-strategy-kingdom': StrategyKingdomGame,
  'age3-memory-master': MemoryMasterGame,
  'age3-geometry-3d': Geometric3DWorldGame,
  'age3-cipher': CipherBreakerGame,
  'age3-rapid-logic': RapidThinkingGame,

  // 16-20 yosh (10 ta)
  'age4-grandmaster': GrandmasterLogicGame,
  'age4-iq-pro': IqChallengeProGame,
  'age4-empire': StrategicEmpireGame,
  'age4-crypto': CryptoMasterGame,
  'age4-math-genius': MathGeniusGame,
  'age4-quantum': QuantumLabGame,
  'age4-cyber': CyberDetectiveGame,
  'age4-neural-memory': NeuralMemoryGame,
  'age4-business': BusinessSimulatorGame,
  'age4-mind-hacker': MindHackerGame,
};
