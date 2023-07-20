import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import Enemy, { EnemyConfig } from './Enemy';
import Feller from './Feller';
import animations from './util/animate';
import Stuff, { StuffConfig } from './Stuff';

export default class Barrel extends Stuff {
  knockback = 200 
  damage = 3

  constructor(scene: GameScene, config: StuffConfig, x: number, y: number) {
    super(scene, config, x, y);

    this.damage = config.damage || this.damage

    this.setSize(this.scene.map.tileWidth - 20, this.scene.map.tileHeight - 20)
    this.setImmovable(true)

    this.gfx.setDefaultStyles({ fillStyle: { color: 0x793939 }})
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    this.gfx.clear()

    if (0 < this.health && this.health < 3) {
      this.gfx.strokeCircle(this.x, this.y, this.scene.map.tileWidth / this.health)
    } else if (this.health <= 0) {
      const boom = this.scene.physics.add.sprite(this.x, this.y, 'boom')
      this.scene.tweens.add({
        targets: boom,
        ease: 'Elastic',
        duration: 500,
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
        .filter(enemy => Phaser.Math.Distance.BetweenPoints(enemy, this) <= this.scene.map.tileWidth)
      
      enemiesHit.forEach(enemy => enemy.hit(this.damage))

      if (Phaser.Math.Distance.BetweenPoints(this.scene.feller.sprite, this) <= this.scene.map.tileWidth) {
        this.scene.feller.hit(this)
      }

      this.body?.destroy()
      this.setVisible(false)
    }
  }

  move() {
    return
  }
}
