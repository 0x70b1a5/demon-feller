import Phaser from 'phaser'
import { GameScene, RoomWithEnemies } from './scenes/GameScene';
import { Room } from '@mikewesthad/dungeon';
import Feller from './Feller';
import EventEmitter from './EventEmitter';
import animations from './util/animate';
import { Exception } from 'sass';

export interface EnemyConfig {
  damage?: number
  health?: number
  room: RoomWithEnemies
  texture: string
  velocity?: number
  enemyType?: EnemyType
}

export enum EnemyType {
  Goo,
  Pig,
  Soul,
}

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  target!: Phaser.Types.Math.Vector2Like;
  health: number;
  damage: number;
  currentRoom!: RoomWithEnemies
  originalRoom!: RoomWithEnemies
  scene!: GameScene
  seenFeller = false
  speed = 100
  knockback = 100
  dead = false
  debug = false
  gfx!: Phaser.GameObjects.Graphics;
  pushing = 0
  enemyType?: EnemyType

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, 0, 0, config.texture);
    this.health = config.health || 3;
    this.damage = config.damage || 1;
    this.originalRoom = this.currentRoom = config.room
    this.scene = scene
    this.speed = config.velocity || this.speed
    this.enemyType = config.enemyType

    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.physics.add.collider(this, scene.groundLayer)
    
    this.setX(scene.map.tileToWorldX(this.currentRoom.centerX)! + Math.random() * 200)
    this.setY(scene.map.tileToWorldY(this.currentRoom.centerY)! + Math.random() * 200)

    this.gfx = this.scene.add.graphics({ lineStyle: { color: 0x0 }})
    // console.log(this.x, this.y)
    // this.scene.add.graphics({ fillStyle: { color: 0x0 } })
    // .fillRect(this.x, this.y, 10, 10)

    // this.setBounce(1); // This will avoid enemy sticking to the wall
    this.setVelocity(Math.random() * this.speed - 50, Math.random() * this.speed - 50); // Set initial random velocity

    animations.enshadow(this)
    // animations.wobbleSprite(this.scene, this)
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

    const tileX = this.scene.map.worldToTileX(this.x)
    const tileY = this.scene.map.worldToTileY(this.y)
    if (tileX && tileX > 0 && tileY && tileY > 0) {
      const rm = this.scene.dungeon.getRoomAt(tileX, tileY) as RoomWithEnemies
      if (rm) { 
        this.currentRoom = rm
      }
    }

    if (!this.currentRoom) {
      throw Exception
    }

    if (this.debug) {
      this.gfx
        .clear()
        .lineBetween(this.x, this.y, 
          this.scene.map.tileToWorldX(this.currentRoom.centerX)!, this.scene.map.tileToWorldY(this.currentRoom.centerY)!
        )
    }

    this.lookForFeller()
    this.move(time, delta)
  }

  lookForFeller() {
    if ((this.currentRoom.centerX === this.scene.playerRoom.centerX) && (this.currentRoom.centerY === this.scene.playerRoom.centerY)) {
      !this.visible && this.setVisible(true)

      if (!this.seenFeller) {
        console.log('seen feller', this)
        this.seenFeller = true
        this.target = this.scene.feller.sprite
      }
    } else {
      // if we are not in same room as player, hide sprite
      this.setVisible(false)
      this.seenFeller = false
    }
  }

  acquireTarget(time: any, delta: any) {
    if (!this.seenFeller) {
      // new location every 10 seconds
      if (time % 10000 < delta)
      { 
        this.target = new Phaser.Math.Vector2(Math.random() * (this.scene.game.config.width as number), Math.random() * (this.scene.game.config.height as number));
      }
    } else {
      this.target = this.scene.feller.sprite
    }
  }

  chaseTarget() {
    if (this.target) {
      const distance = Phaser.Math.Distance.BetweenPoints(this, this.target)
      if (this.seenFeller && distance > 5 * this.speed) {
        this.giveUpChasing()
      } else {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x!, this.target.y!);
        const wobbleX = Math.random() * this.speed * (Math.random() < 0.5 ? -1 : 1)
        const wobbleY = Math.random() * this.speed * (Math.random() < 0.5 ? -1 : 1)
        this.setVelocity(Math.cos(angle) * this.speed + wobbleX, Math.sin(angle) * this.speed + wobbleY);
      }
    }
  }

  wobble() {
    const angle = Math.random() * 2 * Math.PI
    const wobbleX = Math.random() * this.speed * (Math.random() < 0.5 ? -1 : 1)
    const wobbleY = Math.random() * this.speed * (Math.random() < 0.5 ? -1 : 1)
    this.setVelocity(Math.cos(angle) * this.speed + wobbleX, Math.sin(angle) * this.speed + wobbleY);
  }

  giveUpChasing() {
    this.seenFeller = false
  }

  move(time: any, delta: any) {
    this.acquireTarget(time, delta)
    this.chaseTarget()
    this.wobble()
  }

  pushAway(other: Phaser.Physics.Arcade.Sprite) {
    if (this.pushing > 0) {
      this.pushing--
      return
    }
    this.pushing = 100
    const overlapAngle = Phaser.Math.Angle.BetweenPoints(other, this)
    const distance = Phaser.Math.Distance.BetweenPoints(other, this)
    const force = 200 / ((distance * distance) || 1)
    if (this.debug) {
      console.log('pushing away', { velocity: this.body?.velocity, overlapAngle, distance, force, })
    }
    if (this.body && !isNaN(this.body.velocity.x) && !isNaN(this.body.velocity.y)) {
      this.body.velocity.x += force * Math.sin(overlapAngle)
      this.body.velocity.y += force * Math.cos(overlapAngle)
    }
    if (other.body && !isNaN(other.body.velocity.x) && !isNaN(other.body.velocity.y)) {
      other.body.velocity.x -= force * Math.sin(overlapAngle)
      other.body.velocity.y -= force * Math.cos(overlapAngle)
    }
  }

  die() {
    this.gfx.clear()
    this.dead = true
    EventEmitter.emit('demonFelled')
    this.scene.checkLevelComplete() // dont call after destroy()
    this.destroy()
  }
}
