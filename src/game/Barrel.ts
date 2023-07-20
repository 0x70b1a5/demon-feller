import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import Enemy, { EnemyConfig } from './Enemy';
import Feller from './Feller';
import animations from './util/animate';
import Stuff, { StuffConfig } from './Stuff';

export default class Barrel extends Stuff {
  knockback = 200 
  damage = 3
  dangerRadiusInTiles = 1
  MAX_HEALTH = 1

  constructor(scene: GameScene, config: StuffConfig, x: number, y: number) {
    super(scene, config, x, y);

    this.damage = config.damage || this.damage
    this.MAX_HEALTH = this.health

    this.setSize(this.scene.map.tileWidth - 20, this.scene.map.tileHeight - 20)
    this.setImmovable(true)
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    this.gfx.clear()

    if (0 < this.health && this.health < 3) {
      if(this.debug) {
        this.gfx.setDefaultStyles({ fillStyle: { color: 0xa93939, alpha: 0.2 }, lineStyle: { width: 2, color: 0xff0000 }})
        this.gfx.strokeCircle(this.x, this.y, this.scene.map.tileWidth * this.dangerRadiusInTiles / this.health)
        this.gfx.fillCircle(this.x, this.y, this.scene.map.tileWidth * this.dangerRadiusInTiles / this.health)
      }
    }
  }

  explode() {
    const boom = this.scene.physics.add.sprite(this.x, this.y, 'boom')
    this.scene.tweens.add({
      targets: boom,
      ease: 'Elastic',
      duration: 250,
      x: Math.random() * 10 + this.x,
      onComplete: () => {
        boom.destroy()

        const smoke = this.scene.physics.add.sprite(this.x, this.y, 'smoke')
        animations.wobbleSprite(this.scene, smoke)
        setTimeout(() => {
          smoke.destroy()
        }, 2000);
      }
    })

    const enemiesHit: Enemy[] = this.scene.enemies
      .filter(enemy => Phaser.Math.Distance.BetweenPoints(enemy, this) <= this.scene.map.tileWidth * this.dangerRadiusInTiles)
    
    enemiesHit.forEach(enemy => enemy.hit(this.damage))

    const stuffsHit: Stuff[] = this.scene.stuffs
      .filter(stuff => Phaser.Math.Distance.BetweenPoints(stuff, this) <= this.scene.map.tileWidth * this.dangerRadiusInTiles)

    this.debug && console.log({ stuffsHit })
    
    stuffsHit.forEach(stuff => !stuff.dying && !stuff.dead && stuff.guid !== this.guid && stuff.hit(this.damage))

    if (Phaser.Math.Distance.BetweenPoints(this.scene.feller.sprite, this) <= this.scene.map.tileWidth * this.dangerRadiusInTiles) {
      this.scene.feller.hit(this)
    }
  }

  hit(damage: number) {
    super.hit(damage)
    if (this.health === 1) { 
      this.setScale(1.5)
    }
    animations.wobbleSprite(this.scene, this, -2, 2, 30/(this.health||1), false)
  }

  onBeforeDie(): void {
    super.onBeforeDie()
    this.setRotation(Phaser.Math.DegToRad(10))
    this.explode()
  }
}
