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
  LIFETIME_MS = 2000
  lifetimeMs = 2000
  smoke!: Phaser.GameObjects.Sprite
  scene!: GameScene
  
  constructor(scene: GameScene, x: number, y: number, texture: string) {
    super(scene, x, y, texture || 'bullet');
    this.scene = scene

    // Set up physics
    scene.physics.world.enable(this);
    scene.add.existing(this);

    this.smoke = scene.add.sprite(this.x, this.y, 'smoke')
    .setActive(false)
    .setVisible(false)
  }

  configure(speed: number, scale: number, angle: number) {
    this.bulletSpeed = speed
    // Set initial velocity based on the angle at which it was fired
    this.setVelocityX(Math.cos(angle) * this.bulletSpeed);
    this.setVelocityY(Math.sin(angle) * this.bulletSpeed);

    this.setScale(scale || 1)
    .setOrigin(0.5, 0.5)
    .setCircle(this.width/2, 0, 0)
  }

  fire(x: number, y: number) {
    this.setX(x).setY(y)
    .setActive(true)
    .setVisible(true)
  }

  deactivate() {
    this.setActive(false); // Set the bullet to inactive
    this.setVisible(false); // Hide the bullet
    this.setVelocity(0); // Stop any movement
    this.setPosition(-100, -100); // Optional: Move it off-screen or to a specific reset position
    this.lifetimeMs = this.LIFETIME_MS
  }

  bulletHitSomething(scene: GameScene, damage = 0, bulletAngle = 0) {
    EventEmitter.emit('playSound', 'bullethit')

    const smoke = this.smoke
      .setX(this.x).setY(this.y)
      .setActive(true).setVisible(true)
      .setScale(Math.sqrt(damage)/4)
      .setRotation(bulletAngle)

    scene?.tweens.add({
      targets: smoke,
      rotation: {
        value: { from: Phaser.Math.DegToRad(-5) + bulletAngle, to: Phaser.Math.DegToRad(5) + bulletAngle },
        duration: 100,
        ease: 'Sine.easeInOut',
      },
      onComplete: () => smoke.destroy()
    })

    this.setActive(false).setVisible(false).destroy()
  }

  fixedUpdate(time: number, delta: number) {
    if (this.lifetimeMs > 0) {
      this.lifetimeMs -= delta
    } else {
      if (this.scene)
        this.bulletHitSomething(this.scene, 0, this.angle)
    }
  }
}
