import Barrel from "./Barrel"
import Enemy from "./Enemy"
import EventEmitter from "./EventEmitter"
import Hothead from "./Hothead"
import Stuff from "./Stuff"
import { GameScene } from "./scenes/GameScene"
import animations from "./util/animate"

export class Explodable {

  boom!: Phaser.GameObjects.Sprite
  smoke!: Phaser.GameObjects.Sprite
  scene!: GameScene

  constructor(scene: GameScene) {
    this.scene = scene
    this.boom = this.scene?.physics.add.sprite(-100, -100, 'boom')
    .setScale(2)
    .setVisible(false)
    .setActive(false)

    this.smoke = this.scene?.physics.add.sprite(-100, -100, 'smoke')
    .setActive(false).setVisible(false)
  }
  

  explode(by: Barrel | Hothead) {
    EventEmitter.emit('playSound', 'explosion')
    this.boom.setActive(true).setVisible(true).setX(by.x).setY(by.y)
    if (!this.scene) return

    this.scene.cameras.main.shake()
    this.scene.tweens.add({
      targets: this.boom,
      ease: 'Elastic',
      duration: 250,
      x: Math.random() * 10 + by.x,
      onComplete: () => {
        this.boom?.destroy()

        this.smoke?.setActive(true).setVisible(true)
        animations.wobbleSprite(this.scene, this.smoke)
        setTimeout(() => {
          this.smoke?.destroy()
        }, 2000);
      }
    })

    this.scene.enemies
      .filter(enemy => !enemy.dead && Phaser.Math.Distance.BetweenPoints(enemy, by) <= this.scene.map.tileWidth * by.dangerRadiusInTiles)  
      .forEach(enemy => enemy.hit(by))

    if (!this.scene) return  // beat the level with a barrel pop!

    this.scene.stuffs
      .filter(stuff => Phaser.Math.Distance.BetweenPoints(stuff, by) <= this.scene.map.tileWidth * by.dangerRadiusInTiles)
      .forEach(stuff => !stuff.dying && !stuff.dead && stuff.guid !== by.guid && stuff.hit(by.damage))

    if (Phaser.Math.Distance.BetweenPoints(this.scene.feller.sprite, by) <= this.scene.map.tileWidth * by.dangerRadiusInTiles) {
      this.scene.feller.hit(by)
    }
  }
}