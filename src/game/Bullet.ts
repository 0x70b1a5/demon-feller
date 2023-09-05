import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import EventEmitter from './EventEmitter';
import { v4 as uuid } from 'uuid'
export interface BulletConfig {
  scale?: number,
  angle: number,
  texture?: string,
  speed?: number
}
export default class Bullet extends Phaser.Physics.Arcade.Sprite {
  bulletSpeed = 600
  smoke!: Phaser.GameObjects.Sprite
  scene!: GameScene
  guid = uuid()
  hasHit = false
  
  constructor(scene: GameScene, x: number, y: number, texture: string) {
    super(scene, x, y, texture || 'bullet');
    this.scene = scene

    // Set up physics
    scene.physics.world.enable(this);
    scene.add.existing(this);

    this.smoke = scene.add.sprite(this.x, this.y, 'smoke')
    .setActive(false)
    .setVisible(false)

    this.deactivate()
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
    this.hasHit = false
    
    this?.setVelocity(0)
    ?.setPosition(-100, -100)
    ?.setActive(false)
    ?.setVisible(false)
  }

  bulletHitSomething(scene: GameScene, damage = 0, bulletAngle = 0) {    
    if (this.hasHit) return
    this.hasHit = true
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
      onComplete: () => smoke.setActive(false).setVisible(false)
    })
   
    this.deactivate()

  }

  fixedUpdate(time: number, delta: number) {
  }
}
