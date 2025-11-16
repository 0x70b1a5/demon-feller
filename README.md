# Demon Feller

Fella fells fell angels.

## Installation

```sh
yarn
```

## Development

```sh
yarn start
```

## Deployment

### Itch.io

```sh
yarn build
butler push ./build lovecrypt/demon-feller:web
```

### Newgrounds

```sh
yarn build:newgrounds
```

Upload the contents of `build` to Newgrounds as usual. This build sets `PUBLIC_URL` to a relative path so that assets load correctly when Newgrounds serves the game from a subdirectory.

## TODOs

- clicking middle of screen starts the game when the intro is up