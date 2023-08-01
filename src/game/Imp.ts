import Enemy, { EnemyConfig } from "./Enemy";
import EventEmitter from "./EventEmitter";
import { GameScene } from "./scenes/GameScene";

export default class Imp extends Enemy {
  speed = 300
  health = 1
  knockback = 50

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)
    this.health *= config.level || 1
    this.speed *= config.level || 1
  }

  update(time: any, delta: any) {
    if (time % 1000 === delta) {
      this.movementAngle *= Math.random()
    }
  }

  hit(by: any) {
    EventEmitter.emit('playSound', 'impsqueak')
    super.hit(by)
  }

  die() {
    EventEmitter.emit('playSound', 'impdie')
    super.die()
  }
}