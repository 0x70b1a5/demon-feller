import Enemy, { EnemyConfig, EnemyType } from "./Enemy";
import EventEmitter from "./EventEmitter";
import Imp from "./Imp";
import { GameScene } from "./scenes/GameScene";

export default class ImpMother extends Enemy {
  speed = 0
  health = 8
  knockback = 0
  spawnCooldown = 0
  SPAWN_COOLDOWN_MS = 2000

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)
    this.health *= config.level

    if ((!scene.anims.exists('impmother-birth'))) {   
      scene.anims.create({
        key: 'impmother-birth',
        frames: scene.anims.generateFrameNumbers('impmother-sheet', { frames: [1,0] }),
        frameRate: 2,
      })
    }
  }

  fixedUpdate(time: any, delta: any) {
    if (this.seenFeller && !this.dead && this.scene) {
      if (this.spawnCooldown <= 0) {
        this.scene.spawnEnemy(EnemyType.Imp, this.room, 0, 0)
          ?.setX(this.x)
          .setY(this.y)
        this.spawnCooldown = this.SPAWN_COOLDOWN_MS
        EventEmitter.emit('playSound', 'goosquelch')
        this.anims.play('impmother-birth')
      } else {
        this.spawnCooldown -= delta;
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