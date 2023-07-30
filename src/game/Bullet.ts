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
  
  constructor(scene: Phaser.Scene, x: number, y: number, config: BulletConfig) {
    const { texture, angle, scale, speed } = config
    super(scene, x, y, texture || 'bullet');
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
  }

  bulletHitSomething(scene: GameScene, damage = 0, bulletAngle = 0) {
    EventEmitter.emit('playSound', 'bullethit')

    const smoke = scene.add.sprite(this.x, this.y, 'smoke')
      .setScale(0.25 * damage)
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
    // ?
  }
}
