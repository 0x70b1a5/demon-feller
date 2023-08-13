import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import Enemy, { EnemyConfig } from './Enemy';
import Feller from './Feller';
import animations from './util/animate';
import Stuff, { StuffConfig } from './Stuff';
import EventEmitter from './EventEmitter';
import { Explodable } from './Explodable';

export default class Barrel extends Stuff {
  knockback = 1000
  damage = 3
  dangerRadiusInTiles = 1.5
  MAX_HEALTH = 1
  explodable!: Explodable
  rekage!: Phaser.GameObjects.Sprite

  constructor(scene: GameScene, config: StuffConfig, x: number, y: number) {
    super(scene, config, x, y);

    this.damage = config.damage || this.damage
    this.MAX_HEALTH = this.health

    this.setImmovable(true)

    this.rekage = this.scene.add.sprite(this.x, this.y, 'barrelRekt').setVisible(false)
    this.explodable = new Explodable(scene)
  }

  hit(damage: number) {
    super.hit(damage)
    if (this.health === 1) { 
      this.setScale(1.25)
    }

    this.gfx.clear()

    if (0 < this.health && this.MAX_HEALTH) {
      this.gfx.setDefaultStyles({ fillStyle: { color: 0xa93939, alpha: 0.1 }, lineStyle: { width: 2, color: 0xa93939, alpha: 0.4 }})
      this.gfx.strokeCircle(this.x, this.y, this.scene.map.tileWidth * this.dangerRadiusInTiles)
      this.gfx.fillCircle(this.x, this.y, this.scene.map.tileWidth * this.dangerRadiusInTiles)
    }

    animations.wobbleSprite(this.scene, this, -1, 1, 30/(this.health||1), false)
  }

  onBeforeDie(): void {
    super.onBeforeDie()
    this.explode()
    this.rekage.setVisible(true)
  }

  explode() {
    this.explodable.explode(this)
  }
}
