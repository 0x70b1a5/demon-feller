import animations from "./util/animate";

export enum PowerUpType {
  Health,
  Speed,
  Shoot
}

export default class PowerUp extends Phaser.Physics.Arcade.Sprite {
  powerupType: PowerUpType;
  bg!: Phaser.Physics.Arcade.Sprite

  constructor(scene: Phaser.Scene, x: number, y: number, powerupType: PowerUpType) {
    console.log({ powerupType })
    const bg = scene.physics.add.sprite(x, y, 'powerupBG')
    super(scene, x, y, 'powerup'+powerupType);
    this.powerupType = powerupType;
    this.scene.physics.world.enable(this);
    this.scene.add.existing(this);
    this.bg = bg

    animations.enshadow(this.bg)
    animations.wobbleSprite(this.scene, this, -20, 20)
    animations.wobbleSprite(this.scene, this.bg, -720, 720, 6000)
  }

  destroy(fromScene?: boolean | undefined): void {
    this.bg.destroy()
    super.destroy()
  }
}
