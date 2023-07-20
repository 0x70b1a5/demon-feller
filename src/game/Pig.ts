import Bullet from "./Bullet";
import Enemy, { EnemyConfig } from "./Enemy";
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
    this.setSize(150, 150)
  }

  spit() {
    const angle = Phaser.Math.Angle.BetweenPoints(this, this.scene.feller.sprite)
    const bullet = new Bullet(this.scene, this.x, this.y, { angle, texture: 'bigbullet', speed: 300 }); 
    assert(bullet.body && this.body)
    
    bullet.body.velocity.x += this.body.velocity.x
    bullet.body.velocity.y += this.body.velocity.y

    this.bullets.push(bullet)

    this.scene.physics.add.overlap(bullet, this.scene.feller.sprite, (bullet, _enemy) => {
      this.scene.feller.hit(this)
      bullet.destroy()
    })

    this.scene.physics.add.collider(bullet, this.scene.groundLayer, () => bullet.destroy())
    this.scene.physics.add.collider(bullet, this.scene.stuffs, (bullet, _stuff) => {
      (_stuff as Stuff)?.hit(this.damage)
    })
    this.scene.physics.add.collider(bullet, this.scene.stuffLayer, () => bullet.destroy())
    this.scene.physics.add.collider(bullet, this.scene.shadowLayer, () => bullet.destroy())
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