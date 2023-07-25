import Bullet from "./Bullet";
import Enemy, { EnemyConfig } from "./Enemy";
import Stuff from "./Stuff";
import { GameScene } from "./scenes/GameScene";
import assert from "./util/assert";

export default class Belcher extends Enemy {
  speed = 0
  health = 8
  knockback = 200
  BELCH_TIMER = 150
  belching = 0
  bullets: Bullet[] = []

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, config, x, y)

    if ((!scene.anims.exists('belcher-belch'))) {   
      scene.anims.create({
        key: 'belcher-belch',
        frames: scene.anims.generateFrameNumbers('belcher-sheet', { frames: [0, 1] }),
        frameRate: 5,
        repeat: -1
      })
    }
  }

  belch() {
    if (this.belching > 0) {
      this.belching--

      if (this.belching < this.BELCH_TIMER/2) {
        this.anims.stop()
      }

      return
    }

    this.anims.play('belcher-belch')

    this.belching = this.BELCH_TIMER
    const burps = Math.random() * 8
    for (let i = 0; i < burps; i++) {
      const angle = Math.random() * 2 * Math.PI
      const bullet = new Bullet(this.scene, this.x, this.y, { angle, speed: 150, texture: 'bigbullet', scale: 1.25 })
      assert(bullet.body && this.body)
    
      bullet.body.velocity.x += this.body.velocity.x
      bullet.body.velocity.y += this.body.velocity.y

      this.bullets.push(bullet)

      this.scene.physics.add.overlap(bullet, this.scene.feller.sprite, (bullet, _enemy) => {
        this.scene.feller.hit(this);
        (bullet as Bullet).bulletHitSomething(this.scene, this.damage, angle)
      })

      this.scene.physics.add.collider(bullet, [
        this.scene.groundLayer, this.scene.stuffLayer, this.scene.shadowLayer
      ], () => (bullet as Bullet).bulletHitSomething(this.scene, this.damage, angle))

      this.scene.physics.add.overlap(bullet, this.scene.stuffs, (bullet, _stuff) => {
        (_stuff as Stuff)?.hit(this.damage);
        (bullet as Bullet).bulletHitSomething(this.scene, this.damage, angle)
      })
    }
  }

  preUpdate(time: any, delta: any) {
    super.preUpdate(time, delta)
    if (this.seenFeller) {
      this.belch()
    }
  }

  destroy(fromScene?: boolean | undefined): void {
    super.destroy()
    this.bullets.forEach(b => b.destroy())
  }
}