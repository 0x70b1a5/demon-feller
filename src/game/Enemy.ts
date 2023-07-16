import Phaser from 'phaser'
import { GameScene, RoomWithEnemies } from './scenes/GameScene';
import { Room } from '@mikewesthad/dungeon';
import Feller from './Feller';
import EventEmitter from './EventEmitter';

export interface EnemyConfig {
  damage?: number
  health?: number
  room: RoomWithEnemies
  texture: string
  velocity?: number
}

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  target!: Phaser.Types.Math.Vector2Like;
  health: number;
  damage: number;
  currentRoom!: RoomWithEnemies
  originalRoom!: RoomWithEnemies
  scene!: GameScene
  seenPlayer = false
  velocity = 100
  knockback = 100
  dead = false
  gfx!: Phaser.GameObjects.Graphics;

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, 0, 0, config.texture);
    console.log({ scene })
    this.health = config.health || 3;
    this.damage = config.damage || 1;
    this.originalRoom = this.currentRoom = config.room
    this.scene = scene
    this.velocity = config.velocity || this.velocity

    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.physics.add.collider(this, scene.groundLayer)
    
    this.setX(scene.map.tileToWorldX(this.currentRoom.centerX)!)
    this.setY(scene.map.tileToWorldY(this.currentRoom.centerY)!)

    this.gfx = this.scene.add.graphics({ lineStyle: { color: 0x0 }})
    // console.log(this.x, this.y)
    // this.scene.add.graphics({ fillStyle: { color: 0x0 } })
    // .fillRect(this.x, this.y, 10, 10)

    // this.setBounce(1); // This will avoid enemy sticking to the wall
    this.setVelocity(Math.random() * this.velocity - 50, Math.random() * this.velocity - 50); // Set initial random velocity
  }

  attack(feller: Feller) {
    if (this.dead) return
    feller.hit(this)
  }

  hit(damage = 1) {
    this.health -= damage;
    if (this.health <= 0) {
      this.die();
    }
  }

  preUpdate(time: any, delta: any) {
    super.preUpdate(time, delta);

    this.currentRoom = this.scene.dungeon.getRoomAt(this.scene.map.worldToTileX(this.x)!, this.scene.map.worldToTileY(this.y)!)! as RoomWithEnemies

    this.gfx.clear()
      .lineBetween(this.x, this.y, this.scene.map.tileToWorldX(this.currentRoom.centerX)!, this.scene.map.tileToWorldY(this.currentRoom.centerY)!)

    // Every 2 seconds, we pick a new random location
    if (time % 2000 < delta && !this.seenPlayer) { // chase player once seen
      this.target = new Phaser.Math.Vector2(Math.random() * (this.scene.game.config.width as number), Math.random() * (this.scene.game.config.height as number));
    }

    // If we have a target, we move toward it
    if (this.target) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x!, this.target.y!);
      this.setVelocity(Math.cos(angle) * this.velocity, Math.sin(angle) * this.velocity);
    }

    // if we are not in same room as player, hide sprite
    if ((this.currentRoom.centerX !== this.scene.playerRoom.centerX) && (this.currentRoom.centerY !== this.scene.playerRoom.centerY)) {
      this.setVisible(false)
    } else if (time > 10000 && !this.seenPlayer) { // seenplayers happening really early for some reaosn?!
      // if we are in same room, show sprite, see player, and chase
      console.log('seen player', this)
      this.setVisible(true)
      this.seenPlayer = true
      this.target = this.scene.feller.sprite
    } else {
      this.setVisible(true)
    }
  }

  die() {
    EventEmitter.emit('demonFelled')
    this.scene.checkLevelComplete() // dont call after destroy()
    this.gfx.clear()
    this.dead = true
    this.destroy()
  }
}
