import Enemy, { EnemyConfig } from "./Enemy";
import EventEmitter from "./EventEmitter";
import { GameScene } from "./scenes/GameScene";

export default class Soul extends Enemy {
  speed = 210
  health = 2
  knockback = 1000

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)

    this.setSize(150, 175)

    this.health *= config.level
    this.damage = config.level

    if ((!scene.anims.exists('soul-walk'))) {   
      scene.anims.create({
        key: 'soul-walk',
        frames: scene.anims.generateFrameNumbers('soul-sheet', { frames: [0,1] }),
        frameRate: 2,
        repeat: -1
      })
    }

    this.anims.play('soul-walk')
  }

  hit(by: any) {
    EventEmitter.emit('playSound', 'soulgrunt')
    super.hit(by)
  }

  die() {
    EventEmitter.emit('playSound', 'soulgrumble')
    super.die()
  }
}