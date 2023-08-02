import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import Enemy, { EnemyConfig } from './Enemy';
import Feller from './Feller';
import animations from './util/animate';
import Stuff, { StuffConfig } from './Stuff';
import EventEmitter from './EventEmitter';

export default class Barrel extends Stuff {
  knockback = 120 
  damage = 3
  dangerRadiusInTiles = 1.5
  MAX_HEALTH = 1

  constructor(scene: GameScene, config: StuffConfig, x: number, y: number) {
    super(scene, config, x, y);

    this.damage = config.damage || this.damage
    this.MAX_HEALTH = this.health

    this.setImmovable(true)
    this.boom = this.scene?.physics.add.sprite(this.x, this.y, 'boom')
    .setScale(2)
    .setVisible(false)
    .setActive(false)

    this.smoke = this.scene?.physics.add.sprite(this.x, this.y, 'smoke')
    .setActive(false).setVisible(false)
  }

  fixedUpdate(time: number, delta: number) {
    super.fixedUpdate(time, delta);
    this.gfx.clear()

    if (0 < this.health && this.health < 3) {
      if(this.debug) {
        this.gfx.setDefaultStyles({ fillStyle: { color: 0xa93939, alpha: 0.2 }, lineStyle: { width: 2, color: 0xff0000 }})
        this.gfx.strokeCircle(this.x, this.y, this.scene.map.tileWidth * this.dangerRadiusInTiles / this.health)
        this.gfx.fillCircle(this.x, this.y, this.scene.map.tileWidth * this.dangerRadiusInTiles / this.health)
      }
    }
  }

  boom!: Phaser.GameObjects.Sprite
  smoke!: Phaser.GameObjects.Sprite
  explode() {
    EventEmitter.emit('playSound', 'explosion')
    this.boom.setActive(true).setVisible(true)
    if (!this.scene) return

    this.scene.cameras.main.shake()
    this.scene.tweens.add({
      targets: this.boom,
      ease: 'Elastic',
      duration: 250,
      x: Math.random() * 10 + this.x,
      onComplete: () => {
        this.boom?.destroy()

        this.smoke?.setActive(true).setVisible(true)
        animations.wobbleSprite(this.scene, this.smoke)
        setTimeout(() => {
          this.smoke?.destroy()
        }, 2000);
      }
    })

    this.scene.enemies
      .filter(enemy => !enemy.dead && Phaser.Math.Distance.BetweenPoints(enemy, this) <= this.scene.map.tileWidth * this.dangerRadiusInTiles)  
      .forEach(enemy => enemy.hit(this))

    this.scene.stuffs
      .filter(stuff => Phaser.Math.Distance.BetweenPoints(stuff, this) <= this.scene.map.tileWidth * this.dangerRadiusInTiles)
      .forEach(stuff => !stuff.dying && !stuff.dead && stuff.guid !== this.guid && stuff.hit(this.damage))

    if (Phaser.Math.Distance.BetweenPoints(this.scene.feller.sprite, this) <= this.scene.map.tileWidth * this.dangerRadiusInTiles) {
      this.scene.feller.hit(this)
    }
  }

  hit(damage: number) {
    super.hit(damage)
    if (this.health === 1) { 
      this.setScale(1.25)
    }
    animations.wobbleSprite(this.scene, this, -2, 2, 30/(this.health||1), false)
  }

  onBeforeDie(): void {
    super.onBeforeDie()
    this.explode()
  }
}
