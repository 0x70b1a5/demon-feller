import Enemy, { EnemyConfig } from "./Enemy";
import { GameScene } from "./scenes/GameScene";

export default class Goo extends Enemy {
  velocity = 200
  health = 3

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)
  }
}