import Phaser from 'phaser'
import { GameScene, RoomWithEnemies } from './scenes/GameScene';
import { Room } from '@mikewesthad/dungeon';
import Feller from './Feller';
import EventEmitter from './EventEmitter';
import animations from './util/animate';
import { Exception } from 'sass';
import assert from './util/assert';
import Pathfinding, { DiagonalMovement } from 'pathfinding';
import TILE_MAPPING from './constants/tiles';
import { v4 as uuid } from 'uuid'

export interface EnemyConfig {
  level?: number
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
  Belcher,
  Imp,
}

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  debug = false


  target!: Phaser.Types.Math.Vector2Like;
  health: number;
  damage: number;
  room!: RoomWithEnemies
  scene!: GameScene
  seenFeller = false
  speed = 100
  knockback = 100
  dead = false
  gfx!: Phaser.GameObjects.Graphics;
  pushing = 0
  enemyType?: EnemyType
  movementAngle = 0
  stun = 0
  stunImmunity = 0
  guid = uuid()

  constructor(scene: GameScene, config: EnemyConfig, x?: number, y?: number) {
    super(scene, 0, 0, config.texture);
    this.health = (config.health || 3) * (config.level ? Math.ceil(config.level / 2) : 1);
    this.damage = (config.damage || 1) * (config.level ? Math.ceil(config.level / 2) : 1);
    this.room = config.room
    this.scene = scene
    this.speed = config.velocity || this.speed
    this.enemyType = config.enemyType

    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.physics.add.collider(this, scene.groundLayer)
    scene.physics.add.collider(this, scene.stuffLayer)
    scene.physics.add.collider(this, scene.stuffs)
    
    if (!(x && y)) {
      let [spawnX, spawnY] = scene.findUnoccupiedRoomTile(config.room, 3)
      
      x = spawnX
      y = spawnY

    }

    console.log('actually spawning enemy at', { x, y })

    this
    .ensureIsInRoom(x, y)
    .setX(scene.map.tileToWorldX(this.room.x + x)! + scene.map.tileWidth / 2)
    .setY(scene.map.tileToWorldY(this.room.y + y)! + scene.map.tileHeight / 2)

    this
      .setOrigin(0.5, 0.5)
      .setBounce(1, 1)

    this.gfx = this.scene.add.graphics({ lineStyle: { color: 0x0 }, fillStyle: { color: 0xff0000 }})
    // this.gfx.strokeCircle(this.x, this.y, this.width)

    if (this.debug) {
      this.gfx
      .fillRect(this.x, this.y, 10, 10)
    }
  }

  ensureIsInRoom(x: number, y: number) {
    const scene = this.scene
    this
      .setX(
        Phaser.Math.Clamp(
          scene.map.tileToWorldX(x)!, 
          scene.map.tileToWorldX(this.room.x + 2)!, 
          scene.map.tileToWorldX(this.room.x + this.room.width - 2)!
        ))
      .setY(
        Phaser.Math.Clamp(
          scene.map.tileToWorldY(y)!, 
          scene.map.tileToWorldY(this.room.y + 2)!, 
          scene.map.tileToWorldY(this.room.y + this.room.height - 2)!
      ))

    return this
  }

  attack(feller: Feller) {
    if (this.dead) return
    feller.hit(this)
  }

  hit(by: Phaser.Types.Math.Vector2Like & { damage: number, knockback: number }) {
    this.health -= by.damage;
    if (this.health <= 0) {
      this.die();
    }

    if (by.knockback && this.stunImmunity < 1) {
      this.stun = by.knockback
      this.stunImmunity = by.knockback * 2
      // radians 
      const knockbackDir = Phaser.Math.Angle.BetweenPoints(by, this)
      let knockbackVelocityX = (by.x! < this.x ? 1 : -1) * (Math.sin(knockbackDir) + by.knockback);
      let knockbackVelocityY = (by.y! < this.y ? 1 : -1) * (Math.cos(knockbackDir) + by.knockback);
      
      this.setVelocityX(knockbackVelocityX);
      this.setVelocityY(knockbackVelocityY);

      const origRotation = this.rotation
      this.scene.tweens.add({
        targets: this,
        rotation: {
          value: { from: Phaser.Math.DegToRad(-20), to: origRotation },
          duration: this.stun * 10,
          repeat: false,  
          ease: 'Elastic',
        },
        onComplete: () => {
          this.setRotation(origRotation)
        }
      });
    }
  }

  fixedUpdate(time: any, delta: any) {    
    if (this.dead) return
    
    super.preUpdate(time, delta);

    if (this.debug) {
      this.gfx
        .clear()
        // .lineBetween(this.x, this.y, 
        //   this.scene.map.tileToWorldX(this.room.centerX)!, this.scene.map.tileToWorldY(this.room.centerY)!
        // )
        if(this.target)
        this.gfx
        .lineBetween(this.x, this.y, this.target.x!, this.target.y!)
        // .fillRect(this.x, this.y, 5, 5)
    }

    if (this.seenFeller) {
      if (this.stun < 1) {
        this.stunImmunity > 0 && this.stunImmunity--
        this.move(time, delta)
      } else {
        this.stun--
      }
    } else {
      this.showIfInRoom()
    }
  }

  showIfInRoom() {
    if (this.room.guid === this.scene.fellerRoom.guid) {
      !this.visible && this.setVisible(true)
      console.log('seen feller', this)
      this.seenFeller = true
      this.target = this.scene.feller.sprite
      
      if(this.debug) {
        this.gfx.setDefaultStyles({ fillStyle: { color: 0x0000ff }})
      }
    } else {
      // if we are not in same room as player, hide sprite
      this.setVisible(false)
      this.seenFeller = false
    }
  }

  move(time: any, delta: any) {
    this.chaseTarget()
    this.wobble()
    this.setVelocity(Math.cos(this.movementAngle) * this.speed, Math.sin(this.movementAngle) * this.speed)
  }

  chaseTarget() {
    this.findPathToTarget()
    this.takePathToTarget()
  }

  path!: number[][]
  findPathToTarget() {
    if (!(this.x && this.y && this.target?.x && this.target?.y)) {
      return
    }
    
    this.path = this.scene.pathfinder.findPath(
      this.scene.map.worldToTileX(this.x)!, 
      this.scene.map.worldToTileY(this.y)!, 
      this.scene.map.worldToTileX(this.target.x)!, 
      this.scene.map.worldToTileY(this.target.y)!, 
      this.scene.pathfindingGrid.clone()
    )

    if (this.debug) {
      for (let step of this.path) {
        this.gfx.fillCircle((this.x!)!, (this.y!)!,5)
        .fillRect((this.target.x!)!, (this.target.y!)!, 5, 5)
        .fillRect( this.scene.map.tileToWorldX(step[0])!, this.scene.map.tileToWorldY(step[1])!, 5,5 )
      }
    }
  }

  takePathToTarget() {
    const secondStep = this.path?.[1]
    if (secondStep?.length) {
      // console.log({ firstStep })
      let dest = this.scene.map.tileToWorldXY(secondStep[0], secondStep[1])!
      // we want them to angle for the center of the tile, not the TL corner
      dest.x += this.scene.map.tileWidth / 2
      dest.y += this.scene.map.tileHeight / 2
      if (this.debug) {
        this.gfx.fillCircle(dest.x, dest.y, 10)
        this.gfx.setDefaultStyles({ lineStyle:{ color: 0x0000ff } })
        .lineBetween(this.x, this.y, dest.x, dest.y)
      }
      this.movementAngle = Phaser.Math.Angle.BetweenPoints(this, dest)
    }
  }

  wobble() {
    this.movementAngle += Phaser.Math.FloatBetween(-1, 1) * Phaser.Math.DegToRad(20)
  }

  die() {
    if (this.debug) {
      this.gfx.clear()
    }
    this.dead = true
    EventEmitter.emit('demonFelled')
    this.scene.checkRoomComplete(this.room)
    this.scene.checkLevelComplete() // dont call after destroy()
    this.setVisible(false)
    this.setActive(false)
    this.body!.destroy()
  }
}
