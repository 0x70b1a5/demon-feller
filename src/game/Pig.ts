import Enemy, { EnemyConfig } from "./Enemy";
import { GameScene } from "./scenes/GameScene";

export default class Pig extends Enemy {
  velocity = 100
  health = 6

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)
  }

}