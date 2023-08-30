import Bullet from './Bullet';
import Enemy, { EnemyConfig } from './Enemy';
import EventEmitter from './EventEmitter';
import Stuff from './Stuff';
import { GameScene } from './scenes/GameScene';
import assert from './util/assert';

export default class Glutton extends Enemy {
  speed = 0
  health = 8
  knockback = 200
  BELCH_TIMER_MS = 3000
  belching = 0
  bullets!: Phaser.GameObjects.Group

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)

    if ((!scene.anims.exists('belcher-belch'))) {
      scene.anims.create({
        key: 'belcher-belch',
        frames: scene.anims.generateFrameNumbers('belcher-sheet', { frames: [0, 1] }),
        frameRate: 1,
        repeat: -1
      })
    }

    this.createBulletPool()
  }

  createBulletPool() {
    this.bullets = this.scene.physics.add.group({
      classType: Bullet,
      maxSize: 24, // 30 bullets in total
      runChildUpdate: true // If you need to run update on each bullet
    });
  
    // Create the initial pool of bullets
    for (let i = 0; i < 24; i++) {
      const bullet = new Bullet(this.scene, 0, 0, 'bigbullet');
      bullet.deactivate()
      this.bullets.add(bullet);
    }
  }

  belch(delta: number) {
    if (this.belching > 0) {
      this.belching -= delta

      if (this.belching < this.BELCH_TIMER_MS/2) {
        if (this.anims.isPlaying) {
          this.anims.stop()
        }
      }

      return
    }

    this.anims.play('belcher-belch')
    EventEmitter.emit('playSound', 'belcherbelch')

    this.belching = this.BELCH_TIMER_MS
    const burps = Math.random() * 8
    for (let i = 0; i < burps; i++) {
      const angle = Math.random() * 2 * Math.PI
      const bullet = this.bullets.getFirstDead()
      bullet.configure(150, 1.25, angle)

      assert(bullet.body && this.body)
    
      bullet.fire(this.x, this.y)

      this.scene.physics.add.overlap(bullet, this.scene.feller.sprite, (bullet, _enemy) => {
        this.scene.feller.hit(this);
        (bullet as Bullet).bulletHitSomething(this.scene, this.damage, angle)
      })

      this.scene.physics.add.collider(bullet, [
        this.scene.groundLayer, this.scene.shadowLayer,
      ], () => (bullet as Bullet).bulletHitSomething(this.scene, this.damage, angle))

      this.scene.physics.add.overlap(bullet, [
        ...this.scene.stuffs, ...this.scene.rooms.flatMap(r => r.doorSprites)
      ], (bullet, _stuff) => {
        (((_stuff as Stuff)?.hit) && (_stuff as Stuff)?.hit(this.damage));
        (bullet as Bullet).bulletHitSomething(this.scene, this.damage, angle)
      })
    }
  }

  fixedUpdate(time: any, delta: any) {
    super.fixedUpdate(time, delta)
    if (!this.dead && this.seenFeller && this.stun < 1) {
      this.belch(delta)
    }
  }

  hit(by: any) {
    EventEmitter.emit('playSound', 'belcherbreathe')
    super.hit(by)
  }
  
  destroy(fromScene?: boolean | undefined): void {
    this?.bullets?.destroy()
    super.destroy()
  }
}