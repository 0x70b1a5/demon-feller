import EventEmitter from "./EventEmitter";
import { RoomWithEnemies } from "./scenes/GameScene";

export default class TilemapVisibility {
  shadowLayer!: Phaser.Tilemaps.TilemapLayer;
  activeRoom: RoomWithEnemies | null

  constructor(shadowLayer: Phaser.Tilemaps.TilemapLayer) {
    this.shadowLayer = shadowLayer;
    this.activeRoom = null;
  }

  setActiveRoom(room: RoomWithEnemies) {
    // We only need to update the tiles if the active room has changed
    if (room !== this.activeRoom) {
      EventEmitter.emit('revealRoom', room.guid)
      this.setRoomAlpha(room, 0); // Make the new room visible
      if (this.activeRoom) this.setRoomAlpha(this.activeRoom, 0.5); // Dim the old room
      this.activeRoom = room;
    }
  }

  // Helper to set the alpha on all tiles within a room
  setRoomAlpha(room: RoomWithEnemies, alpha: number) {
    this.shadowLayer.forEachTile(
      t => (t.alpha = alpha),
      this,
      room.x,
      room.y,
      room.width,
      room.height
    );
  }
}