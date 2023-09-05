import Bullet from './Bullet';
import Enemy, { EnemyConfig } from './Enemy';
import EventEmitter from './EventEmitter';
import Stuff from './Stuff';
import { GameScene } from './scenes/GameScene';
import assert from './util/assert';

export default class Covetor extends Enemy {
  speed = 0
  health = 8
  PULL_COOLDOWN_MS = 2000
  pullCooldown = 0
  bullets!: Phaser.GameObjects.Group
  knockback = 500

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)

    this.health *= config.level
    this.damage = config.level 
    
    this.PULL_COOLDOWN_MS /= Math.sqrt(config.level || 1)

    this.setSize(190, 190)

    if ((!scene.anims.exists('gambler-pull'))) {   
      scene.anims.create({
        key: 'gambler-pull',
        frames: scene.anims.generateFrameNumbers('gambler-sheet', { frames: [1,0,0,0] }),
        frameRate: 1,
      })
    }

    this.createBulletPool()
  }

  pull() {
    if (this.stun > 0) return 

    this.anims.play('gambler-pull')
    EventEmitter.emit('playSound', 'chaching')
    
    const angle = Phaser.Math.Angle.BetweenPoints(this, this.scene.feller.sprite)
    const bullet = this.bullets.getFirstDead()
    bullet.configure(300, 1, angle)

    bullet.fire(this.x, this.y)

    this.setDepth(bullet.depth+1)

    this.scene.physics.add.overlap(bullet, this.scene.feller.sprite, (bullet, _enemy) => {
      this.scene.feller.hit(this);
      (bullet as Bullet).bulletHitSomething(this.scene, this.damage, angle)
    })

    this.scene.physics.add.collider(bullet, [
      this.scene.groundLayer, this.scene.shadowLayer
    ], () => (bullet as Bullet).bulletHitSomething(this.scene, this.damage, angle))
    
    this.scene.physics.add.overlap(bullet, [
      ...this.scene.stuffs, ...this.scene.rooms.flatMap(r => r.doorSprites)
    ], (_bullet, _stuff) => {
      const bullet = _bullet as Bullet
      const stuff = _stuff as Stuff
      if (!bullet.active) return
      (stuff?.hit && stuff.hit(this.damage));
      (bullet as Bullet).bulletHitSomething(this.scene, this.damage, angle)
    })
    
    this.pullCooldown = this.PULL_COOLDOWN_MS;
  }

  findPathToTarget(delta: number): void {
    return
  }

  takePathToTarget(): void {
    return
  }

  chaseTarget(delta: number): void {
    return
  }

  wobble(): void {
    return
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

  createBulletPool() {
    this.bullets = this.scene.physics.add.group({
      classType: Bullet,
      maxSize: 15, // 30 bullets in total
      runChildUpdate: true // If you need to run update on each bullet
    });
  
    // Create the initial pool of bullets
    for (let i = 0; i < 15; i++) {
      const bullet = new Bullet(this.scene, 0, 0, 'coin');
      bullet.deactivate()
      this.bullets.add(bullet);
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
    this?.bullets?.destroy()
    super.destroy()
  }
}