/**
 * 
 * 
import Phaser from 'phaser';
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let avatar;
let rooms;
let doors;
let textZone;
let items;

function preload() {
    this.load.image('avatar', 'assets/avatar.png');
    this.load.image('room', 'assets/room.png');
    this.load.image('door', 'assets/door.png');
    this.load.image('textZone', 'assets/textZone.png');
    this.load.image('item', 'assets/item.png');
}

function create() {
    rooms = Array.from({length: 5}, (_, i) => createRoom(i * 800, 300, this));
    doors = rooms.map((room, i) => createDoor((i * 800) + 700, 300, this));  // create a door at the right end of each room

    avatar = this.physics.add.sprite(100, 450, 'avatar');
    
    textZone = this.add.sprite(100, 100, 'textZone');
    textZone.visible = false;  // hide text zone initially
    this.physics.add.collider(avatar, doors, handleDoorCollision, null, this);
    items = Array.from({length: 5}, (_, i) => createItem((i * 800) + 400, 300, this));  // create an item in the middle of each room

    this.physics.add.overlap(avatar, items, handleItemOverlap, null, this);
}

function createItem(x, y, scene) {
    const item = scene.physics.add.sprite(x, y, 'item');
    item.body.immovable = true;
    return item;
}

function handleItemOverlap(avatar, item) {
    textZone.visible = true;
    textZone.setText(`You've interacted with an item in room ${rooms.indexOf(findRoomForItem(item)) + 1}!`);
    item.disableBody(true, true);  // remove the item after interacting with it
}

function findRoomForItem(item) {
    // Return the room that contains this item.
    // This assumes that each room contains exactly one item.
    return rooms.find(room => Math.abs(room.x - item.x) < room.width);
}

function handleDoorCollision(avatar, door) {
    const nextDoorIndex = doors.indexOf(door) + 1;
    if (nextDoorIndex < doors.length) {
        avatar.x = doors[nextDoorIndex].x - 700;  // position the avatar at the left end of the next room
    }
}}

function createDoor(x, y, scene) {
    const door = scene.physics.add.sprite(x, y, 'door');
    door.body.immovable = true;
    return door;
}

function update() {
    const cursors = this.input.keyboard.createCursorKeys();

    if (cursors.left.isDown) {
        avatar.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        avatar.setVelocityX(160);
    } else {
        avatar.setVelocityX(0);
    }

    if (cursors.up.isDown) {
        avatar.setVelocityY(-160);
    } else if (cursors.down.isDown) {
        avatar.setVelocityY(160);
    } else {
        avatar.setVelocityY(0);
    }
}

function createRoom(x, y, scene) {
    const room = scene.physics.add.sprite(x, y, 'room');
    room.body.immovable = true;  // Make the room immovable
    return room;
}
function create() {
    // This could be replaced with more complex room creation logic
    rooms = Array.from({length: 5}, (_, i) => createRoom(i * 800, 300, this));

    avatar = this.physics.add.sprite(100, 450, 'avatar');
    this.physics.add.collider(avatar, rooms, handleRoomTransition, null, this);
}

function handleRoomTransition(avatar, room) {
    // This function is triggered when the avatar collides with a room
    // In this case, we'll just move the avatar to the center of the next room
    const nextRoomIndex = rooms.indexOf(room) + 1;
    if (nextRoomIndex < rooms.length) {
        avatar.x = rooms[nextRoomIndex].x;
    }
}
 */

export {}