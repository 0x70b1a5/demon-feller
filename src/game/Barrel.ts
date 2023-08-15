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
  radiusSprite!: Phaser.GameObjects.Sprite

  constructor(scene: GameScene, config: StuffConfig, x: number, y: number) {
    super(scene, config, x, y);

    this.damage = config.damage || this.damage
    this.MAX_HEALTH = this.health

    this.setImmovable(true)

    this.rekage = this.scene.add.sprite(this.x, this.y, 'barrelRekt').setVisible(false)
    this.explodable = new Explodable(scene)
    this.radiusSprite = this.scene.add.sprite(this.x, this.y, 'barrelRadius').setVisible(false).setActive(false).setOrigin(0.5, 0.5).setAlpha(0.25)
  }

  hit(damage: number) {
    super.hit(damage)
    if (this.health <= this.scene.feller.damage) { 
      this.setScale(1.25)
      animations.wobbleSprite(this.scene, this, -1, 1, 120, false)
    }

    if (0 < this.health && this.MAX_HEALTH) {
      !this.radiusSprite.visible && this.radiusSprite.setVisible(true).setActive(true)
      const sz = 2 * this.dangerRadiusInTiles * this.scene.map.tileWidth
      this.radiusSprite.setDisplaySize(sz, sz)
      this.setDepth(this.depth+1)
    }
  }

  onBeforeDie(): void {
    super.onBeforeDie()
    this.explode()
    this.rekage.setVisible(true)
    this.radiusSprite.setVisible(false).setActive(false)
  }

  explode() {
    this.explodable.explode(this)
  }
}
