import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene';
import { Room } from '@mikewesthad/dungeon';

export interface EnemyConfig {
  damage?: number
  health?: number
  room: Room
  texture: string
}

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  target!: Phaser.Types.Math.Vector2Like;
  health: number;
  damage: number;
  room!: Room
  scene!: GameScene
  seenPlayer = false

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, 0, 0, config.texture);
    this.health = config.health || 3;
    this.damage = config.damage || 1;
    this.room = config.room
    this.scene = scene

    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.physics.add.collider(this, scene.groundLayer)
    
    this.setX(scene.map.tileToWorldX(this.room.centerX)!)
    this.setY(scene.map.tileToWorldY(this.room.centerY)!)

    // console.log(this.x, this.y)
    // this.scene.add.graphics({ fillStyle: { color: 0x0 } })
    // .fillRect(this.x, this.y, 10, 10)

    // this.setBounce(1); // This will avoid enemy sticking to the wall
    this.setVelocity(Math.random() * 100 - 50, Math.random() * 100 - 50); // Set initial random velocity
  }

  hit(damage = 1) {
    this.health -= damage;
    if (this.health <= 0) {
      this.destroy();
    }
  }

  preUpdate(time: any, delta: any) {
    super.preUpdate(time, delta);

    // Every 2 seconds, we pick a new random location
    if (time % 2000 < delta && !this.seenPlayer) { // chase player once seen
      this.target = new Phaser.Math.Vector2(Math.random() * (this.scene.game.config.width as number), Math.random() * (this.scene.game.config.height as number));
      // console.log('enemy room:', this.room.centerX, this.room.centerY)
    }

    // If we have a target, we move toward it
    if (this.target) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x!, this.target.y!);
      this.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);
    }

    // console.log({time})

    // if we are not in same room as player, hide sprite
    if ((this.room.centerX !== this.scene.playerRoom.centerX) && (this.room.centerY !== this.scene.playerRoom.centerY)) {
      this.setVisible(false)
    } else if (time > 10000 && !this.seenPlayer) { // seenplayers happening really early for some reaosn?!
      // if we are in same room, show sprite, see player, and chase
      console.log('seen player', this)
      this.setVisible(true)
      this.seenPlayer = true
      this.target = this.scene.feller.sprite
    }
  }
}
