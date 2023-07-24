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



      // Fonts 
      (window as any).WebFont.load({
        custom: {
          families: [ 'pkmn' ]
        },
        active: () =>
        {
          // Fonts
          const element = document.createElement('style');
          document.head.appendChild(element);
          const sheet = element.sheet!;
          let styles = '@font-face { font-family: \'pkmn\'; src: url(\'assets/fonts/pkmn/PKMNRBYGSC.ttf\'); }\n';
          sheet.insertRule(styles, 0);
          console.log('fonts loaded')
        }
      });

    }, this);

    // Preload all assets

    // Scripts
    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

    // Images
    this.load.image('powerupBG', 'assets/powerupBG.png');
    this.load.image('powerup0', 'assets/powerupHealth.png');
    this.load.image('powerup1', 'assets/powerupSpeed.png');
    this.load.image('powerup2', 'assets/powerupFast.png');
    this.load.image('powerup3', 'assets/powerupShoot.png');
    this.load.image('powerup4', 'assets/powerupFist.png');
    this.load.image('gun', 'assets/gun.png');
    this.load.image('boom', 'assets/boom.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('barrel', 'assets/barrel.png');
    this.load.image('rock', 'assets/rock.png');
    this.load.image('smoke', 'assets/smoke.png');
    this.load.image('tribullet', 'assets/tribullet.png');
    this.load.image('bigbullet', 'assets/bigbullet.png');
    this.load.image('feller', 'assets/feller.png');
    this.load.image('tileset', 'assets/tileset.png')
    this.load.image('door', 'assets/door.png')
    this.load.image('soul', 'assets/soul.png')
    this.load.image('goo', 'assets/goo.png')
    this.load.image('pig', 'assets/pig.png')
    this.load.image('imp', 'assets/imp.png')
    this.load.image('belcher', 'assets/belcher.png')
    this.load.spritesheet('soul-sheet', 'assets/spritesheets/soul.png', {
      frameWidth: 200,
      frameHeight: 235,
      margin: 0,
      spacing: 0
    })
    this.load.spritesheet('belcher-sheet', 'assets/spritesheets/belcher.png', {
      frameWidth: 200,
      frameHeight: 167,
      margin: 0,
      spacing: 0
    })
    this.load.spritesheet('goo-sheet', 'assets/spritesheets/goo.png', {
      frameWidth: 200,
      frameHeight: 153,
      margin: 0,
      spacing: 0
    })
    this.load.spritesheet('pig-sheet', 'assets/spritesheets/pig.png',
    {
      frameWidth: 250,
      frameHeight: 261,
      margin: 0,
      spacing: 0
    })
    this.load.image('mm-feller', 'assets/mm-feller.png')
    this.load.image('mm-demon', 'assets/mm-demon.png')
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

    // Music
    /**
     * x i sekuin - heat
     * x system ready - captains of industry
     * x smoke access - clouds of smoke
     * x inner worlds - ouroboros
     * x actg - pentarchy
     * x dirac sea - armiger
     * x razorrhead - remains of a diary
     * dj - meeting miseria
     * x cor serpentis - fate
     * x smoke access - back into the cracks
     * x smoke access - faithless predator
     */
    this.load.audio('pentarchy', 'assets/music/actg-pentarchy.mp3');
    this.load.audio('cracks', 'assets/music/smoke_access-back_into_the_cracks.ogg');
    this.load.audio('faithless', 'assets/music/smoke_access-faithless_predator.ogg');
    this.load.audio('fate', 'assets/music/cor_serpentis-fate.ogg');
    this.load.audio('armiger', 'assets/music/dirac_sea-armiger.mp3');
    this.load.audio('ouroboros', 'assets/music/ouroboros.mp3');
    this.load.audio('remains', 'assets/music/rzorrhead-remains_of_a_diary.ogg');
    this.load.audio('clouds', 'assets/music/smoke_access-clouds_of_smoke.mp3');
    this.load.audio('surrender', 'assets/music/system_ready-captains_of_industry.mp3');
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
