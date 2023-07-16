import Phaser from 'phaser'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

import animations from '../util/animate'
import colors from '../constants/colors'
import scales from '../constants/scaling'; 
import TILES from '../constants/tiles'
import Dungeon, { Room } from '@mikewesthad/dungeon';
import Feller from '../Feller';
import TilemapVisibility from '../TilemapVisibility';
import Enemy from '../Enemy';
import Bullet from '../Bullet';

export interface Portal { destination: string, sprite?: Phaser.Physics.Arcade.Sprite, label?: RexUIPlugin.Label }
export interface OurCursorKeys extends Phaser.Types.Input.Keyboard.CursorKeys {
  tractor: Phaser.Input.Keyboard.Key
}

export class GameScene extends Phaser.Scene {
  feller!: Feller
  rexUI!: RexUIPlugin
  level!: number
  hasPlayerReachedStairs!: boolean
  dungeon!: Dungeon
  groundLayer!: Phaser.Tilemaps.TilemapLayer
  stuffLayer!: Phaser.Tilemaps.TilemapLayer
  finishedRooms: Room[] = []
  tilemapVisibility!: TilemapVisibility;
  playerRoom!: Room
  enemies: Enemy[] = []
  map!: Phaser.Tilemaps.Tilemap
  
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
    this.physics.world.createDebugGraphic();   

    const dungeon = this.dungeon = new Dungeon({
      width: 200,
      height: 200,
      doorPadding: 1,
      rooms: {
        width: { min: 5, max: 13, onlyOdd: true },
        height: { min: 5, max: 13, onlyOdd: true },
        maxRooms: 20,
      }
    })
    
    dungeon.drawToConsole({ });

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

    const debugGraphics = this.add.graphics().setAlpha(0.75);
    // groundLayer.renderDebug(debugGraphics, {
    //   tileColor: null, // Color of non-colliding tiles
    //   collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
    //   faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
    // });

    const rooms = this.dungeon.rooms.slice();
    const startRoom = rooms.shift();
    const endRoom = Phaser.Utils.Array.RemoveRandomElement(rooms);
    const otherRooms = Phaser.Utils.Array.Shuffle(rooms);
    console.log({ otherRooms })


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
      const enemy = new Enemy(this, { room, texture: 'goo' });
      // If an enemy hits Feller, he takes damage
      this.physics.add.collider(this.feller.sprite, enemy, () => {
        console.log('enemy hit feller')
        this.feller.hit(enemy.damage)
      });
      this.enemies.push(enemy)
    });
  }

  update(time: any, delta: any) {
    this.feller.update(time, delta);

     // Find the player's room using another helper method from the dungeon that converts from
    // dungeon XY (in grid units) to the corresponding room instance
    const playerTileX = this.groundLayer.worldToTileX(this.feller.sprite.x);
    const playerTileY = this.groundLayer.worldToTileY(this.feller.sprite.y);
    this.playerRoom = this.dungeon.getRoomAt(playerTileX, playerTileY)!;
    
    this.tilemapVisibility.setActiveRoom(this.playerRoom);
    // console.log(this.feller.sprite.body!.x, this.feller.sprite.body!.y)
  }
}
