import Phaser from 'phaser'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

import animations from '../util/animate'
import colors from '../constants/colors'
import scales from '../constants/scaling'; 
import TILES from '../constants/tiles'
import Dungeon, { Room } from '@mikewesthad/dungeon';
import Feller from '../Feller';
import TilemapVisibility from '../TilemapVisibility';
import Enemy, { EnemyConfig } from '../Enemy';
import Bullet from '../Bullet';
import Goo from '../Goo';
import PowerUp, { PowerUpType } from '../Powerup';
import EventEmitter from '../EventEmitter';

export interface Portal { destination: string, sprite?: Phaser.Physics.Arcade.Sprite, label?: RexUIPlugin.Label }
export interface RoomWithEnemies extends Room {
  enemies: Enemy[]
  hasSpawnedPowerup: boolean
}
export interface OurCursorKeys extends Phaser.Types.Input.Keyboard.CursorKeys {
  tractor: Phaser.Input.Keyboard.Key
}

export class GameScene extends Phaser.Scene {
  feller!: Feller
  debug = false
  rexUI!: RexUIPlugin
  level!: number
  hasPlayerReachedStairs!: boolean
  dungeon!: Dungeon
  rooms!: RoomWithEnemies[]
  groundLayer!: Phaser.Tilemaps.TilemapLayer
  stuffLayer!: Phaser.Tilemaps.TilemapLayer
  tilemapVisibility!: TilemapVisibility;
  playerRoom!: RoomWithEnemies
  enemies: Enemy[] = []
  map!: Phaser.Tilemaps.Tilemap
  demonsFelled = 0
  
  constructor() {
    super({ key: 'GameScene' })
    this.level = 0
  }

  preload() {
  }

  init() {
  }

  create() {
    this.level++
    this.hasPlayerReachedStairs = false
    if (this.debug) {
      this.physics.world.createDebugGraphic();   
    }

    const dungeon = this.dungeon = new Dungeon({
      width: 25,
      height: 25,
      doorPadding: 1,
      rooms: {
        width: { min: 5, max: 13, onlyOdd: true },
        height: { min: 5, max: 13, onlyOdd: true },
        maxRooms: 20,
      }
    })

    const dhtml = dungeon.drawToHtml({ })
    EventEmitter.emit('minimap', dhtml)

    const map = this.map = this.make.tilemap({
      tileWidth: 200,
      tileHeight: 200,
      width: dungeon.width,
      height: dungeon.height
    })

    const tileset = map.addTilesetImage('tileset', undefined, 200, 200, 0, 0)!
    const groundLayer = this.groundLayer = map.createBlankLayer('Ground', tileset)!.fill(TILES.BLANK)
    // const stuffLayer =  this.stuffLayer = map.createBlankLayer('Stuff', tileset)!
    
    this.dungeon.rooms.forEach((room) => {
      const { x, y, width, height, left, right, top, bottom } = room;

      // Fill the floor with mostly clean tiles
      this.groundLayer.weightedRandomize(TILES.FLOOR, x + 1, y + 1, width - 2, height - 2);

      // Place the room corners tiles
      this.groundLayer.putTileAt(TILES.WALL.TOP_LEFT, left, top);
      this.groundLayer.putTileAt(TILES.WALL.TOP_RIGHT, right, top);
      this.groundLayer.putTileAt(TILES.WALL.BOTTOM_RIGHT, right, bottom);
      this.groundLayer.putTileAt(TILES.WALL.BOTTOM_LEFT, left, bottom);

      // Fill the walls with mostly clean tiles
      this.groundLayer.weightedRandomize(TILES.WALL.TOP, left + 1, top, width - 2, 1);
      this.groundLayer.weightedRandomize(TILES.WALL.BOTTOM, left + 1, bottom, width - 2, 1);
      this.groundLayer.weightedRandomize(TILES.WALL.LEFT, left, top + 1, 1, height - 2);
      this.groundLayer.weightedRandomize(TILES.WALL.RIGHT, right, top + 1, 1, height - 2);

      // Dungeons have rooms that are connected with doors. Each door has an x & y relative to the
      // room's location. Each direction has a different door to tile mapping.
      const doors = room.getDoorLocations(); // → Returns an array of {x, y} objects
      for (let door of doors) {
        if (door.y === 0) {
          this.groundLayer.putTileAt(TILES.DOOR.TOP, x + door.x, y + door.y);
        } else if (door.y === room.height - 1) {
          this.groundLayer.putTileAt(TILES.DOOR.BOTTOM, x + door.x, y + door.y);
        } else if (door.x === 0) {
          this.groundLayer.putTileAt(TILES.DOOR.LEFT, x + door.x, y + door.y);
        } else if (door.x === room.width - 1) {
          this.groundLayer.putTileAt(TILES.DOOR.RIGHT, x + door.x, y + door.y);
        }
      }
    });

    // MUST SET COLLISION ***AFTER*** MODIFYING LAYER
    groundLayer.setCollisionByExclusion([0, 1, 2, 3, 4, 13, 14]);
    
    if (this.debug) {
      const debugGraphics = this.add.graphics().setAlpha(0.75);
      groundLayer.renderDebug(debugGraphics, {
        tileColor: null, // Color of non-colliding tiles
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
        faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
      });
    }

    const rooms = this.rooms = this.dungeon.rooms.slice() as RoomWithEnemies[];
    const startRoom = rooms.shift();
    const otherRooms = Phaser.Utils.Array.Shuffle(rooms);

    const shadowLayer = map.createBlankLayer('Shadow', tileset)!.fill(TILES.BLANK)!;
    this.tilemapVisibility = new TilemapVisibility(shadowLayer);

    // Place the player in the first room
    this.playerRoom = startRoom!;

    const x = map.tileToWorldX(this.playerRoom.centerX)!;
    const y = map.tileToWorldY(this.playerRoom.centerY)!;

    this.feller = new Feller(this, x, y);

    // this.physics.add.collider(this.feller.sprite, stuffLayer);
    this.physics.add.collider(this.feller.sprite, groundLayer, () => console.log('collide'));

    const camera = this.cameras.main;
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.startFollow(this.feller.sprite);

    otherRooms.forEach(room => {
      for(let i = 0; i < Math.random() * 8; i++) {
        const enemy = Math.random() < 0.5 
          ? new Goo(this, { room, texture: 'goo' })
          : new Enemy(this, { room, texture: 'pig', velocity: 50 })
        this.spawnEnemy(enemy)
        room.enemies ||= []
        room.enemies.push(enemy)
      }
    });

    EventEmitter.on('demonFelled', () => {
      this.demonsFelled++
      EventEmitter.emit('demonsFelled', this.demonsFelled)
    })

    let demonsToFell = 0
    for (let room of this.rooms) {
      demonsToFell += room.enemies.length
    }

    EventEmitter.emit('demonsToFell', demonsToFell)
  }

