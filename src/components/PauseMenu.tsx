import React, { DOMElement, ReactNode, useEffect, useState } from 'react'
import AudioControls from './AudioControls'
import classNames from 'classnames'
interface PauseMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  restartButton: ReactNode
  onMinimapSizeChange: (s: string, b?: boolean) => void
  persistentNowPlaying: string
  onUnpause: () => void
  minimapSize: string
  controlsGuide: ReactNode
  level: number
}

type Tab = 
  | 'main'
  | 'controls'
  | 'credits'
  | 'index'

const PauseMenu: React.FC<PauseMenuProps> = ({ restartButton, controlsGuide, level, onUnpause, persistentNowPlaying, onMinimapSizeChange, minimapSize }) => {
  const [activeTab, setActiveTab] = useState<Tab>('main')
  const [indexIndex, setIndexIndex] = useState(0)
  const [minimapTransparent, setMinimapTransparent] = useState(true)

  const daemons = [
    { name: 'GLUTTON', damage: 1, desc: '"All tables were full of vomit and filth." Isa 28:8', health: 8, image: 'belcher.png' },
    { name: 'IMP', damage: 1, desc: '"Thou hast broken My yoke, thou hast burst My bands, and thou saidst: I will not serve." Jer 2:20', health: 1, image: 'imp.png' },
    { name: 'IMP MOTHER', damage: 1, desc: '"Beauty hath deceived thee, and lust hath perverted thy heart." Dan 13:56', health: 8, image: 'impmother.png' },
    { name: 'HOTHEAD', damage: 1, desc: '"Will a wise man fill his stomach with burning heat?" Job 15:2', health: 1, image: 'hothead.png' },
    { name: 'PIG', damage: 1, desc: '"If thou hast a mind to cast us out," they said, "send us into the herd of swine." Mat 8:31', health: 6, image: 'pig.png' },
    { name: 'BRAGGART', damage: 1, desc: '"Why is earth and ashes proud?" Sir 10:9', health: 3, image: 'goo.png' },
    { name: 'LOST SOUL', damage: 1, desc: '"Fear ye not them that kill the body, and are not able to kill the soul: but rather fear him that can destroy both soul and body in hell." Mat 10:28', health: 2, image: 'soul.png' },
    { name: 'COVETOR', damage: 1, desc: '"Let your manners be without covetousness, contented with such things as you have." Heb 13:5', health: 8, image: 'gambler.png' }, 
  ]

  let selectedDaemon = daemons[indexIndex] 

  useEffect(() => {
    selectedDaemon = daemons[indexIndex]
  }, [indexIndex])

  const onIndexIndexChange = (i: number) => {
    setIndexIndex(i)
  }

  return (
    <div className='pause-menu shado overlay'>
      <div className='notice'>
        <h1>GAME PAUSED</h1>
        <div className='btn shado resume' onClick={onUnpause}>RESUME</div>
        <div className='tabs row'>
          <button 
            className={classNames('tab btn shado', { active: activeTab === 'main' })}
            onClick={()=> setActiveTab('main')}
          >
            MAIN
          </button>
          <button 
            className={classNames('tab btn shado', { active: activeTab === 'credits' })}
            onClick={()=> setActiveTab('credits')}
          >
            CREDITS
          </button>
          <button 
            className={classNames('tab btn shado', { active: activeTab === 'controls' })}
            onClick={()=> setActiveTab('controls')}
          >
            CONTROLS
          </button>
          <button 
            className={classNames('tab btn shado', { active: activeTab === 'index' })}
            onClick={()=> setActiveTab('index')}
          >
            INDEX DAEMONORUM
          </button>
        </div>
        {activeTab === 'main' && <div className='main-tab wrapperupper tab-contents shado'>
          <AudioControls nowPlaying={persistentNowPlaying} />
          <div className='sxn shado'>
            <h2>MINIMAP:</h2>
            <div className='x'>
              <input type="checkbox" style={{ transform: 'scale(1.75)', marginRight: 16 }} checked={minimapTransparent} 
                onChange={(e) => {
                  setMinimapTransparent(old => !minimapTransparent)
                  onMinimapSizeChange('', !minimapTransparent)
                }} />
              <span>SEE-THRU</span>
            </div>
            <div className='x'>
              <select className='shado' value={minimapSize} style={{ padding: '8px 16px' }} onChange={(e) => onMinimapSizeChange(e.currentTarget.value)}>
                <option value='small'>SMALL (1/6)</option>
                <option value='medium'>MEDIUM (1/4)</option>
                <option value='large'>LARGE (1/3)</option>
              </select>
            </div>
          </div>
          <div className='sxn row' style={{ flexBasis: '100%' }}>
            {restartButton}
          </div>
        </div>}
        {activeTab === 'controls' && <div className='controls-tab wrapperupper tab-contents shado'>
          {controlsGuide}
        </div>}
        {activeTab === 'credits' && <div className='credits-tab wrapperupper col tab-contents shado'>
          <div className='sxn'>
            <h2 style={{ margin: 16 }}>MUSIC:</h2>
            <div className='row' style={{ flexWrap: 'wrap' }}>
              <a href='https://lovecrypt.net/album/annihilism' className='btn shado'>dj</a>
              <a href='https://lovecrypt.net/album/if-you-can-hear-this-send-backup' className='btn shado'>portals</a>
              <a href='https://lovecrypt.net/album/if-the-face-fits-wear-it' className='btn shado'>actg</a>
              <a href='https://lovecrypt.net/album/patchwork' className='btn shado'>deep soy</a>
              <a href='https://lovecrypt.net/album/terminal-cognition' className='btn shado'>dirac sea</a>
              <a href='https://lovecrypt.net/album/seraphic-wanderer' className='btn shado'>arrus</a>
              <a href='https://lovecrypt.net/album/atria' className='btn shado'>cor serpentis</a>
              <a href='https://lovecrypt.net/album/surrender-to-madness' className='btn shado'>system ready</a>
              <a href='https://lovecrypt.net/album/i-sekuin' className='btn shado'>i sekuin</a>
              <a href='https://lovecrypt.net/album/20-20' className='btn shado'>seeinnerworlds</a>
              <a href='https://lovecrypt.net/album/isle-of-none' className='btn shado'>bagaski</a>
              <a href='https://lovecrypt.net/album/childhoods-end' className='btn shado'>subboreal</a>
              <a href='https://lovecrypt.net/album/greenhouse-ii-2' className='btn shado'>smoke access</a>
            </div>
            <h2 style={{ margin: 16 }}>CODE:</h2>
            <div className='row'>
              <a href='https://x.com/lovecrypt' className='btn shado'>akira</a>
            </div>
          </div>
        </div>}
        {activeTab === 'index' && <div className='index-tab col wrapperupper tab-contents shado'>
          <div className='daemons-list'>
            <div className='sxn shado'>
              <img src={`./assets/${selectedDaemon.image}`} />
              <h3>{selectedDaemon.name}</h3>
              <div className='health'>
                Health: {selectedDaemon.health * level} ({selectedDaemon.health} * level)
              </div>
              <div className='damage'>Damage: {level} (1 * level)</div>
              <div className='desc'>{selectedDaemon.desc}</div>
            </div>
          </div>
          <div className='row btns'>
            <button className={classNames('btn shado', { visible: indexIndex > 0 })} onClick={() => onIndexIndexChange(indexIndex-1)}>PREV</button>
            <button className={classNames('btn shado', { visible: indexIndex < daemons.length - 1 })} onClick={() => onIndexIndexChange(indexIndex+1)}>NEXT</button>
          </div>
        </div>}
      </div>
    </div>
  )
}

export default PauseMenu