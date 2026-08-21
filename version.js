// -----------------------------------------------------------------------
// Bump APP_VERSION every time you deploy a change that should force
// users' browsers/installed PWA to drop old cached files and fetch the
// new ones. A simple "1.0.1", "1.0.2"... is enough — it doesn't need to
// match any other version number in the project.
//
// This same file is loaded two ways, so it must work in both:
//  - index.html loads it as a normal <script src="version.js">, where
//    `self` is just `window`.
//  - service-worker.js loads it via importScripts('./version.js'), where
//    `self` is the service worker's global scope.
// -----------------------------------------------------------------------
self.APP_VERSION = '1.0.2';
