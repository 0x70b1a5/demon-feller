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
  dangerRadiusInTiles = 1
  explodable!: Explodable

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)

    this.health *= (config.level)
    this.explodable = new Explodable(scene)

    if ((!scene.anims.exists('hothead-jump'))) {   
      scene.anims.create({
        key: 'hothead-jump',
        frames: scene.anims.generateFrameNumbers('hothead-sheet', { frames: [0,1] }),
        frameRate: 2
      })
    }

    this.scene.physics.add.collider(this, this.scene.groundLayer, (me, wall) => {
      if (TILE_MAPPING.WALLS_ITEMS_DOORS.includes((wall as Phaser.Tilemaps.Tile)?.index)) {
        this.explode()
      }
    })

    this.scene.physics.add.collider(this, this.scene.stuffs, (me, stuff) => {
      this.explode()
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

  launched = false
  fixedUpdate(delta: number) {
    if (!this.launched && this.seenFeller) {
      const fellerNearX = Math.abs(this.x - this.scene.feller.sprite.x) < this.scene.map.tileWidth
      const fellerNearY = Math.abs(this.y - this.scene.feller.sprite.y) < this.scene.map.tileHeight
      if (fellerNearX || fellerNearY) {
        this.launched = true
        this.anims.play('hothead-jump')
        // EventEmitter.emit('playSound', 'hotheadYell')
        const fellerAbove = this.scene.feller.sprite.y < this.y
        const fellerLeft = this.scene.feller.sprite.x < this.x
        if (fellerNearX) {
          this.setVelocityX((fellerLeft ? -1 : 1) * this.speed)
            .setRotation((fellerLeft ? -1 : 1) * Math.PI/2)
        } else {
          this.setVelocityY((fellerAbove ? -1 : 1) * this.speed)
            .setRotation((fellerAbove ? 1 : 0) * Math.PI)
        }
      }
    }
  }
}