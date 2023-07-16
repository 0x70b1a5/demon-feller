export enum PowerUpType {
  Health,
  Speed,
  Shoot
}

export default class PowerUp extends Phaser.Physics.Arcade.Sprite {
  powerupType: PowerUpType;

  constructor(scene: Phaser.Scene, x: number, y: number, powerupType: PowerUpType) {
    console.log({ powerupType })
    super(scene, x, y, 'powerup'+powerupType);
    this.powerupType = powerupType;
    this.scene.physics.world.enable(this);
    this.scene.add.existing(this);
  }
}
