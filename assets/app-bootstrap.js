          // Re-init viewport once Three.js is loaded
          const origInit = init;
          init = function () { origInit(); };
          // Three.js is loaded, init already runs on DOMContentLoaded
