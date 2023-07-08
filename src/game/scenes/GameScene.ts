import Phaser from 'phaser'
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

import animations from '../util/animate'
import colors from '../constants/colors'
import scales from '../constants/scaling'; 
import TILES from '../constants/tiles'
import Dungeon from '@mikewesthad/dungeon';
import Feller from '../Feller';

export interface Room { id: string, portals: Portal[], startingXY: null | [number | (() => number), number | (() => number)] }
export interface Portal { destination: string, sprite?: Phaser.Physics.Arcade.Sprite, label?: RexUIPlugin.Label }
export interface OurCursorKeys extends Phaser.Types.Input.Keyboard.CursorKeys {
  tractor: Phaser.Input.Keyboard.Key
}

export class GameScene extends Phaser.Scene {
  private feller!: Feller
  private rexUI!: RexUIPlugin
  level!: number
  hasPlayerReachedStairs!: boolean
  dungeon!: Dungeon
  groundLayer!: Phaser.Tilemaps.TilemapLayer
  stuffLayer!: Phaser.Tilemaps.TilemapLayer
  
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

    const dungeon = this.dungeon = new Dungeon({
      width: 10,
      height: 10,
      doorPadding: 1,
      rooms: {
        width: { min: 3, max: 5, onlyOdd: true },
        height: { min: 3, max: 5 , onlyOdd: true },
        maxRooms: 10
      }
    })
    
    dungeon.drawToConsole({ });

    const map = this.make.tilemap({
      tileWidth: 200,
      tileHeight: 200,
      width: dungeon.width,
      height: dungeon.height
    })

    const tileset = map.addTilesetImage('tileset', 'tilesetmap', 200, 200, 0, 0)!
    const groundLayer = this.groundLayer = map.createBlankLayer('Ground', tileset)!.fill(TILES.BLANK)
    // const stuffLayer =  this.stuffLayer = map.createBlankLayer('Stuff', tileset)!
    groundLayer.setCollisionByExclusion([0, 1, 2]);
    
    this.dungeon.rooms.forEach((room) => {
      const { x, y, width, height, left, right, top, bottom } = room;

      // Fill the floor with mostly clean tiles
      this.groundLayer.weightedRandomize(TILES.FLOOR, x + 1, y + 1, width - 2, height - 2);

      // Place the room corners tiles
      // this.groundLayer.putTileAt(TILES.WALL.TOP_LEFT, left, top);
      // this.groundLayer.putTileAt(TILES.WALL.TOP_RIGHT, right, top);
      // this.groundLayer.putTileAt(TILES.WALL.BOTTOM_RIGHT, right, bottom);
      // this.groundLayer.putTileAt(TILES.WALL.BOTTOM_LEFT, left, bottom);

      // Fill the walls with mostly clean tiles
      this.groundLayer.weightedRandomize(TILES.WALL.TOP, left + 1, top, width - 2, 1);
      this.groundLayer.weightedRandomize(TILES.WALL.BOTTOM, left + 1, bottom, width - 2, 1);
      this.groundLayer.weightedRandomize(TILES.WALL.LEFT, left, top + 1, 1, height - 2);
      this.groundLayer.weightedRandomize(TILES.WALL.RIGHT, right, top + 1, 1, height - 2);

      // Dungeons have rooms that are connected with doors. Each door has an x & y relative to the
      // room's location. Each direction has a different door to tile mapping.
      const doors = room.getDoorLocations(); // → Returns an array of {x, y} objects
      for (let i = 0; i < doors.length; i++) {
        if (doors[i].y === 0) {
          this.groundLayer.putTilesAt(TILES.DOOR.TOP, x + doors[i].x - 1, y + doors[i].y);
        } else if (doors[i].y === room.height - 1) {
          this.groundLayer.putTilesAt(TILES.DOOR.BOTTOM, x + doors[i].x - 1, y + doors[i].y);
        } else if (doors[i].x === 0) {
          this.groundLayer.putTilesAt(TILES.DOOR.LEFT, x + doors[i].x, y + doors[i].y - 1);
        } else if (doors[i].x === room.width - 1) {
          this.groundLayer.putTilesAt(TILES.DOOR.RIGHT, x + doors[i].x, y + doors[i].y - 1);
        }
      }
    });

    const rooms = this.dungeon.rooms.slice();
    const startRoom = rooms.shift();
    const endRoom = Phaser.Utils.Array.RemoveRandomElement(rooms);
    const otherRooms = Phaser.Utils.Array.Shuffle(rooms).slice(0, rooms.length * 0.9);
    
    this.physics.world.createDebugGraphic();   

    // Place the player in the first room
    const playerRoom = startRoom!;
    const x = map.tileToWorldX(playerRoom.centerX)!;
    const y = map.tileToWorldY(playerRoom.centerY)!;

    this.feller = new Feller(this, x, y);

    // this.physics.add.collider(this.feller.sprite, stuffLayer);
    this.physics.add.collider(this.feller.sprite, groundLayer);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.startFollow(this.feller);
  }

  update(time: any, delta: any) {
    this.feller.update();
    // console.log(this.feller.sprite.body!.x, this.feller.sprite.body!.y)
  }
}
