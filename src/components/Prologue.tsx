import React, { useEffect, useRef, useState } from "react"

interface PrologueStats {
  hide: () => void
}

const Prologue: React.FC<PrologueStats> = ({ hide }) => {
  const [page, setPage] = useState(0)
  const [sagaIndex, setSagaIndex] = useState(0)
  const saga = [
    `The world ends in MMCMXXXXVIII.`,
    `The last living exorcist, Damian Fuller, falls asleep for the last time.`,
    `He dreams.`,
    `A seraph.`,
    `SERAPH: HELL IS NOT YET EMPTY.`,
    `DAMIAN: Will it not be filled forever?`,
    `SERAPH: NO, DAMIAN, NOT THIS ONE.`,
    ` THIS WORLD IS ENDED.`,
    ` IT IS TIME THE APOSTATE ANGELS WERE SENT TO THEIR FINAL DOOM.`,
    `Damian knew.`,
    `DAMIAN: The Pit.`,
    `SERAPH: 'WHERE THEIR WORM DIETH NOT, AND THE FIRE IS NOT EXTINGUISHED.'`,
    `DAMIAN: 'For every one shall be salted with fire: and every victim shall be salted with salt.'`,
    `SERAPH: LAY HOLD OF YOUR WEAPONS, PRIEST OF GOD.`,
    ` THE DEMONS HAVE FURTHER YET TO FALL.`,
    ` 'DAMIAN.' THE NAME OF THE CONQUEROR.`,
    ` 'FULLER.' THE NAME OF THE CLEANSER.`,
    ` IN THE THRICE-HOLY NAME OF GOD...`,
    ` LET NONE SURVIVE.`
  ]

  const sagaRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    sagaRef?.current?.scrollTo(0, 9999)
  }, [sagaIndex])
  
  return <div className="overlay prologue">
    <div className="shado notice col">
      <h1>PROLEGOMENON</h1>

      <div className="saga shado" ref={sagaRef}>
        {saga.filter((s, i) => i <= sagaIndex)
          .map((s, i) => <p key={i}>
            {s}
          </p>)}
      </div>

      <div className="row pages">
        <button onClick={() => setSagaIndex(s => s-1)}
          className="prev btn shado" 
          style={{ visibility: sagaIndex > 0 ? 'visible': 'hidden'}}
        >
          PREV
        </button>
        <div className="shado pageNumber"
        >
          {sagaIndex+1}/{saga.length}
        </div>
        <button onClick={() => setSagaIndex(s => s+1)}
          className="next btn shado"
          style={{ visibility: sagaIndex < saga.length - 1 ? 'visible': 'hidden'}}
        >
          NEXT
        </button>
        <button onClick={() => hide()} 
          className="skip btn shado"
        >
          {'CLOSE'}
        </button>
      </div>
    </div>
  </div>
}

export default Prologue