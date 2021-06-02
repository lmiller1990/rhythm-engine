This is a personal project. It's a simple rhythm game engine. There's a little demo app to test things out, but it's not really a fully fledged game. 

The engine isn't ready for use in any serious manner, but if you want to try it out, here's how.

## Dependencies

- Install Node.js (obviously). I'm using v14.
- Install [yarn](https://classic.yarnpkg.com/lang/en/). You want v1, aka "classic". One you installed it, `yarn -v` should give you something like `v1.22.10`.
- Clone the project
- Run `yarn install` to install all the dependencies.

## Running

NOTE: there is no guarentee `master` is in a working state.

- The project is bundled with [Rollup](https://rollupjs.org/guide/en/). You probably want to run rollup in watch mode. It will rebuild every time you change the code. Do that with `yarn build:demo --watch`.
- Start the dev server with `yarn start:demo`.
- Go to http://localhost:5000/demo
- Select a song with arrows keys and enter to start.
- The default is four columns. The buttons hard-coded to M < > ?. 
- The default scroll speed is also hard coded, but you can change that.
- Hit "r" to restart the song.
- There is no way to quit. You just need to refresh the page.

## Tests

Unlike the basic demo game, which is just hacked together to try things out, the tests are fully fleshed out and cover everything inside of `src`, which is where the engine lives. Any code change to `src` should have relevant tests added. Since the goal is an *engine*, not a fully fledge game, these must be up to date and coverage all the edge cases. This is the only practical way to work on something like this - testing by hand is time consuming and unreliabe.

## License

There is no license yet. If you really want to use this for something, contact me.
