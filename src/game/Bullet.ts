import Phaser from 'phaser';

export default class Bullet extends Phaser.Physics.Arcade.Sprite {
  bulletSpeed = 600
  
  constructor(scene: Phaser.Scene, x: number, y: number, angle: number, texture: string = 'bullet', speed = 600) {
    super(scene, x, y, texture);
    this.bulletSpeed = speed

    // Set up physics
    scene.physics.world.enable(this);
    scene.add.existing(this);

    // Set initial velocity based on the angle at which it was fired
    this.setVelocityX(Math.cos(angle) * this.bulletSpeed);
    this.setVelocityY(Math.sin(angle) * this.bulletSpeed);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
  }
}
