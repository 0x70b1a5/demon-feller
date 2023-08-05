import audioFiles from "../constants/audioFiles";

export class BootScene extends Phaser.Scene {
  texts = [
    'Performing rituals \n of cleansing...',
    'Imploring divine assistance...',
    'Going to confession...',
    'Holying water...',
    'Repenting of sins...',
    'Beseeching the Almighty...',
    'Feeding the hungry...',
    'Clothing the naked...',
    'Tending to the sick...',
    'Visiting the imprisoned...',
    'Admonishing the heretic...',
    'Offering up suffering...',
    'Anointing the sick...',
    'Edifying brethren...',
    'Giving water to the thirsty...',
    'Sheltering the homeless...',
    'Burying dead...',
    'Instructing ignorant...',
    'Counseling doubtful...',
    'Bearing wrongs patiently...',
    'Forgiving offenses...',
    'Comforting afflicted...',
    'Praying for the living...',
    'Praying for the dead...'
  ]
  constructor() {
    super('BootScene');
  }

  preload() {
    // Create loading text
    const loadingText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50, 'Loading...', { font: '20px pkmn', color: '#ffffff' });
    loadingText.setOrigin(0.5);

    // Create progress bar
    let progressBar = this.add.graphics();
    let progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(this.cameras.main.centerX - 160, this.cameras.main.centerY, 320, 50);
    
    this.load.on('progress', (value: number) => {
      loadingText.text = this.texts[Math.floor(Math.random() * this.texts.length)]
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(this.cameras.main.centerX - 150, this.cameras.main.centerY + 10, 300 * value, 30);
    }, this);

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      this.scene.launch('AudioScene');

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
    this.load.image('powerup1', 'assets/powerupHealth.png');
    this.load.image('powerup2', 'assets/powerupSpeed.png');
    this.load.image('powerup3', 'assets/powerupFast.png');
    this.load.image('powerup4', 'assets/powerupShoot.png');
    this.load.image('powerup5', 'assets/powerupFist.png');
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
      frameWidth: 173,
      frameHeight: 233,
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
      frameWidth: 161,
      frameHeight: 151,
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
    this.load.image('mm-check', 'assets/mm-check.png')
    this.load.image('mm-star', 'assets/mm-star.png')
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
    this.load.audio('bat', 'assets/sounds/bat.ogg');
    this.load.audio('magic', 'assets/sounds/magic.ogg');

    // Music
    const [firstSongKey, firstSongFile] = Phaser.Utils.Array.Shuffle(Object.entries(audioFiles)).pop()!
    this.load.audio(firstSongKey, firstSongFile)

    // SFX
    this.load.audio('belcherbelch', 'assets/sounds/belcherbelch.ogg')
    this.load.audio('belcherbreathe', 'assets/sounds/belcherbreathe.ogg')
    this.load.audio('piggrunt', 'assets/sounds/piggrunt.ogg')
    this.load.audio('pigsqueal', 'assets/sounds/pigsqueal.ogg')
    this.load.audio('shoot', 'assets/sounds/shoot.ogg')
    this.load.audio('bullethit', 'assets/sounds/bullethit.ogg')
    this.load.audio('goosquelch', 'assets/sounds/goosquelch.ogg')
    this.load.audio('goosquish', 'assets/sounds/goosquish.ogg')
    this.load.audio('impsqueak', 'assets/sounds/impsqueak.ogg')
    this.load.audio('impdie', 'assets/sounds/impdie.ogg')
    this.load.audio('soulgrunt', 'assets/sounds/soulgrunt.ogg')
    this.load.audio('soulgrumble', 'assets/sounds/soulgrumble.ogg')
    this.load.audio('fellerhurt', 'assets/sounds/fellerhurt.ogg')
    this.load.audio('stun', 'assets/sounds/fryingpan.ogg')
    this.load.audio('explosion', 'assets/sounds/explosion.ogg')

    // Tilemap
    // this.load.image('tiles', 'assets/tilemaps/tiles.png');
  }

  init() {

  }

  create() {
    // Switch to the main menu scene when all assets are loaded
    this.scene.launch('MainMenuScene');
  }
}
