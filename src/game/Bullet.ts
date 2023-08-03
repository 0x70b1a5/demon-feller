import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import EventEmitter from './EventEmitter';
export interface BulletConfig {
  scale?: number,
  angle: number,
  texture?: string,
  speed?: number
}
export default class Bullet extends Phaser.Physics.Arcade.Sprite {
  bulletSpeed = 600
  lifetimeMs = 20000
  smoke!: Phaser.GameObjects.Sprite
  scene!: GameScene
  
  constructor(scene: GameScene, x: number, y: number, config: BulletConfig) {
    const { texture, angle, scale, speed } = config
    super(scene, x, y, texture || 'bullet');
    this.scene = scene
    this.bulletSpeed = speed || 600

    // Set up physics
    scene.physics.world.enable(this);
    scene.add.existing(this);

    // Set initial velocity based on the angle at which it was fired
    this.setVelocityX(Math.cos(angle) * this.bulletSpeed);
    this.setVelocityY(Math.sin(angle) * this.bulletSpeed);

    this.setScale(scale || 1)
    .setOrigin(0.5, 0.5)
    .setCircle(this.width/2, 0, 0)

    this.smoke = scene.add.sprite(this.x, this.y, 'smoke')
    .setActive(false)
    .setVisible(false)
  }

  bulletHitSomething(scene: GameScene, damage = 0, bulletAngle = 0) {
    EventEmitter.emit('playSound', 'bullethit')

    const smoke = this.smoke
      .setX(this.x).setY(this.y)
      .setActive(true).setVisible(true)
      .setScale(Math.sqrt(damage)/4)
      .setRotation(bulletAngle)
    scene.tweens.add({
      targets: smoke,
      rotation: {
        value: { from: Phaser.Math.DegToRad(-5) + bulletAngle, to: Phaser.Math.DegToRad(5) + bulletAngle },
        duration: 100,
        ease: 'Sine.easeInOut',
      },
      onComplete: () => smoke.destroy()
    })
    this.destroy()
  }

  fixedUpdate(time: number, delta: number) {
    if (this.lifetimeMs > 0) {
      this.lifetimeMs -= delta
    } else {
      this.bulletHitSomething(this.scene, 0, this.angle)
    }
  }
}
