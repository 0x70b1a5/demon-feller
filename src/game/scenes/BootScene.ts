export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Create loading text
    const loadingText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50, "Loading...", { font: '20px Arial', color: '#ffffff' });
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

        (window as any).WebFont.load({
          custom: {
            families: [ 'pkmn' ]
          },
          active: () =>
          {
            console.log('fonts loaded')
          }
        });
    }, this);

    // Preload all assets
    // Images
    // this.load.image('background', 'assets/images/background.png');
    // this.load.spritesheet('playerSpriteWalk', 'assets/images/player_walk.png', { frameWidth: 32, frameHeight: 32 });
    // this.load.image('bullet', 'assets/images/bullet.png');
    // this.load.image('enemy', 'assets/images/enemy.png');
    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
    this.load.image('powerup', 'assets/powerup.png');
    this.load.image('gun', 'assets/gun.png');
    this.load.image('feller', 'assets/feller.png');

    // this.load.image('playerSpriteIdle', 'assets/images/player_idle.png');

    // Audio
    // this.load.audio('song1', 'assets/audio/song1.mp3');
    // this.load.audio('song2', 'assets/audio/song2.mp3');
    // this.load.audio('song3', 'assets/audio/song3.mp3');

    // Tilemap
    // this.load.image('tiles', 'assets/tilemaps/tiles.png');
    
    // Fonts
    const element = document.createElement('style');
    document.head.appendChild(element);
    const sheet = element.sheet!;
    let styles = '@font-face { font-family: "pkmn"; src: url("assets/fonts/pkmn/PKMN RBYGSC.ttf"); }\n';
    sheet.insertRule(styles, 0);
  }

  init() {

  }

  create() {
    // Switch to the main menu scene when all assets are loaded
    this.scene.start('MainMenuScene');
  }
}
