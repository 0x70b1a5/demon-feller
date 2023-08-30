import Enemy, { EnemyConfig } from "./Enemy";
import EventEmitter from "./EventEmitter";
import { GameScene } from "./scenes/GameScene";

export default class Goo extends Enemy {
  speed = 150
  health = 3
  knockback = 250

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)

    

    if ((!scene.anims.exists('goo-walk'))) {   
      scene.anims.create({
        key: 'goo-walk',
        frames: scene.anims.generateFrameNumbers('goo-sheet', { frames: [0,1] }),
        frameRate: 2,
        repeat: -1
      })
    }

    this.anims.play('goo-walk')
  }

  hit(by: Phaser.Types.Math.Vector2Like & { damage: number, knockback: number }) {
    EventEmitter.emit('playSound', 'goosquelch')
    super.hit(by)
  }

  die() {
    EventEmitter.emit('playSound', 'goosquish')
    super.die()
  }
}