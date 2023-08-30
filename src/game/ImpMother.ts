import Enemy, { EnemyConfig, EnemyType } from "./Enemy";
import EventEmitter from "./EventEmitter";
import { GameScene } from "./scenes/GameScene";

export default class ImpMother extends Enemy {
  speed = 0
  health = 8
  knockback = 0
  spawnCooldown = 0
  SPAWN_COOLDOWN_MS = 3000

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)

    this.setSize(190, 190)

    this.SPAWN_COOLDOWN_MS /= Math.sqrt(config.level/3 || 1)

    if ((!scene.anims.exists('impmother-wiggle'))) {   
      scene.anims.create({
        key: 'impmother-wiggle',
        frames: scene.anims.generateFrameNumbers('impmother-sheet', { frames: [1,1,1,0] }),
        frameRate: 1,
      })
    }
  }

  findPathToTarget(delta: number): void {
    return
  }

  takePathToTarget(): void {
    return
  }

  wobble(): void {
    return
  }

  chaseTarget(delta: number): void {
    return
  }

  fixedUpdate(time: any, delta: any) {
    if (this.stun <= 0) {
      if (this.seenFeller && !this.dead && this.scene) {
        if (this.spawnCooldown <= 0) {
          this.scene.spawnEnemy(EnemyType.Imp, this.room, 0, 0)
            ?.setX(this.x)
            .setY(this.y)
          this.setDepth(this.depth + 1)
          this.spawnCooldown = this.SPAWN_COOLDOWN_MS
          this.anims.play('impmother-wiggle')
          EventEmitter.emit('playSound', 'squeak')
          EventEmitter.emit('demonsToFell', ++this.scene.demonsToFell)
          this.scene.tweens.add({
            targets: this,
            scale: {
              y: { from: 0.8, to: 1 }
            }, 
            duration: 500,
            ease: 'Power2'
          })
        } else {
          this.spawnCooldown -= delta;
        }
      }
    }
    super.fixedUpdate(time, delta)
  }

  hit(by: any) {
    EventEmitter.emit('playSound', 'goosquelch')
    super.hit(by)
  }

  die() {
    EventEmitter.emit('playSound', 'goosquish')
    super.die()
  }
}