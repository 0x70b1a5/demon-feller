import Enemy, { EnemyConfig } from "./Enemy";
import { GameScene } from "./scenes/GameScene";

export default class Goo extends Enemy {
  speed = 150
  health = 3
  knockback = 150

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)
  }
}