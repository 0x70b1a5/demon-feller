import Phaser from 'phaser';
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
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
  }
}
