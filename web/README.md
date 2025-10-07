# Project Title: bitemporal
A simple web app using Modern JavaScript (ES6+) with unit tests.

## Overview
This app dynamically adds a series of divs to the html index page using a class. The class functions have unit tests (using vitest) defined for each of the class methods. The unit tests are run using the bash command:

```
npm run unit-tests
```

### Example output 
```
> bitemporal@1.0.0 unit-tests
> vitest


 DEV  v3.2.4 C:/Users/paulb/source/workspaces/bitemporal

 ✓ tests/ContentManager.test.mjs (3 tests) 20ms
   ✓ ContentManager.addContent > should append a div with the correct text to the parent 5ms
   ✓ ContentManager.addContent > should append multiple divs if called multiple times 10ms
   ✓ ContentManager.toggleColour > should toggle the alt-colour class on click 4ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  10:58:34
   Duration  1.39s (transform 34ms, setup 0ms, collect 35ms, tests 20ms, environment 971ms, prepare 128ms)

 PASS  Waiting for file changes...
       press h to show help, press q to quit
```

## Future Work
* tbc
