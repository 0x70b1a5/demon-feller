import Bullet from './Bullet';
import Enemy, { EnemyConfig } from './Enemy';
import EventEmitter from './EventEmitter';
import Stuff from './Stuff';
import { GameScene } from './scenes/GameScene';
import assert from './util/assert';

export default class Gambler extends Enemy {
  speed = 0
  health = 8
  PULL_COOLDOWN_MS = 1000
  pullCooldown = 0
  bullets: Bullet[] = []
  knockback = 500

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)

    this.health *= (config.level)

    if ((!scene.anims.exists('gambler-pull'))) {   
      scene.anims.create({
        key: 'gambler-pull',
        frames: scene.anims.generateFrameNumbers('gambler-sheet', { frames: [1,0] }),
        frameRate: 2,
      })
    }

    EventEmitter.on('gameOver', () => {
      this.bullets.forEach(bullet => bullet.destroy())
    })
  }

  pull() {
    if (this.stun) return 

    this.anims.play('gambler-pull')
    
    const angle = Phaser.Math.Angle.BetweenPoints(this, this.scene.feller.sprite)
    const bullet = new Bullet(this.scene, this.x, this.y, 'coin'); 
    bullet.configure(300, 1, angle)

    bullet.fire(this.x, this.y)
    this.bullets.push(bullet)

    this.scene.physics.add.overlap(bullet, this.scene.feller.sprite, (bullet, _enemy) => {
      this.scene.feller.hit(this);
      (bullet as Bullet).bulletHitSomething(this.scene, this.damage, angle)
    })

    this.scene.physics.add.collider(bullet, [
      this.scene.groundLayer, this.scene.stuffLayer, this.scene.shadowLayer
    ], () => (bullet as Bullet).bulletHitSomething(this.scene, this.damage, angle))
    this.scene.physics.add.collider(bullet, this.scene.stuffs, (bullet, _stuff) => {
      (_stuff as Stuff)?.hit(this.damage);
      (bullet as Bullet).bulletHitSomething(this.scene, this.damage, angle)
    })
    
    this.pullCooldown = this.PULL_COOLDOWN_MS;
  }

  fixedUpdate(time: any, delta: any): void {
    super.fixedUpdate(time, delta)

    if (!this.dead && this.seenFeller) {
      if (this.pullCooldown > 0) {
        this.pullCooldown -= delta
      } else {
        this.pull()
      }
    }
  }

  hit(by: Phaser.Types.Math.Vector2Like & { damage: number, knockback: number }) {
    EventEmitter.emit('playSound','soulgrunt')
    super.hit(by)
  }

  die() {
    EventEmitter.emit('playSound','soulgrumble')
    super.die()
  }

  destroy() {
    this?.bullets?.forEach(b => b?.destroy())
    super.destroy()
  }
}