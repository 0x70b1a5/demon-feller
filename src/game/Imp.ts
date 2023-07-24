import Enemy, { EnemyConfig } from "./Enemy";
import { GameScene } from "./scenes/GameScene";

export default class Imp extends Enemy {
  speed = 300
  health = 1
  knockback = 50

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)
  }

  update(time: any, delta: any) {
    if (time % 1000 === delta) {
      this.movementAngle *= Math.random()
    }
  }
}