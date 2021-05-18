# GGOBI Viewer

**A clone of the 'R' based GGOBI Utility**

This is a High Dimensional Viewer based on the 'R' ggobi package


A main applicaiton files are as follows:

- `package.json` - Points to the app's main file and lists its details and dependencies.
- `main.js` - Starts the app and creates a browser window to render HTML. This is the app's **main process**.
- `index.html` - A web page to render. This is the app's **renderer process**.

You can learn more about each of these components within the [Quick Start Guide](http://electron.atom.io/docs/tutorial/quick-start).

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/thesourorange/electron-ggobi.git

cd electron-ggobi
# Install dependencies
npm install
# Package Windows
npm run package-win
# Build Installer
npm run create-installer-win
# Run the app
npm start


[CC0 1.0 (Public Domain)](LICENSE.md)
