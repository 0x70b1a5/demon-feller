import Bullet from "./Bullet";
import Enemy, { EnemyConfig } from "./Enemy";
import EventEmitter from "./EventEmitter";
import Stuff from "./Stuff";
import { GameScene } from "./scenes/GameScene";
import assert from "./util/assert";

export default class Pig extends Enemy {
  speed = 125
  health = 6
  SPIT_COOLDOWN_DURATION = 120
  spitCooldown = 0
  bullets: Bullet[] = []
  knockback = 200

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)
    this.setScale(0.9, 0.9)

    if ((!scene.anims.exists('pig-walk'))) {   
      scene.anims.create({
        key: 'pig-walk',
        frames: scene.anims.generateFrameNumbers('pig-sheet', { frames: [0,1,0,2] }),
        frameRate: 2,
        repeat: -1
      })
    }

    this.anims.play('pig-walk')

    EventEmitter.on('gameOver', () => {
      this.bullets.forEach(bullet => bullet.destroy())
    })
  }

  spit() {
    if (this.stun) return 
    
    const angle = Phaser.Math.Angle.BetweenPoints(this, this.scene.feller.sprite)
    const bullet = new Bullet(this.scene, this.x, this.y, { angle, texture: 'bigbullet', speed: 300 }); 
    assert(bullet.body && this.body)

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
    
    this.spitCooldown = this.SPIT_COOLDOWN_DURATION;
  }

  preUpdate(time: any, delta: any): void {
    super.preUpdate(time, delta)

    if (this.seenFeller) {
      if (this.spitCooldown > 0) {
        this.spitCooldown--
      } else {
        this.spit()
      }
    }

  }
}