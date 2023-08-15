import { PowerUpType } from "./PowerUpType";
import { GameScene } from "./scenes/GameScene";
import animations from "./util/animate";

export default class PowerUp extends Phaser.Physics.Arcade.Sprite {
  powerupType: PowerUpType;
  bg!: Phaser.Physics.Arcade.Sprite
  iframes = 1000
  scene!: GameScene
  whiteCircle!: Phaser.GameObjects.Sprite

  constructor(scene: GameScene, x: number, y: number, powerupType: PowerUpType) {
    console.log({ powerupType })
    const bg = scene.physics.add.sprite(x, y, 'powerupBG')
    super(scene, x, y, 'powerup'+powerupType);
    this.powerupType = powerupType;
    this.whiteCircle = scene.add.sprite(x, y, 'powerupCircle').setOrigin(0.5, 0.5)
    this.scene = scene
    this.scene.physics.world.enable(this);
    this.scene.add.existing(this);
    this.bg = bg

    animations.wobbleSprite(this.scene, this, -20, 20)
    animations.wobbleSprite(this.scene, this.bg, -720, 720, 6000)
  }

  destroy(fromScene?: boolean | undefined): void {
    this.bg.destroy()
    super.destroy()
  }

  fixedUpdate(time: number, delta: number) {
    if (this.iframes > 0) { 
      this.whiteCircle.setDisplaySize(this.iframes, this.iframes)
      this.iframes -= delta
    } else {
      this.whiteCircle.visible && this.whiteCircle.setVisible(false).setActive(false)
    }
  }
}
