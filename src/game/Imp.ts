import Enemy, { EnemyConfig } from "./Enemy";
import EventEmitter from "./EventEmitter";
import { GameScene } from "./scenes/GameScene";

export default class Imp extends Enemy {
  speed = 200
  health = 1
  knockback = 1500

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)
    
    this.speed = scene.feller.speed
  }

  fixedUpdate(time: any, delta: any) {
    if (this.seenFeller && !this.dead && delta % 10 === 0) {
      console.log('IMPIN')
      this.movementAngle *= Math.random()
    }
    super.fixedUpdate(time, delta)
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