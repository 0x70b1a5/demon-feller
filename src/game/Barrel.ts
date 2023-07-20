import Phaser from 'phaser';

export default class Barrel extends Phaser.Physics.Arcade.Sprite {
  itsExplodingTime = false
  damage = 3
  health = 3
  gfx!: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'barrel');

    // Set up physics
    scene.physics.world.enable(this);
    scene.add.existing(this);
    this.gfx = scene.add.graphics()
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);

    
  }
}
