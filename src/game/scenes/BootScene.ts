export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Create loading text
    const loadingText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50, 'Loading...', { font: '20px Arial', color: '#ffffff' });
    loadingText.setOrigin(0.5);

    // Create progress bar
    let progressBar = this.add.graphics();
    let progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(this.cameras.main.centerX - 160, this.cameras.main.centerY, 320, 50);
    
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(this.cameras.main.centerX - 150, this.cameras.main.centerY + 10, 300 * value, 30);
    }, this);

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    }, this);

    // Preload all assets
    // Images
    this.load.image('powerupBG', 'assets/powerupBG.png');
    this.load.image('powerup0', 'assets/powerupHealth.png');
    this.load.image('powerup1', 'assets/powerupSpeed.png');
    this.load.image('powerup2', 'assets/powerupFast.png');
    this.load.image('powerup3', 'assets/powerupShoot.png');
    this.load.image('gun', 'assets/gun.png');
    this.load.image('boom', 'assets/boom.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('bigbullet', 'assets/bigbullet.png');
    this.load.image('feller', 'assets/feller.png');
    this.load.image('tileset', 'assets/tileset.png')
    this.load.image('door', 'assets/door.png')
    this.load.image('soul', 'assets/soul.png')
    this.load.image('goo', 'assets/goo.png')
    this.load.image('pig', 'assets/pig.png')
    this.load.spritesheet(
      'feller-sheet',
      '../assets/spritesheets/feller.png',
      {
        frameWidth: 400,
        frameHeight: 400,
        margin: 0,
        spacing: 0
      }
    );

    // this.load.image('playerSpriteIdle', 'assets/images/player_idle.png');

    // Audio
    this.load.audio('bat', 'assets/sounds/bat.mp3');
    this.load.audio('magic', 'assets/sounds/magic.mp3');
    // this.load.audio('song2', 'assets/audio/song2.mp3');
    // this.load.audio('song3', 'assets/audio/song3.mp3');

    // Tilemap
    // this.load.image('tiles', 'assets/tilemaps/tiles.png');
  }

  init() {

  }

  create() {
    // Switch to the main menu scene when all assets are loaded
    this.scene.start('MainMenuScene');
  }
}
