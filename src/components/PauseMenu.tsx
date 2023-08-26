import React, { DOMElement, ReactNode, useState } from 'react'
import AudioControls from './AudioControls'
import classNames from 'classnames'
interface PauseMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  restartButton: ReactNode
  onMinimapSizeChange: (s: string, b?: boolean) => void
  persistentNowPlaying: string
  onUnpause: () => void
  minimapSize: string
  controlsGuide: ReactNode
}

type Tab = 
  | 'main'
  | 'credits'
  | 'music'

const PauseMenu: React.FC<PauseMenuProps> = ({ restartButton, controlsGuide, onUnpause, persistentNowPlaying, onMinimapSizeChange, minimapSize }) => {
  const [activeTab, setActiveTab] = useState<Tab>('main')
  const [minimapTransparent, setMinimapTransparent] = useState(true)

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
        </div>
        {activeTab === 'main' && <div className='main-tab wrapperupper tab-contents shado'>
          <AudioControls nowPlaying={persistentNowPlaying} />
          {controlsGuide}
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
      </div>
    </div>
  )
}

export default PauseMenu