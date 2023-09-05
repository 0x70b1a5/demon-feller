import Bullet from './Bullet';
import Enemy, { EnemyConfig } from './Enemy';
import EventEmitter from './EventEmitter';
import Stuff from './Stuff';
import { GameScene } from './scenes/GameScene';
import assert from './util/assert';

export default class Pig extends Enemy {
  speed = 125
  health = 6
  SPIT_COOLDOWN_MS = 2000
  spitCooldown = 0
  bullets!: Phaser.GameObjects.Group
  knockback = 500

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)
    this.setScale(0.9, 0.9)
    this.setSize(180, 180)

    this.health *= config.level
    this.damage = config.level

    if ((!scene.anims.exists('pig-walk'))) {   
      scene.anims.create({
        key: 'pig-walk',
        frames: scene.anims.generateFrameNumbers('pig-sheet', { frames: [0,1,0,2] }),
        frameRate: 2,
        repeat: -1
      })
    }

    this.anims.play('pig-walk')
  
    this.createBulletPool()
  }

  createBulletPool() {
    this.bullets = this.scene.physics.add.group({
      classType: Bullet,
      maxSize: 5, // 30 bullets in total
      runChildUpdate: true // If you need to run update on each bullet
    });
  
    // Create the initial pool of bullets
    for (let i = 0; i < 5; i++) {
      const bullet = new Bullet(this.scene, 0, 0, 'bigbullet');
      bullet.deactivate()
      this.bullets.add(bullet);
    }
  }

  spit() {
    if (this.stun > 0) return 
    
    EventEmitter.emit('playSound', 'piggrunt')
    const angle = Phaser.Math.Angle.BetweenPoints(this, this.scene.feller.sprite)
    const bullet = this.bullets.getFirstDead()
    bullet.configure(300, 1, angle)
    bullet.fire(this.x, this.y)

    this.scene.physics.add.overlap(bullet, this.scene.feller.sprite, (bullet, _enemy) => {
      this.scene.feller.hit(this);
      (bullet as Bullet).bulletHitSomething(this.scene, this.damage, angle)
    })

    this.scene.physics.add.collider(bullet, [
      this.scene.groundLayer, this.scene.shadowLayer
    ], () => (bullet as Bullet).bulletHitSomething(this.scene, this.damage, angle))
    
    this.scene.physics.add.overlap(bullet, [
      // ...this.scene.stuffs,
      ...this.scene.rooms.flatMap(r => r.doorSprites)
    ], (_bullet, _stuff) => {
      const bullet = _bullet as Bullet
      const stuff = _stuff as Stuff
      if (!bullet.active) return
      (stuff?.hit && stuff.hit(this.damage));
      (bullet as Bullet).bulletHitSomething(this.scene, this.damage, angle)
    })
    
    this.spitCooldown = this.SPIT_COOLDOWN_MS;
  }

  fixedUpdate(time: any, delta: any): void {
    super.fixedUpdate(time, delta)

    if (!this.dead && this.seenFeller) {
      if (this.spitCooldown > 0) {
        this.spitCooldown -= delta
      } else {
        this.spit()
      }
    }
  }

  hit(by: Phaser.Types.Math.Vector2Like & { damage: number, knockback: number }) {
    EventEmitter.emit('playSound','piggrunt')
    super.hit(by)
  }

  die() {
    EventEmitter.emit('playSound','pigsqueal')
    super.die()
  }

  destroy() {
    this?.bullets?.destroy()
    super.destroy()
  }
}