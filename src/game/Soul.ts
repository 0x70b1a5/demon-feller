import Enemy, { EnemyConfig } from "./Enemy";
import { GameScene } from "./scenes/GameScene";

export default class Soul extends Enemy {
  speed = 210
  health = 2
  knockback = 50

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)
    this.setSize(150, 175)
  }
}