  rollPowerUp() {
    let powerUps = [
      {type: PowerUpType.Health, weight: 1},
      {type: PowerUpType.Shoot, weight: 1},
      {type: PowerUpType.Speed, weight: 1},
    ];
    
    let totalWeight = powerUps.reduce((sum, powerUp) => sum + powerUp.weight, 0);
    
    let randomNum = Math.random() * totalWeight;
    
    let weightSum = 0;
    for (let powerUp of powerUps) {
      weightSum += powerUp.weight;
      
      if (randomNum <= weightSum) {
        return powerUp.type
      }
    }

    return powerUps[0].type
  }

  spawnPowerUp(room: RoomWithEnemies, type: PowerUpType) {
    const x = this.map.tileToWorldX(room.centerX)!;
    const y = this.map.tileToWorldY(room.centerY)!;
    
    const powerup = new PowerUp(this, x, y, type);
    
    const gfx = this.add.graphics({ lineStyle: { color: 0xff0000, width: 3 }})
      .lineBetween(x, y, this.feller.sprite.x, this.feller.sprite.y)

    this.physics.add.overlap(this.feller.sprite, powerup, () => {
      this.feller.pickupPowerUp(powerup);
      powerup.destroy();
      gfx.clear()
    });
  }
  
  checkLevelComplete() {
    const roomsWithEnemies = this.rooms.filter(room => room.enemies?.filter(e => !e.dead).length > 0)
    console.log({roomsWithEnemies})
    if (roomsWithEnemies.length > 0) {
      return false
    }
    alert('You win!')
    EventEmitter.emit('gameOver')
  }

  spawnEnemy(enemy: Enemy) {
    this.physics.add.overlap(this.feller.sprite, enemy, () => {
      enemy.attack(this.feller)
    });
    // TODO they're pushing each other out of bounds
    // this.enemies.forEach(e => this.physics.add.overlap(e, enemy, () => {
    //   enemy.pushAway(e)
    // }))
    this.enemies.push(enemy)
  }

  update(time: any, delta: any) {
    this.feller.update(time, delta);

     // Find the player's room using another helper method from the dungeon that converts from
    // dungeon XY (in grid units) to the corresponding room instance
    const playerTileX = this.groundLayer.worldToTileX(this.feller.sprite.x);
    const playerTileY = this.groundLayer.worldToTileY(this.feller.sprite.y);
    this.playerRoom = this.dungeon.getRoomAt(playerTileX, playerTileY)! as RoomWithEnemies;
    
    this.tilemapVisibility.setActiveRoom(this.playerRoom);
    // console.log(this.feller.sprite.body!.x, this.feller.sprite.body!.y)
  }
}
