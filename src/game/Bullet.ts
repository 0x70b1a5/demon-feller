import Phaser from 'phaser';

export default class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, angle: number) {
    super(scene, x, y, 'bullet');

    // Set up physics
    scene.physics.world.enable(this);
    scene.add.existing(this);

    // Set initial velocity based on the angle at which it was fired
    this.setVelocityX(Math.cos(angle) * 600);
    this.setVelocityY(Math.sin(angle) * 600);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
  }
}
