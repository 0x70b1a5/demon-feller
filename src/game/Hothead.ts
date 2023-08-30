import Enemy, { EnemyConfig } from "./Enemy";
import EventEmitter from "./EventEmitter";
import { Explodable } from "./Explodable";
import TILE_MAPPING from "./constants/tiles";
import { GameScene } from "./scenes/GameScene";
import animations from "./util/animate";

export default class Hothead extends Enemy {
  speed = 600
  health = 1
  knockback = 600
  dangerRadiusInTiles = 1.5
  explodable!: Explodable

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)

    this.health *= config.level
    this.damage = config.level

    this.explodable = new Explodable(scene)
    this.setSize(100, 100)

    if (!scene.anims.exists('hothead-jump')) {   
      scene.anims.create({
        key: 'hothead-jump',
        frames: scene.anims.generateFrameNumbers('hothead-sheet', { frames: [0, 1] }),
        frameRate: 60,
        repeat: 0
      })
    }

    this.scene.physics.add.overlap(this, [...this.scene.stuffs, this.scene.feller.sprite], (me, stuff) => {
      if (this.seenFeller) this.explode()
    })
  }

  hit(by: Phaser.Types.Math.Vector2Like & { damage: number, knockback: number }) {
    EventEmitter.emit('playSound', 'goosquelch')
    super.hit(by)
  }

  explode() {
    this.explodable.explode(this)
    this.die()
  }

  move() {
    return
  }

  die() {
    EventEmitter.emit('playSound', 'hotheadDie')
    super.die()
  }

  launched = false
  prevVX = 0
  prevVY = 0
  fixedUpdate(time: number, delta: number) {
    if (this.dead) return
    super.fixedUpdate(time, delta)

    if (!this.launched) {
      if (this.seenFeller) {
        const fellerNearX = Math.abs(this.x - this.scene.feller.sprite.x) < this.scene.map.tileWidth/2
        const fellerNearY = Math.abs(this.y - this.scene.feller.sprite.y) < this.scene.map.tileHeight/2
        if (fellerNearX || fellerNearY) {
          this.launched = true
          this.anims.play('hothead-jump')
          EventEmitter.emit('playSound', 'hotheadYell')
          const fellerAbove = this.scene.feller.sprite.y < this.y
          const fellerLeft = this.scene.feller.sprite.x < this.x
          if (fellerNearY) {
            this.setVelocityX((fellerLeft ? -1 : 1) * this.speed)
            if (fellerLeft) {
              this.setRotation(-Math.PI/2)
            } else {
              this.setRotation(Math.PI/2)
            }
          } else {
            this.setVelocityY((fellerAbove ? -1 : 1) * this.speed)
            if (!fellerAbove) {
              this.setRotation(Math.PI)
            }
          }
        }
      }
    } else {
      if (this.body) {
        if ((this.prevVX > 0 && this.prevVX === -this.body.velocity.x) || (this.prevVY > 0 && this.prevVY === -this.body.velocity.y)) {
          // an extremely upsetting hack to trigger explosions on bounce
          this.explode()
        } else {
          this.prevVX = this.body.velocity.x
          this.prevVY = this.body.velocity.y
        }
      }
    }
  }
}