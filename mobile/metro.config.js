// Metro config for the Gulel mobile app inside the monorepo.
// The app keeps its own node_modules (so React Native is never hoisted into the
// web app's tree). @gulel/shared is symlinked in via a file: dependency; we add
// its source folder to watchFolders so Metro picks up live edits.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, '..', 'packages', 'shared');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [sharedRoot];

module.exports = config;
